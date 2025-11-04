import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyUserPayment } from "@/lib/payment-validation";
import { spawn } from "child_process";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import os from "os";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const walletAddress = request.headers.get("x-wallet-address");
    const transactionHash = request.headers.get("x-transaction-hash");

    console.log("[DEBUG] API received request:", {
      walletAddress,
      transactionHash,
      hasTransactionHash: !!transactionHash && transactionHash.trim() !== "",
      allHeaders: Object.fromEntries(request.headers.entries()),
    });

    if (!walletAddress) {
      console.log("[DEBUG] No wallet address provided");
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 401 }
      );
    }

    // Validate payment - only pass transaction hash if it's not empty
    console.log("[DEBUG] Validating payment for wallet:", walletAddress);
    const paymentValidation = await verifyUserPayment(
      walletAddress,
      transactionHash && transactionHash.trim() !== ""
        ? transactionHash
        : undefined
    );

    console.log("[DEBUG] Payment validation result:", paymentValidation);

    if (!paymentValidation.isValid) {
      console.log(
        "[DEBUG] Payment validation failed:",
        paymentValidation.reason
      );
      return NextResponse.json(
        { error: `Payment required: ${paymentValidation.reason}` },
        { status: 402 }
      );
    }

    console.log("[DEBUG] Payment validation successful");

    // Find the single active model
    console.log("[DEBUG] Looking for active model...");
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select("*")
      .eq("is_active", true)
      .single();

    if (modelError || !model) {
      console.error("[DEBUG] Model lookup error:", modelError);
      console.error("[DEBUG] No active model found");
      return NextResponse.json(
        { error: "No active model found" },
        { status: 404 }
      );
    }

    console.log("[DEBUG] Active model found:", {
      id: model.id,
      name: model.name,
      is_active: model.is_active,
      use_manual_features: model.use_manual_features,
    });

    let predictionResult: any = null;
    let tempFiles: string[] = [];
    let modelTempPath: string | undefined = undefined;

    try {
      // Use system temp directory (writable on Vercel serverless functions)
      // os.tmpdir() returns /tmp on Linux (Vercel) and appropriate temp dir on Windows/macOS
      const tempDir = os.tmpdir();
      console.log("[Model Cache] Using temp directory:", tempDir);
      const cachedModelPath = path.join(
        tempDir,
        `model_${model.model_hash}.pkl`
      );
      let useCachedModel = false;
      try {
        await import("fs/promises").then(async (fs) => {
          await fs.access(cachedModelPath);
          useCachedModel = true;
        });
      } catch (e) {
        useCachedModel = false;
      }
      modelTempPath = cachedModelPath;
      if (!useCachedModel) {
        // Download model file from storage
        console.log(
          "[Model Cache] Model not cached, downloading from Supabase"
        );
        const { data: modelData, error: modelDownloadError } =
          await supabase.storage.from("ml-models").download(model.model_path);
        if (modelDownloadError || !modelData) {
          return NextResponse.json(
            { error: "Failed to download model file" },
            { status: 500 }
          );
        }
        await writeFile(
          cachedModelPath,
          Buffer.from(await modelData.arrayBuffer())
        );
        console.log(
          "[Model Cache] Model file written to cache:",
          cachedModelPath
        );
      } else {
        console.log("[Model Cache] Using cached model file:", cachedModelPath);
      }
      tempFiles.push(modelTempPath);

      if (model.use_manual_features) {
        // Download features file from storage
        const { data: featuresBlob, error: featuresError } =
          await supabase.storage
            .from("features-uploads")
            .download(model.features_path);
        if (featuresError || !featuresBlob) {
          return NextResponse.json(
            { error: "Failed to download features file" },
            { status: 500 }
          );
        }
        const featuresTempPath = path.join(
          tempDir,
          `features_${Date.now()}.json`
        );
        await writeFile(
          featuresTempPath,
          Buffer.from(await featuresBlob.arrayBuffer())
        );
        tempFiles.push(featuresTempPath);
        // Run manual features prediction script and log all output
        const { spawn } = require("child_process");
        const py = spawn("python", [
          "scripts/predict_manual.py",
          modelTempPath,
          featuresTempPath,
        ]);
        let pyStdout = "";
        let pyStderr = "";
        py.stdout.on("data", (data: Buffer) => {
          pyStdout += data.toString();
        });
        py.stderr.on("data", (data: Buffer) => {
          pyStderr += data.toString();
        });
        await new Promise<void>((resolve, reject) => {
          py.on("close", (code: number) => {
            console.log("PYTHON STDOUT:", pyStdout);
            if (pyStderr) console.error("PYTHON STDERR:", pyStderr);
            if (code !== 0) reject(new Error("Python script failed"));
            else resolve();
          });
        });
        // Robustly parse the first valid JSON object from pyStdout
        console.log("Raw Python stdout:", pyStdout);
        console.log("Python stdout length:", pyStdout.length);

        // Try to parse the entire stdout first
        try {
          predictionResult = JSON.parse(pyStdout.trim());
          console.log("Successfully parsed entire stdout");
        } catch (e) {
          console.log("Failed to parse entire stdout, trying line by line");
          // If that fails, try line by line
          for (const line of pyStdout.split(/\r?\n/)) {
            const trimmedLine = line.trim();
            if (trimmedLine) {
              try {
                const obj = JSON.parse(trimmedLine);
                predictionResult = obj;
                console.log("Successfully parsed line:", trimmedLine);
                break;
              } catch (e) {
                console.log("Failed to parse line:", trimmedLine);
              }
            }
          }
        }

        if (!predictionResult) {
          console.error("Failed to parse any JSON from Python output");
          console.error("Python stdout:", pyStdout);
          throw new Error("No valid JSON result from Python script");
        }

        console.log("Final prediction result:", predictionResult);
      } else {
        // API features flow (no params)
        predictionResult = await runAPIFeaturesPrediction(modelTempPath, "");
      }

      console.log("Before validation - predictionResult:", predictionResult);
      console.log(
        "Before validation - typeof predictionResult:",
        typeof predictionResult
      );
      console.log(
        "Before validation - predictionResult === null:",
        predictionResult === null
      );
      console.log(
        "Before validation - predictionResult === undefined:",
        predictionResult === undefined
      );

      // Robustly handle prediction result
      if (
        !predictionResult ||
        (typeof predictionResult === "object" && "error" in predictionResult)
      ) {
        console.error("Prediction result validation failed:", predictionResult);
        return NextResponse.json(
          { error: predictionResult?.error || "Prediction failed" },
          { status: 500 }
        );
      }

      console.log("Prediction result structure:", {
        hasPrediction: !!predictionResult.prediction,
        hasConfidence: !!predictionResult.confidence,
        hasProbabilities: !!predictionResult.probabilities,
        predictionType: typeof predictionResult.prediction,
        confidenceType: typeof predictionResult.confidence,
        predictionValue: predictionResult.prediction,
        confidenceValue: predictionResult.confidence,
      });

      // Look up user by wallet address
      console.log("Looking up user with wallet address:", walletAddress);
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("wallet_address", walletAddress)
        .single();
      if (userError || !user) {
        console.error("User lookup error:", userError);
        console.error("User lookup failed for wallet:", walletAddress);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      console.log("User found:", { userId: user.id, walletAddress });

      // Log prediction with transaction hash
      console.log("Inserting prediction with data:", {
        user_id: user.id,
        model_id: model.id,
        prediction_result: predictionResult.prediction,
        prediction_score: predictionResult.confidence,
        features_used: model.use_manual_features ? "manual" : "api",
        features_data: predictionResult.probabilities,
        transaction_hash: paymentValidation.transactionHash, // Use validated transaction hash
      });

      // Use wallet-specific client for prediction insertion to pass RLS policies
      const supabaseWithWallet = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          global: {
            headers: {
              "x-wallet-address": walletAddress,
            },
          },
        }
      );

      const { error: insertError } = await supabaseWithWallet
        .from("predictions")
        .insert({
          user_id: user.id,
          model_id: model.id,
          prediction_result: predictionResult.prediction, // string
          prediction_score: predictionResult.confidence, // number
          features_used: model.use_manual_features ? "manual" : "api",
          features_data: predictionResult.probabilities, // or null
          transaction_hash: paymentValidation.transactionHash, // Store the validated transaction hash
        });
      if (insertError) {
        console.error("Insert prediction error:", insertError);
        return NextResponse.json(
          { error: "Failed to log prediction" },
          { status: 500 }
        );
      }

      console.log("Prediction inserted successfully");

      return NextResponse.json({
        success: true,
        prediction: predictionResult,
        tokens_remaining: 0,
      });
    } finally {
      // Only clean up non-cached temp files (do not delete cached model file)
      // Remove the cached model file from tempFiles before cleanup
      if (modelTempPath) {
        const modelIndex = tempFiles.indexOf(modelTempPath);
        if (modelIndex !== -1) {
          tempFiles.splice(modelIndex, 1);
        }
      }
      for (const tempFile of tempFiles) {
        try {
          await unlink(tempFile);
        } catch (e) {}
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
