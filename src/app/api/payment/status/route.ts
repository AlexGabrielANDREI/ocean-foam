import { NextRequest, NextResponse } from "next/server";
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

    // Check if payment gate is enabled
    const paymentGateEnabled = process.env.PAYMENT_GATE !== "false";
    console.log("[DEBUG] Payment status check - Payment gate enabled:", paymentGateEnabled);

    if (!paymentGateEnabled) {
      // Payment gate disabled - return valid payment status
      console.log("[DEBUG] Payment status check - Returning valid payment (PAYMENT_GATE=false)");
      return NextResponse.json({
        success: true,
        paymentStatus: {
          hasValidPayment: true,
          paymentGateEnabled: false,
        },
      });
    }

    const paymentStatus = await getUserPaymentStatus(walletAddress);

    return NextResponse.json({
      success: true,
      paymentStatus: {
        ...paymentStatus,
        paymentGateEnabled: true,
      },
    });
  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
