import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import slugify from "slugify";

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
    const file = formData.get("file") as File;
    const modelName = formData.get("modelName") as string;
    const modelId = formData.get("modelId") as string;

    if (!file || !modelName) {
      return NextResponse.json(
        { error: "File and model name are required" },
        { status: 400 }
      );
    }

    if (!file.name.endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Delete old EDA file if modelId is provided (for editing existing model)
    if (modelId) {
      try {
        // Get the current model to find the old EDA path
        const { data: model, error: modelError } = await supabase
          .from("models")
          .select("eda_path")
          .eq("id", modelId)
          .single();

        if (!modelError && model?.eda_path) {
          // Delete the old EDA file
          const { error: deleteError } = await supabase.storage
            .from("eda-reports")
            .remove([model.eda_path]);

          if (deleteError) {
            console.warn("Failed to delete old EDA file:", deleteError);
            // Continue with upload even if deletion fails
          } else {
            console.log("Successfully deleted old EDA file:", model.eda_path);
          }
        }
      } catch (error) {
        console.warn("Error deleting old EDA file:", error);
        // Continue with upload even if deletion fails
      }
    }

    // Create file path
    const modelFolder = `${walletAddress}/${slugify(modelName, {
      lower: true,
      strict: true,
      replacement: "_",
    })}`;
    const edaFilePath = `${modelFolder}/eda.pdf`;

    // Upload file to storage
    const fileBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("eda-reports")
      .upload(edaFilePath, fileBuffer, {
        upsert: true,
        contentType: "application/pdf",
      });

    if (uploadError) {
      console.error("EDA upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload EDA file" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      eda_path: edaFilePath,
    });
  } catch (error) {
    console.error("EDA upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
