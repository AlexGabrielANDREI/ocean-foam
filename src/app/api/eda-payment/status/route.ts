import { NextRequest, NextResponse } from "next/server";
import { getUserEdaPaymentStatus } from "@/lib/payment-validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get("x-wallet-address");

    console.log("[DEBUG] EDA Payment Status - Request details:", {
      walletAddress,
    });

    if (!walletAddress) {
      console.log("[DEBUG] EDA Payment Status - No wallet address provided");
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 401 }
      );
    }

    // Check if payment gate is enabled
    const paymentGateEnabled = process.env.PAYMENT_GATE !== "false";
    console.log(
      "[DEBUG] EDA Payment Status - Payment gate enabled:",
      paymentGateEnabled
    );

    if (!paymentGateEnabled) {
      // Payment gate disabled - return valid payment status with no expiry
      // This allows the UI to show "Active" without expiry countdown
      console.log(
        "[DEBUG] EDA Payment Status - Returning valid payment (PAYMENT_GATE=false)"
      );
      return NextResponse.json({
        success: true,
        edaPaymentStatus: {
          hasValidPayment: true,
          paymentGateEnabled: false,
          expiresAt: null, // No expiry when payment gate is disabled
        },
      });
    }

    console.log(
      "[DEBUG] EDA Payment Status - Getting EDA payment status for wallet:",
      walletAddress
    );
    const edaPaymentStatus = await getUserEdaPaymentStatus(walletAddress);

    console.log("[DEBUG] EDA Payment Status - Result:", edaPaymentStatus);

    return NextResponse.json({
      success: true,
      edaPaymentStatus: {
        ...edaPaymentStatus,
        paymentGateEnabled: true,
      },
    });
  } catch (error) {
    console.error("EDA Payment status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
