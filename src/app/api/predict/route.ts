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
  try {
    // Authenticate request with wallet
    const authRequest = await authenticateRequest(request);
    const { user } = authRequest;

    const { model_id, features_used, features_data, transaction_hash } =
      await request.json();

    // Mock payment validation (in production, validate against blockchain)
    if (!transaction_hash) {
      return NextResponse.json({ error: "Payment required" }, { status: 402 });
    }

    // Get active model
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select("*")
      .eq("id", model_id)
      .eq("is_active", true)
      .single();

    if (modelError || !model) {
      return NextResponse.json(
        { error: "Model not found or inactive" },
        { status: 404 }
      );
    }

    // Download model file from Supabase Storage
    const modelBlob = await downloadModelFile(model.model_path);
    if (!modelBlob) {
      return NextResponse.json(
        { error: "Failed to download model file" },
        { status: 500 }
      );
    }

    // Save model to temporary file
    const tempModelPath = path.join(
      process.cwd(),
      "temp",
      `model_${Date.now()}.pkl`
    );
    const modelBuffer = Buffer.from(await modelBlob.arrayBuffer());
    writeFileSync(tempModelPath, modelBuffer);

    // Run prediction based on features source
    let predictionResult;

    if (features_used === "manual") {
      // Save features to temporary file
      const featuresPath = path.join(
        process.cwd(),
        "temp",
        `features_${Date.now()}.json`
      );
      writeFileSync(featuresPath, JSON.stringify(features_data));

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

    // Clean up model file
    unlinkSync(tempModelPath);

    // Save prediction to database with wallet-aware client
    const supabaseWithWallet = getWalletAwareSupabase(user.wallet_address);
    const { data: prediction, error: predictionError } =
      await supabaseWithWallet
        .from("predictions")
        .insert({
          user_id: user.id,
          model_id,
          prediction_result: predictionResult.prediction,
          prediction_score: predictionResult.confidence,
          features_used,
          features_data: features_used === "manual" ? features_data : null,
          transaction_hash,
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
        transaction_hash,
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
