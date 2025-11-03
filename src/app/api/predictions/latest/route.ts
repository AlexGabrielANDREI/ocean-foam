import { NextRequest, NextResponse } from "next/server";
import { getWalletAwareSupabase } from "@/lib/auth-middleware";
import { getUserPaymentStatus } from "@/lib/payment-validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get("x-wallet-address");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 401 }
      );
    }

    // Check if user has valid payment
    const paymentStatus = await getUserPaymentStatus(walletAddress);

    if (!paymentStatus.hasValidPayment) {
      return NextResponse.json({
        success: true,
        hasValidPrediction: false,
        reason: "No valid payment found",
      });
    }

    // Get wallet-aware Supabase client
    const supabaseWithWallet = getWalletAwareSupabase(walletAddress);

    // Get user ID
    const { data: userData, error: userError } = await supabaseWithWallet
      .from("users")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the most recent prediction with transaction hash
    const { data: latestPrediction, error: predictionError } =
      await supabaseWithWallet
        .from("predictions")
        .select(
          "prediction_result, prediction_score, features_data, created_at, transaction_hash"
        )
        .eq("user_id", userData.id)
        .not("transaction_hash", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (predictionError || !latestPrediction) {
      return NextResponse.json({
        success: true,
        hasValidPrediction: false,
        reason: "No prediction found",
      });
    }

    // Check if prediction is still within validity window
    const predictionTime = new Date(latestPrediction.created_at);
    const expiresAt = paymentStatus.expiresAt;
    const now = new Date();
    const isExpired = now > expiresAt!;

    if (isExpired) {
      return NextResponse.json({
        success: true,
        hasValidPrediction: false,
        reason: "Prediction expired",
      });
    }

    // Parse prediction result
    let predictionResult;
    try {
      predictionResult = JSON.parse(latestPrediction.prediction_result);
    } catch (e) {
      // If parsing fails, treat as string
      predictionResult = {
        prediction: latestPrediction.prediction_result,
        confidence: latestPrediction.prediction_score,
        probabilities: latestPrediction.features_data,
      };
    }

    return NextResponse.json({
      success: true,
      hasValidPrediction: true,
      prediction: predictionResult,
      predictionTime: predictionTime.toISOString(),
      expiresAt: expiresAt!.toISOString(),
      timeRemaining: expiresAt!.getTime() - now.getTime(),
    });
  } catch (error) {
    console.error("Latest prediction fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
