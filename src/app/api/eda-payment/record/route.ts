import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { recordEdaAccessTransaction } from "@/lib/payment-validation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const walletAddress = request.headers.get("x-wallet-address");
    const { transactionHash } = await request.json();

    console.log("[DEBUG] EDA Payment Record - Request details:", {
      walletAddress,
      transactionHash,
    });

    if (!walletAddress) {
      console.log("[DEBUG] EDA Payment Record - No wallet address provided");
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 401 }
      );
    }

    if (!transactionHash) {
      console.log("[DEBUG] EDA Payment Record - No transaction hash provided");
      return NextResponse.json(
        { error: "Transaction hash required" },
        { status: 400 }
      );
    }

    // Get user details
    const supabaseWithWallet = getSupabaseClient(walletAddress);
    const { data: user, error: userError } = await supabaseWithWallet
      .from("users")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single();

    console.log("[DEBUG] EDA Payment Record - User check:", {
      user,
      userError,
    });

    if (userError || !user) {
      console.log("[DEBUG] EDA Payment Record - User not found:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Record the EDA access transaction
    console.log(
      "[DEBUG] EDA Payment Record - Recording EDA access transaction:",
      transactionHash
    );
    const recordSuccess = await recordEdaAccessTransaction(
      user.id,
      transactionHash
    );

    if (!recordSuccess) {
      console.log(
        "[DEBUG] EDA Payment Record - Failed to record EDA access transaction"
      );
      return NextResponse.json(
        { error: "Failed to record EDA access transaction" },
        { status: 500 }
      );
    }

    console.log("[DEBUG] EDA Payment Record - Success");

    return NextResponse.json({
      success: true,
      message: "EDA access transaction recorded successfully",
    });
  } catch (error) {
    console.error("EDA Payment Record error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
