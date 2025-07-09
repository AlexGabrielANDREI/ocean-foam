import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const walletAddress = request.headers
      .get("x-wallet-address")
      ?.toLowerCase();
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from("users")
      .select("role")
      .eq("wallet_address", walletAddress)
      .single();

    if (!user?.role || user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { model_id, nft_id } = await request.json();

    if (!model_id || !nft_id) {
      return NextResponse.json(
        { error: "Model ID and NFT ID are required" },
        { status: 400 }
      );
    }

    // Check if model exists and belongs to the admin (case-insensitive wallet matching)
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select("*")
      .eq("id", model_id)
      .ilike("owner_wallet", walletAddress)
      .single();

    if (modelError || !model) {
      return NextResponse.json(
        { error: "Model not found or access denied" },
        { status: 404 }
      );
    }

    // Check if model is already active
    if (model.is_active) {
      return NextResponse.json(
        { error: "Model is already active" },
        { status: 400 }
      );
    }

    // Update model with NFT ID and activate it
    const { error: updateError } = await supabase
      .from("models")
      .update({
        nft_id: nft_id,
        is_active: true,
        activated_at: new Date().toISOString(),
      })
      .eq("id", model_id);

    if (updateError) {
      console.error("Model activation error:", updateError);
      return NextResponse.json(
        { error: "Failed to activate model" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Model activated successfully",
      model: {
        id: model.id,
        name: model.name,
        nft_id: nft_id,
        is_active: true,
      },
    });
  } catch (error) {
    console.error("Activation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
