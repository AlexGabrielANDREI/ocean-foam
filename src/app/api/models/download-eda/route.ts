import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase, getSupabaseClient } from "@/lib/supabase";
import {
  verifyEdaPayment,
  recordEdaAccessTransaction,
} from "@/lib/payment-validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.headers.get("x-wallet-address");
    const transactionHash = request.headers.get("x-transaction-hash");
    const { searchParams } = new URL(request.url);
    const edaPath = searchParams.get("path");

    console.log("[DEBUG] EDA Download - Request details:", {
      walletAddress,
      transactionHash,
      edaPath,
      url: request.url,
    });

    if (!walletAddress) {
      console.log("[DEBUG] EDA Download - No wallet address provided");
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 401 }
      );
    }

    if (!edaPath) {
      console.log("[DEBUG] EDA Download - No EDA path provided");
      return NextResponse.json(
        { error: "EDA path is required" },
        { status: 400 }
      );
    }

    // Check if payment gate is enabled
    const paymentGateEnabled = process.env.PAYMENT_GATE !== "false";
    console.log("[DEBUG] EDA Download - Payment gate enabled:", paymentGateEnabled);

    // Validate EDA payment
    let paymentValidation: any = null;
    if (paymentGateEnabled) {
      console.log(
        "[DEBUG] EDA Download - Validating EDA payment for wallet:",
        walletAddress
      );
      paymentValidation = await verifyEdaPayment(
        walletAddress,
        transactionHash && transactionHash.trim() !== ""
          ? transactionHash
          : undefined
      );

      console.log(
        "[DEBUG] EDA Download - Payment validation result:",
        paymentValidation
      );

      if (!paymentValidation.isValid) {
        console.log(
          "[DEBUG] EDA Download - Payment validation failed:",
          paymentValidation.reason
        );
        return NextResponse.json(
          { error: `EDA Payment required: ${paymentValidation.reason}` },
          { status: 402 }
        );
      }

      console.log("[DEBUG] EDA Download - EDA Payment validation successful");
    } else {
      console.log("[DEBUG] EDA Download - Payment validation SKIPPED (PAYMENT_GATE=false)");
    }

    // Get user details for recording access (use wallet-specific client like predictions)
    const supabaseWithWallet = getSupabaseClient(walletAddress);
    const { data: user, error: userError } = await supabaseWithWallet
      .from("users")
      .select("id, role")
      .eq("wallet_address", walletAddress)
      .single();

    console.log("[DEBUG] EDA Download - User check:", { user, userError });

    if (userError) {
      console.log("[DEBUG] EDA Download - User not found:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Record EDA access transaction for every successful download
    // This ensures the 5-minute window is tracked properly
    const transactionHashToRecord =
      paymentValidation?.transactionHash || transactionHash || "eda_access_" + Date.now();

    console.log(
      "[DEBUG] EDA Download - Recording EDA access transaction:",
      transactionHashToRecord
    );
    const recordSuccess = await recordEdaAccessTransaction(
      user.id,
      transactionHashToRecord
    );

    if (!recordSuccess) {
      console.log(
        "[DEBUG] EDA Download - Failed to record EDA access transaction"
      );
      // Continue anyway, don't fail the download
    }

    console.log("[DEBUG] EDA Download - Access granted");

    // Download the file from storage
    console.log("[DEBUG] EDA Download - Attempting to download from storage:", {
      bucket: "eda-reports",
      path: edaPath,
    });

    const { data, error } = await supabase.storage
      .from("eda-reports")
      .download(edaPath);

    console.log("[DEBUG] EDA Download - Storage response:", {
      data: !!data,
      error,
    });

    if (error) {
      console.error("[DEBUG] EDA Download - Storage error:", error);
      return NextResponse.json(
        { error: `Failed to download EDA file: ${error.message}` },
        { status: 404 }
      );
    }

    if (!data) {
      console.error("[DEBUG] EDA Download - No data returned from storage");
      return NextResponse.json(
        { error: "No data returned from storage" },
        { status: 404 }
      );
    }

    // Convert blob to array buffer
    console.log("[DEBUG] EDA Download - Converting blob to array buffer");
    const arrayBuffer = await data.arrayBuffer();
    console.log(
      "[DEBUG] EDA Download - Array buffer size:",
      arrayBuffer.byteLength
    );

    // Return the file with appropriate headers
    console.log("[DEBUG] EDA Download - Returning file response");
    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="EDA_Report.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("EDA download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
