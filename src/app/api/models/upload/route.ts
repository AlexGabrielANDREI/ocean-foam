import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import slugify from "slugify";

// Create Supabase client with extended timeout and retry configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        "X-Client-Info": "prediction-dashboard/1.0.0",
      },
    },
  }
);

// Retry function for upload operations
async function retryUpload<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log(`🔄 Upload attempt ${attempt} failed:`, errorMessage);

      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }

  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const walletAddress = request.headers.get("x-wallet-address");
    console.log("🔍 Upload API - Wallet address from header:", walletAddress);

    if (!walletAddress) {
      console.log("❌ Upload API - No wallet address provided");
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    console.log(
      "🔍 Upload API - Checking admin status for wallet:",
      walletAddress
    );
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("wallet_address", walletAddress)
      .single();

    console.log("🔍 Upload API - User query result:", { user, userError });

    if (userError) {
      console.log("❌ Upload API - User query error:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user?.role !== "admin") {
      console.log("❌ Upload API - User is not admin:", {
        walletAddress,
        role: user?.role,
      });
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    console.log(
      "✅ Upload API - Admin access confirmed for wallet:",
      walletAddress
    );

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const modelFile = formData.get("modelFile") as File;
    const featuresFile = formData.get("featuresFile") as File | null;
    const useManualFeatures = formData.get("useManualFeatures") === "true";
    const ownerWalletAddress = (
      (formData.get("ownerWalletAddress") as string) || walletAddress
    ).toLowerCase();

    console.log("🔍 Upload API - Form data received:", {
      name,
      description: description?.substring(0, 50) + "...",
      modelFileName: modelFile?.name,
      modelFileSize: modelFile?.size,
      featuresFileName: featuresFile?.name,
      useManualFeatures,
      ownerWalletAddress,
    });

    if (!name || !modelFile) {
      console.log("❌ Upload API - Missing required fields:", {
        name: !!name,
        modelFile: !!modelFile,
      });
      return NextResponse.json(
        { error: "Name and model file are required" },
        { status: 400 }
      );
    }

    // Validate model file
    if (!modelFile.name.endsWith(".pkl")) {
      console.log("❌ Upload API - Invalid model file type:", modelFile.name);
      return NextResponse.json(
        { error: "Model file must be a .pkl file" },
        { status: 400 }
      );
    }

    if (modelFile.size > 50 * 1024 * 1024) {
      console.log("❌ Upload API - Model file too large:", modelFile.size);
      return NextResponse.json(
        { error: "Model file size must be less than 50MB" },
        { status: 400 }
      );
    }

    // Validate features file if provided
    if (useManualFeatures && featuresFile) {
      if (!featuresFile.name.endsWith(".json")) {
        console.log(
          "❌ Upload API - Invalid features file type:",
          featuresFile.name
        );
        return NextResponse.json(
          { error: "Features file must be a .json file" },
          { status: 400 }
        );
      }

      if (featuresFile.size > 1 * 1024 * 1024) {
        console.log(
          "❌ Upload API - Features file too large:",
          featuresFile.size
        );
        return NextResponse.json(
          { error: "Features file size must be less than 1MB" },
          { status: 400 }
        );
      }
    }

    console.log("✅ Upload API - File validation passed");

    // Convert files to buffers
    const modelBuffer = Buffer.from(await modelFile.arrayBuffer());
    const featuresBuffer = featuresFile
      ? Buffer.from(await featuresFile.arrayBuffer())
      : null;

    // Generate model hash
    const modelHash = crypto
      .createHash("sha256")
      .update(modelBuffer)
      .digest("hex");
    console.log("🔍 Upload API - Generated model hash:", modelHash);

    // Generate version number
    console.log("🔍 Upload API - Checking existing models for version");
    const { data: existingModels, error: versionError } = await supabase
      .from("models")
      .select("version")
      .eq("name", name)
      .order("version", { ascending: false })
      .limit(1);

    if (versionError) {
      console.log("❌ Upload API - Version query error:", versionError);
      return NextResponse.json(
        { error: "Failed to check model version" },
        { status: 500 }
      );
    }

    const version =
      existingModels && existingModels.length > 0
        ? existingModels[0].version + 1
        : 1;
    console.log("🔍 Upload API - Model version:", version);

    // Slugify model name for folder
    const modelFolder = `${ownerWalletAddress}/${slugify(name, {
      lower: true,
      strict: true,
      replacement: "_",
    })}`;
    const modelFilePath = `${modelFolder}/model.pkl`;
    const featuresFilePath = `${modelFolder}/features.json`;

    // Upload model file (always overwrite)
    await retryUpload(() =>
      supabase.storage.from("ml-models").upload(modelFilePath, modelBuffer, {
        upsert: true,
        contentType: "application/octet-stream",
      })
    );
    // Upload features file if present
    if (useManualFeatures && featuresBuffer) {
      await retryUpload(() =>
        supabase.storage
          .from("features-uploads")
          .upload(featuresFilePath, featuresBuffer, {
            upsert: true,
            contentType: "application/json",
          })
      );
    }

    // Create model record in database
    console.log("🔍 Upload API - Creating model record in database");
    const { data: model, error: dbError } = await supabase
      .from("models")
      .insert({
        name,
        description,
        version,
        model_path: modelFilePath,
        features_path:
          useManualFeatures && featuresBuffer ? featuresFilePath : null,
        model_hash: modelHash,
        owner_wallet: ownerWalletAddress,
        is_active: false,
        use_manual_features: useManualFeatures,
        nft_id: null, // Will be set in activation step
      })
      .select()
      .single();

    if (dbError) {
      console.error("❌ Upload API - Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to create model record" },
        { status: 500 }
      );
    }

    console.log("✅ Upload API - Model record created successfully:", model.id);

    return NextResponse.json({
      success: true,
      model: {
        id: model.id,
        name: model.name,
        description: model.description,
        version: model.version,
        model_path: model.model_path,
        model_hash: model.model_hash,
        owner_wallet: model.owner_wallet,
        use_manual_features: model.use_manual_features,
        is_active: model.is_active,
      },
    });
  } catch (error) {
    console.error("❌ Upload API - Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
