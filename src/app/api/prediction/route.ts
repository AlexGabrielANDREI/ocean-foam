import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { spawn } from "child_process";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const walletAddress = request.headers.get("x-wallet-address");
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const modelId = formData.get("modelId") as string;
    const featuresFile = formData.get("featuresFile") as File | null;
    const apiParams = formData.get("apiParams") as string | null;

    if (!modelId) {
      return NextResponse.json(
        { error: "Model ID is required" },
        { status: 400 }
      );
    }

    // Get model details
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select("*")
      .eq("id", modelId)
      .eq("is_active", true)
      .single();

    if (modelError || !model) {
      return NextResponse.json(
        { error: "Model not found or not active" },
        { status: 404 }
      );
    }

    // Check if user exists (tokens not implemented in current schema)
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("wallet_address", walletAddress)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let predictionResult: any = null;
    let tempFiles: string[] = [];

    try {
      if (model.use_manual_features) {
        // Manual features flow
        if (!featuresFile) {
          return NextResponse.json(
            { error: "Features file required for manual features model" },
            { status: 400 }
          );
        }

        // Validate features file
        if (!featuresFile.name.endsWith(".json")) {
          return NextResponse.json(
            { error: "Features file must be a .json file" },
            { status: 400 }
          );
        }

        if (featuresFile.size > 1 * 1024 * 1024) {
          return NextResponse.json(
            { error: "Features file size must be less than 1MB" },
            { status: 400 }
          );
        }

        // Download model file from storage
        const { data: modelData, error: modelDownloadError } =
          await supabase.storage.from("models").download(model.model_path);

        if (modelDownloadError || !modelData) {
          return NextResponse.json(
            { error: "Failed to download model file" },
            { status: 500 }
          );
        }

        // Save model and features to temp files
        const tempDir = os.tmpdir();
        const modelTempPath = path.join(tempDir, `model_${Date.now()}.pkl`);
        const featuresTempPath = path.join(
          tempDir,
          `features_${Date.now()}.json`
        );

        await writeFile(
          modelTempPath,
          Buffer.from(await modelData.arrayBuffer())
        );
        await writeFile(
          featuresTempPath,
          Buffer.from(await featuresFile.arrayBuffer())
        );

        tempFiles.push(modelTempPath, featuresTempPath);

        // Run manual features prediction script
        predictionResult = await runManualFeaturesPrediction(
          modelTempPath,
          featuresTempPath
        );
      } else {
        // API features flow
        let apiParamsObj = {};
        if (apiParams) {
          try {
            apiParamsObj = JSON.parse(apiParams);
          } catch (e) {
            return NextResponse.json(
              { error: "Invalid API parameters JSON" },
              { status: 400 }
            );
          }
        }

        // Download model file from storage
        const { data: modelData, error: modelDownloadError } =
          await supabase.storage.from("models").download(model.model_path);

        if (modelDownloadError || !modelData) {
          return NextResponse.json(
            { error: "Failed to download model file" },
            { status: 500 }
          );
        }

        // Save model to temp file
        const tempDir = os.tmpdir();
        const modelTempPath = path.join(tempDir, `model_${Date.now()}.pkl`);
        const apiParamsTempPath = path.join(
          tempDir,
          `api_params_${Date.now()}.json`
        );

        await writeFile(
          modelTempPath,
          Buffer.from(await modelData.arrayBuffer())
        );
        await writeFile(apiParamsTempPath, JSON.stringify(apiParamsObj));

        tempFiles.push(modelTempPath, apiParamsTempPath);

        // Run API features prediction script
        predictionResult = await runAPIFeaturesPrediction(
          modelTempPath,
          apiParamsTempPath
        );
      }

      if (!predictionResult.success) {
        return NextResponse.json(
          { error: predictionResult.error },
          { status: 500 }
        );
      }

      // Log prediction (tokens not implemented in current schema)
      await supabase.from("predictions").insert({
        user_wallet: walletAddress,
        model_id: modelId,
        prediction_result: predictionResult,
        tokens_used: 0, // No tokens in current schema
        prediction_type: model.use_manual_features
          ? "manual_features"
          : "api_features",
      });

      return NextResponse.json({
        success: true,
        prediction: predictionResult,
        tokens_remaining: 0, // No tokens in current schema
      });
    } finally {
      // Clean up temp files
      for (const tempFile of tempFiles) {
        try {
          await unlink(tempFile);
        } catch (e) {
          console.error(`Failed to delete temp file ${tempFile}:`, e);
        }
      }
    }
  } catch (error) {
    console.error("Prediction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function runManualFeaturesPrediction(
  modelPath: string,
  featuresPath: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(
      process.cwd(),
      "scripts",
      "prediction",
      "manual_features.py"
    );

    const pythonProcess = spawn("python", [
      scriptPath,
      modelPath,
      featuresPath,
    ]);

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          reject(new Error("Failed to parse prediction result"));
        }
      } else {
        reject(new Error(`Python script failed: ${stderr}`));
      }
    });

    pythonProcess.on("error", (error) => {
      reject(new Error(`Failed to run Python script: ${error.message}`));
    });
  });
}

async function runAPIFeaturesPrediction(
  modelPath: string,
  apiParamsPath: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(
      process.cwd(),
      "scripts",
      "prediction",
      "api_features.py"
    );

    const pythonProcess = spawn("python", [
      scriptPath,
      modelPath,
      apiParamsPath,
    ]);

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          reject(new Error("Failed to parse prediction result"));
        }
      } else {
        reject(new Error(`Python script failed: ${stderr}`));
      }
    });

    pythonProcess.on("error", (error) => {
      reject(new Error(`Failed to run Python script: ${error.message}`));
    });
  });
}
