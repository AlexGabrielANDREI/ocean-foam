import { NextRequest, NextResponse } from "next/server";
import { supabase, downloadModelFile, STORAGE_BUCKETS } from "@/lib/supabase";
import {
  authenticateRequest,
  getWalletAwareSupabase,
} from "@/lib/auth-middleware";
import {
  verifyUserPayment,
  recordPaymentTransaction,
} from "@/lib/payment-validation";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, unlinkSync } from "fs";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  console.log("[DEBUG] Entered POST /api/predict handler");
  try {
    // Authenticate request with wallet
    const authRequest = await authenticateRequest(request);
    const { user } = authRequest;

    // Get transaction hash from headers
    const transactionHash = request.headers.get("x-transaction-hash");

    // Validate payment and store result
    let paymentValidation: any = null;

    if (transactionHash) {
      console.log(
        "[DEBUG] Validating payment for transaction:",
        transactionHash
      );
      paymentValidation = await verifyUserPayment(
        user.wallet_address,
        transactionHash
      );

      if (!paymentValidation.isValid) {
        return NextResponse.json(
          { error: `Payment validation failed: ${paymentValidation.reason}` },
          { status: 402 }
        );
      }

      console.log("[DEBUG] Payment validation successful");
    } else {
      // If no transaction hash provided, check for existing valid payment
      console.log(
        "[DEBUG] No transaction hash provided, checking for existing payment"
      );
      paymentValidation = await verifyUserPayment(user.wallet_address);

      if (!paymentValidation.isValid) {
        return NextResponse.json(
          { error: `Payment required: ${paymentValidation.reason}` },
          { status: 402 }
        );
      }

      console.log("[DEBUG] Existing payment validation successful");
    }

    // Find the single active model
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select("*")
      .eq("is_active", true)
      .single();

    if (modelError || !model) {
      return NextResponse.json(
        { error: "No active model found" },
        { status: 404 }
      );
    }

    // Use model_hash as cache key in system temp directory
    const tempDir = os.tmpdir();
    const cachedModelPath = path.join(tempDir, `model_${model.model_hash}.pkl`);
    console.log("[Model Cache] Using temp directory:", tempDir);
    console.log("[Model Cache] Using cache path:", cachedModelPath);
    let useCachedModel = false;
    try {
      // Check if cached model exists
      await import("fs/promises").then(async (fs) => {
        await fs.access(cachedModelPath);
        useCachedModel = true;
      });
    } catch (e) {
      useCachedModel = false;
    }

    if (!useCachedModel) {
      console.log("[DEBUG] Model not cached, downloading from Supabase");
      // Download model file from Supabase Storage
      const modelBlob = await downloadModelFile(model.model_path);
      if (!modelBlob) {
        return NextResponse.json(
          { error: "Failed to download model file" },
          { status: 500 }
        );
      }
      // System temp directory (/tmp on Vercel) always exists, no need to create
      // Save model to cache file
      const modelBuffer = Buffer.from(await modelBlob.arrayBuffer());
      try {
        writeFileSync(cachedModelPath, modelBuffer);
        console.log(
          "[Model Cache] Model file written to cache:",
          cachedModelPath
        );
      } catch (err) {
        console.error("[Model Cache] Error writing model file to cache:", err);
      }
    }

    // Use the cached model path for prediction
    const tempModelPath = cachedModelPath;

    let predictionResult;

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
      // Save features to temporary file in system temp directory
      const featuresPath = path.join(tempDir, `features_${Date.now()}.json`);
      const featuresBuffer = Buffer.from(await featuresBlob.arrayBuffer());
      writeFileSync(featuresPath, featuresBuffer);
      // Run manual prediction script
      const { stdout } = await execAsync(
        `python scripts/predict_manual.py "${tempModelPath}" "${featuresPath}"`
      );
      predictionResult = JSON.parse(stdout);
      // Clean up temporary files
      unlinkSync(featuresPath);
    } else {
      // Run API prediction script
      const { stdout } = await execAsync(
        `python scripts/predict_api.py "${tempModelPath}"`
      );
      predictionResult = JSON.parse(stdout);
    }

    // Clean up model file: REMOVE THIS LINE (do not delete cached model)
    // unlinkSync(tempModelPath);

    // Save prediction to database with validated transaction hash
    const supabaseWithWallet = getWalletAwareSupabase(user.wallet_address);
    const { data: prediction, error: predictionError } =
      await supabaseWithWallet
        .from("predictions")
        .insert({
          user_id: user.id,
          model_id: model.id,
          prediction_result: predictionResult.prediction,
          prediction_score: predictionResult.confidence,
          features_used: model.use_manual_features ? "manual" : "api",
          features_data: null,
          transaction_hash: paymentValidation.transactionHash, // Use validated transaction hash
        })
        .select()
        .single();

    if (predictionError) {
      return NextResponse.json(
        { error: "Failed to save prediction" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      prediction: {
        id: prediction.id,
        result: predictionResult.prediction,
        confidence: predictionResult.confidence,
        probabilities: predictionResult.probabilities,
      },
    });
  } catch (error) {
    console.error("Prediction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
