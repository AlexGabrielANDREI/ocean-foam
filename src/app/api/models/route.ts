import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get("x-wallet-address");
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 401 }
      );
    }

    // Get all active models
    const { data: models, error } = await supabase
      .from("models")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch models" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      models: models || [],
    });
  } catch (error) {
    console.error("Models fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
