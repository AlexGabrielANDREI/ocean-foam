import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import slugify from "slugify";

// Create Supabase client with service role key (bypasses RLS)
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

export async function POST(request: NextRequest) {
  try {
    const walletAddress = request.headers.get("x-wallet-address");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("wallet_address", walletAddress)
      .single();

    if (userError) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user?.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const modelId = formData.get("modelId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const version = parseInt(formData.get("version") as string);
    const ownerWallet = formData.get("ownerWallet") as string;
    const useManualFeatures = formData.get("useManualFeatures") === "true";

    if (!modelId || !name) {
      return NextResponse.json(
        { error: "Model ID and name are required" },
        { status: 400 }
      );
    }

    // Get current model data
    const { data: currentModel, error: modelError } = await supabase
      .from("models")
      .select("*")
      .eq("id", modelId)
      .single();

    if (modelError || !currentModel) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      name,
      description,
      version,
      owner_wallet: ownerWallet,
      use_manual_features: useManualFeatures,
    };

    // Handle model file upload if provided
    const modelFile = formData.get("modelFile") as File;
    if (modelFile) {
      const modelBuffer = await modelFile.arrayBuffer();
      const modelFolder = `${ownerWallet}/${slugify(name, {
        lower: true,
        strict: true,
        replacement: "_",
      })}`;
      const modelFilePath = `${modelFolder}/model.pkl`;

      const { error: uploadError } = await supabase.storage
        .from("ml-models")
        .upload(modelFilePath, modelBuffer, {
          upsert: true,
          contentType: "application/octet-stream",
        });

      if (uploadError) {
        return NextResponse.json(
          { error: "Failed to upload model file" },
          { status: 500 }
        );
      }

      // Generate new model hash
      const crypto = await import("crypto");
      const modelHash = crypto
        .createHash("sha256")
        .update(modelBuffer)
        .digest("hex");

      updateData.model_path = modelFilePath;
      updateData.model_hash = modelHash;
    }

    // Handle features file upload if provided
    const featuresFile = formData.get("featuresFile") as File;
    if (featuresFile) {
      const featuresBuffer = await featuresFile.arrayBuffer();
      const modelFolder = `${ownerWallet}/${slugify(name, {
        lower: true,
        strict: true,
        replacement: "_",
      })}`;
      const featuresFilePath = `${modelFolder}/features.json`;

      const { error: uploadError } = await supabase.storage
        .from("features-uploads")
        .upload(featuresFilePath, featuresBuffer, {
          upsert: true,
          contentType: "application/json",
        });

      if (uploadError) {
        return NextResponse.json(
          { error: "Failed to upload features file" },
          { status: 500 }
        );
      }

      updateData.features_path = featuresFilePath;
    }

    // Handle EDA file upload if provided
    const edaFile = formData.get("edaFile") as File;
    if (edaFile) {
      // Delete old EDA file if it exists
      if (currentModel.eda_path) {
        await supabase.storage
          .from("eda-reports")
          .remove([currentModel.eda_path]);
      }

      const edaBuffer = await edaFile.arrayBuffer();
      const modelFolder = `${ownerWallet}/${slugify(name, {
        lower: true,
        strict: true,
        replacement: "_",
      })}`;
      const edaFilePath = `${modelFolder}/eda.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("eda-reports")
        .upload(edaFilePath, edaBuffer, {
          upsert: true,
          contentType: "application/pdf",
        });

      if (uploadError) {
        return NextResponse.json(
          { error: "Failed to upload EDA file" },
          { status: 500 }
        );
      }

      updateData.eda_path = edaFilePath;
    }

    // Update model in database
    const { data: updatedModel, error: updateError } = await supabase
      .from("models")
      .update(updateData)
      .eq("id", modelId)
      .select()
      .single();

    if (updateError) {
      console.error("Database update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update model" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      model: updatedModel,
    });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
