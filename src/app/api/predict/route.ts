import { NextRequest, NextResponse } from "next/server";
import { supabase, downloadModelFile, STORAGE_BUCKETS } from "@/lib/supabase";
import {
  authenticateRequest,
  getWalletAwareSupabase,
} from "@/lib/auth-middleware";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, unlinkSync } from "fs";
import path from "path";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  console.log("[DEBUG] Entered POST /api/predict handler");
  try {
    // Authenticate request with wallet
    const authRequest = await authenticateRequest(request);
    const { user } = authRequest;

    // No need to parse request body

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

    // Use model_hash as cache key
    const cachedModelPath = path.join(
      process.cwd(),
      "temp",
      `model_${model.model_hash}.pkl`
    );
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
      // Ensure temp directory exists
      try {
        const fs = await import("fs/promises");
        await fs.mkdir(path.join(process.cwd(), "temp"), { recursive: true });
      } catch (mkdirErr) {
        console.error("[Model Cache] Error ensuring temp directory:", mkdirErr);
      }
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
      // Save features to temporary file
      const featuresPath = path.join(
        process.cwd(),
        "temp",
        `features_${Date.now()}.json`
      );
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

    // Save prediction to database with wallet-aware client
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
          transaction_hash: null,
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
