import { NextRequest, NextResponse } from "next/server";
import { getUserPaymentStatus } from "@/lib/payment-validation";

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get("x-wallet-address");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 401 }
      );
    }

    const paymentStatus = await getUserPaymentStatus(walletAddress);

    return NextResponse.json({
      success: true,
      paymentStatus,
    });
  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
