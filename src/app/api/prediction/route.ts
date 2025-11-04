import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyUserPayment } from "@/lib/payment-validation";
import { writeFile, unlink, readFile } from "fs/promises";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { promisify } from "util";

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

    // Check if payment gate is enabled
    const paymentGateEnabled = process.env.PAYMENT_GATE !== "false";
    console.log("[DEBUG] Payment gate enabled:", paymentGateEnabled);

    let paymentValidation: any = null;

    if (paymentGateEnabled) {
      // Validate payment - only pass transaction hash if it's not empty
      console.log("[DEBUG] Validating payment for wallet:", walletAddress);
      paymentValidation = await verifyUserPayment(
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
    } else {
      console.log("[DEBUG] Payment validation SKIPPED (PAYMENT_GATE=false)");
    }

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

        // Call Python serverless function for prediction
        // Pass model path instead of buffer to avoid payload size limits
        const featuresData = JSON.parse(
          await readFile(featuresTempPath, "utf-8")
        );

        predictionResult = await callPythonPrediction(
          modelTempPath, // Pass path instead of buffer
          model.model_path, // Pass Supabase storage path for fallback
          featuresData
        );

        console.log("Final prediction result:", predictionResult);
      } else {
        // API features flow (mock data for now)
        // TODO: Replace with actual API data fetching
        const mockFeatures = {}; // Placeholder
        predictionResult = await callPythonPrediction(
          modelTempPath, // Pass path instead of buffer
          model.model_path, // Pass Supabase storage path for fallback
          mockFeatures
        );
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
        transaction_hash:
          paymentValidation?.transactionHash || transactionHash || null, // Use validated transaction hash or provided hash
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
          transaction_hash:
            paymentValidation?.transactionHash || transactionHash || null, // Store the validated transaction hash or provided hash
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

/**
 * Call Python serverless function to run prediction
 * Uses Vercel's Python runtime via internal API call
 * Passes model file path instead of model data to avoid payload size limits
 * Includes Supabase path as fallback if file not found locally
 */
async function callPythonPrediction(
  modelPath: string,
  supabaseStoragePath: string,
  features: any
): Promise<any> {
  try {
    // Check if we're on Vercel (production) or local development
    const isVercel = !!process.env.VERCEL;

    if (isVercel) {
      // On Vercel: Use HTTP call to Python serverless function
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      console.log("[Python Prediction] Calling Python function at:", baseUrl);
      console.log("[Python Prediction] Model path:", modelPath);
      console.log(
        "[Python Prediction] Supabase storage path:",
        supabaseStoragePath
      );

      const response = await fetch(`${baseUrl}/api/run-prediction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_path: modelPath, // Local path (may not exist in Python container)
          supabase_storage_path: supabaseStoragePath, // Fallback: download from Supabase
          features: features,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Python prediction failed: ${response.status} ${errorText}`
        );
      }

      const result = await response.json();
      console.log("[Python Prediction] Success:", result);

      return result;
    } else {
      // Local development: Use child_process to run Python script directly
      console.log(
        "[Python Prediction] Running Python locally via child_process"
      );
      console.log("[Python Prediction] Model path:", modelPath);

      return new Promise((resolve, reject) => {
        const pythonScript = path.join(
          process.cwd(),
          "scripts",
          "predict_api.py"
        );
        const featuresJson = JSON.stringify(features);

        // Try different Python commands (python, python3, py)
        const pythonCommands = ["python", "python3", "py"];

        const tryNextCommand = (index: number) => {
          if (index >= pythonCommands.length) {
            reject(
              new Error(
                `Python not found. Tried: ${pythonCommands.join(
                  ", "
                )}. Please install Python or add it to PATH.`
              )
            );
            return;
          }

          const pythonCommand = pythonCommands[index];
          console.log(
            `[Python Prediction] Trying Python command: ${pythonCommand}`
          );

          const pythonProcess = spawn(pythonCommand, [
            pythonScript,
            modelPath,
            featuresJson,
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
            if (code !== 0) {
              console.error("[Python Prediction] Python stderr:", stderr);
              reject(
                new Error(`Python script exited with code ${code}: ${stderr}`)
              );
              return;
            }

            try {
              const result = JSON.parse(stdout);
              console.log("[Python Prediction] Success:", result);
              resolve(result);
            } catch (error) {
              console.error(
                "[Python Prediction] Failed to parse output:",
                stdout
              );
              reject(new Error(`Failed to parse Python output: ${error}`));
            }
          });

          pythonProcess.on("error", (error: NodeJS.ErrnoException) => {
            if (error.code === "ENOENT") {
              // Command not found, try next command
              console.log(
                `[Python Prediction] ${pythonCommand} not found, trying next...`
              );
              tryNextCommand(index + 1);
            } else {
              console.error(
                "[Python Prediction] Failed to start Python:",
                error
              );
              reject(
                new Error(`Failed to start Python process: ${error.message}`)
              );
            }
          });
        };

        tryNextCommand(0);
      });
    }
  } catch (error) {
    console.error("[Python Prediction] Error:", error);
    throw error;
  }
}
