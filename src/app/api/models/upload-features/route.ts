import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import slugify from "slugify";

export const dynamic = "force-dynamic";

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
    const file = formData.get("file") as File;
    const modelName = formData.get("modelName") as string;
    if (!file) {
      return NextResponse.json(
        { error: "No features file provided" },
        { status: 400 }
      );
    }
    if (!modelName) {
      return NextResponse.json(
        { error: "Model name required" },
        { status: 400 }
      );
    }
    if (!file.name.endsWith(".json")) {
      return NextResponse.json(
        { error: "Features file must be a .json file" },
        { status: 400 }
      );
    }
    if (file.size > 1 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Features file size must be less than 1MB" },
        { status: 400 }
      );
    }
    // Slugify model name for folder
    const modelFolder = `${walletAddress.toLowerCase()}/${slugify(modelName, {
      lower: true,
      strict: true,
      replacement: "_",
    })}`;
    const filePath = `${modelFolder}/features.json`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("features-uploads")
      .upload(filePath, buffer, {
        upsert: true,
        contentType: "application/json",
      });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }
    return NextResponse.json({ features_path: filePath });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
