import { ethers } from "ethers";
import { supabase, getSupabaseClient } from "./supabase";
import { getPaymentPrice } from "./contract";

const ALCHEMY_URL =
  "https://eth-sepolia.g.alchemy.com/v2/Rw4dHAu8A_9De5-3lRDgr";
const CONTRACT_ADDRESS = "0x2926afd03D40160be5739fA5b063c52e54CAFEBE";

// Payment validation time window (1 minute for testing)
const PAYMENT_VALIDITY_HOURS = 1 / 60; // 1 minute

export interface PaymentValidationResult {
  isValid: boolean;
  reason?: string;
  transactionHash?: string;
  paymentAmount?: string;
  paymentTime?: Date;
}

/**
 * Verify if a user has a valid recent payment
 */
export async function verifyUserPayment(
  walletAddress: string,
  providedTransactionHash?: string
): Promise<PaymentValidationResult> {
  try {
    console.log("[DEBUG] verifyUserPayment called with:", {
      walletAddress,
      providedTransactionHash,
      hasProvidedHash: !!providedTransactionHash,
    });

    // If a specific transaction hash is provided, validate it immediately
    if (providedTransactionHash) {
      console.log(
        "[DEBUG] Validating provided transaction hash:",
        providedTransactionHash
      );
      const blockchainVerification = await verifyTransactionOnChain(
        providedTransactionHash
      );

      console.log(
        "[DEBUG] Blockchain verification result:",
        blockchainVerification
      );

      if (!blockchainVerification.isValid) {
        console.log(
          "[DEBUG] Blockchain verification failed:",
          blockchainVerification.reason
        );
        return {
          isValid: false,
          reason: blockchainVerification.reason,
          transactionHash: providedTransactionHash,
        };
      }

      // Check if this transaction is from the correct wallet address
      const provider = new ethers.JsonRpcProvider(ALCHEMY_URL);
      const tx = await provider.getTransaction(providedTransactionHash);

      console.log("[DEBUG] Transaction details:", {
        from: tx?.from,
        to: tx?.to,
        value: tx?.value ? ethers.formatEther(tx.value) : "N/A",
        expectedWallet: walletAddress.toLowerCase(),
        actualFrom: tx?.from?.toLowerCase(),
      });

      if (tx?.from?.toLowerCase() !== walletAddress.toLowerCase()) {
        console.log("[DEBUG] Wallet address mismatch");
        return {
          isValid: false,
          reason: "Transaction not from user's wallet address",
          transactionHash: providedTransactionHash,
        };
      }

      console.log(
        "[DEBUG] Payment validation successful for provided transaction"
      );
      return {
        isValid: true,
        transactionHash: providedTransactionHash,
        paymentAmount: blockchainVerification.paymentAmount,
        paymentTime: new Date(), // Use current time for immediate validation
      };
    }

    console.log(
      "[DEBUG] No transaction hash provided, checking database for recent payment"
    );

    // Use wallet-specific Supabase client to pass RLS policies
    const supabaseWithWallet = getSupabaseClient(walletAddress);
    console.log(
      "[DEBUG] Using wallet-specific Supabase client for:",
      walletAddress
    );

    // 1. First get the user ID
    const { data: userData, error: userError } = await supabaseWithWallet
      .from("users")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single();

    if (userError || !userData) {
      console.log("[DEBUG] User not found in database:", userError);
      return {
        isValid: false,
        reason: "User not found in database",
      };
    }

    console.log("[DEBUG] User found:", userData.id);

    // 2. Check if user has a recent prediction with valid transaction hash
    const { data: recentPrediction, error } = await supabaseWithWallet
      .from("predictions")
      .select("transaction_hash, created_at")
      .eq("user_id", userData.id)
      .not("transaction_hash", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    console.log("[DEBUG] Database query result:", { recentPrediction, error });

    if (error || !recentPrediction) {
      console.log("[DEBUG] No recent payment found in database");
      return {
        isValid: false,
        reason: "No recent payment found",
      };
    }

    // 2. Check if payment is within validity window
    const paymentTime = new Date(recentPrediction.created_at);
    const now = new Date();
    const hoursSincePayment =
      (now.getTime() - paymentTime.getTime()) / (1000 * 60 * 60);

    console.log("[DEBUG] Payment time check:", {
      paymentTime: paymentTime.toISOString(),
      now: now.toISOString(),
      hoursSincePayment,
      maxHours: PAYMENT_VALIDITY_HOURS,
    });

    if (hoursSincePayment > PAYMENT_VALIDITY_HOURS) {
      console.log("[DEBUG] Payment expired");
      return {
        isValid: false,
        reason: "Payment expired (older than 1 minute)",
        transactionHash: recentPrediction.transaction_hash,
        paymentTime,
      };
    }

    // 3. Verify transaction on blockchain
    const blockchainVerification = await verifyTransactionOnChain(
      recentPrediction.transaction_hash!
    );

    console.log(
      "[DEBUG] Blockchain verification for database payment:",
      blockchainVerification
    );

    if (!blockchainVerification.isValid) {
      console.log(
        "[DEBUG] Blockchain verification failed for database payment"
      );
      return {
        isValid: false,
        reason: blockchainVerification.reason,
        transactionHash: recentPrediction.transaction_hash,
        paymentTime,
      };
    }

    console.log("[DEBUG] Payment validation successful for database payment");
    return {
      isValid: true,
      transactionHash: recentPrediction.transaction_hash,
      paymentAmount: blockchainVerification.paymentAmount,
      paymentTime,
    };
  } catch (error) {
    console.error("Payment verification error:", error);
    return {
      isValid: false,
      reason: "Payment verification failed",
    };
  }
}

/**
 * Verify a specific transaction on the blockchain
 */
export async function verifyTransactionOnChain(
  txHash: string
): Promise<PaymentValidationResult> {
  try {
    console.log("[DEBUG] verifyTransactionOnChain called with:", txHash);
    const provider = new ethers.JsonRpcProvider(ALCHEMY_URL);

    // 1. Get transaction details
    console.log("[DEBUG] Getting transaction details...");
    const tx = await provider.getTransaction(txHash);
    if (!tx) {
      console.log("[DEBUG] Transaction not found on blockchain");
      return {
        isValid: false,
        reason: "Transaction not found on blockchain",
      };
    }
    console.log("[DEBUG] Transaction found:", {
      from: tx.from,
      to: tx.to,
      value: ethers.formatEther(tx.value),
      hash: tx.hash,
    });

    // 2. Check if transaction is confirmed
    console.log("[DEBUG] Getting transaction receipt...");
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.status !== 1) {
      console.log("[DEBUG] Transaction not confirmed or failed:", {
        hasReceipt: !!receipt,
        status: receipt?.status,
      });
      return {
        isValid: false,
        reason: "Transaction not confirmed or failed",
      };
    }
    console.log("[DEBUG] Transaction confirmed:", {
      status: receipt.status,
      blockNumber: receipt.blockNumber,
    });

    // 3. Verify transaction is to our contract
    console.log("[DEBUG] Verifying contract address...");
    console.log("[DEBUG] Expected contract:", CONTRACT_ADDRESS.toLowerCase());
    console.log("[DEBUG] Actual transaction to:", tx.to?.toLowerCase());

    if (tx.to?.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
      console.log("[DEBUG] Transaction not sent to correct contract");
      return {
        isValid: false,
        reason: "Transaction not sent to correct contract",
      };
    }
    console.log("[DEBUG] Contract address verified");

    // 4. Get expected payment price
    console.log("[DEBUG] Getting expected payment price...");
    const expectedPrice = await getPaymentPrice();
    const expectedPriceWei = ethers.parseEther(expectedPrice);
    console.log(
      "[DEBUG] Expected price:",
      expectedPrice,
      "ETH (",
      expectedPriceWei.toString(),
      "wei)"
    );

    // 5. Verify payment amount
    console.log("[DEBUG] Verifying payment amount...");
    console.log(
      "[DEBUG] Actual payment:",
      ethers.formatEther(tx.value),
      "ETH (",
      tx.value.toString(),
      "wei)"
    );

    if (tx.value !== expectedPriceWei) {
      console.log("[DEBUG] Payment amount mismatch");
      return {
        isValid: false,
        reason: `Incorrect payment amount. Expected: ${expectedPrice} ETH, Got: ${ethers.formatEther(
          tx.value
        )} ETH`,
      };
    }
    console.log("[DEBUG] Payment amount verified");

    // 6. Check transaction age (should be recent)
    console.log("[DEBUG] Checking transaction age...");
    const currentBlock = await provider.getBlockNumber();
    const txBlock = receipt.blockNumber;
    const blocksSinceTx = currentBlock - txBlock;

    console.log("[DEBUG] Block info:", {
      currentBlock,
      txBlock,
      blocksSinceTx,
      maxBlocks: (PAYMENT_VALIDITY_HOURS * 3600) / 12,
    });

    // Assuming 12 second block time, check if transaction is not too old
    const maxBlocks = (PAYMENT_VALIDITY_HOURS * 3600) / 12; // Convert hours to blocks
    if (blocksSinceTx > maxBlocks) {
      console.log("[DEBUG] Transaction too old");
      return {
        isValid: false,
        reason: "Transaction too old",
        transactionHash: txHash,
        paymentAmount: ethers.formatEther(tx.value),
      };
    }
    console.log("[DEBUG] Transaction age verified");

    console.log("[DEBUG] Blockchain verification successful");
    return {
      isValid: true,
      transactionHash: txHash,
      paymentAmount: ethers.formatEther(tx.value),
    };
  } catch (error) {
    console.error("Blockchain verification error:", error);
    return {
      isValid: false,
      reason: "Blockchain verification failed",
    };
  }
}

/**
 * Record a payment transaction in the database
 */
export async function recordPaymentTransaction(
  userId: string,
  modelId: string,
  transactionHash: string,
  predictionResult: string,
  predictionScore: number,
  featuresUsed: "manual" | "api",
  featuresData?: any
): Promise<boolean> {
  try {
    // First get the user's wallet address to use the correct Supabase client
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("wallet_address")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      console.error("Error getting user wallet address:", userError);
      return false;
    }

    // Use wallet-specific client for RLS policies
    const supabaseWithWallet = getSupabaseClient(userData.wallet_address);

    const { error } = await supabaseWithWallet.from("predictions").insert({
      user_id: userId,
      model_id: modelId,
      prediction_result: predictionResult,
      prediction_score: predictionScore,
      features_used: featuresUsed,
      features_data: featuresData,
      transaction_hash: transactionHash,
    });

    if (error) {
      console.error("Error recording payment transaction:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error recording payment transaction:", error);
    return false;
  }
}

/**
 * Get payment status for a user
 */
export async function getUserPaymentStatus(walletAddress: string): Promise<{
  hasValidPayment: boolean;
  lastPaymentTime?: Date;
  transactionHash?: string;
  expiresAt?: Date;
}> {
  try {
    console.log(
      "[DEBUG] getUserPaymentStatus called for wallet:",
      walletAddress
    );

    // Use wallet-specific client for RLS policies
    const supabaseWithWallet = getSupabaseClient(walletAddress);

    // Get user ID first
    const { data: userData, error: userError } = await supabaseWithWallet
      .from("users")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single();

    if (userError || !userData) {
      console.log("[DEBUG] User not found:", userError);
      return { hasValidPayment: false };
    }

    // Get the most recent prediction (payment)
    const { data: recentPrediction, error: predictionError } =
      await supabaseWithWallet
        .from("predictions")
        .select("transaction_hash, created_at")
        .eq("user_id", userData.id)
        .not("transaction_hash", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

    if (predictionError || !recentPrediction) {
      console.log("[DEBUG] No recent payment found:", predictionError);
      return { hasValidPayment: false };
    }

    const paymentTime = new Date(recentPrediction.created_at);
    const expiresAt = new Date(
      paymentTime.getTime() + PAYMENT_VALIDITY_HOURS * 60 * 60 * 1000
    );
    const now = new Date();
    const isExpired = now > expiresAt;

    console.log("[DEBUG] Payment status check:", {
      paymentTime: paymentTime.toISOString(),
      expiresAt: expiresAt.toISOString(),
      now: now.toISOString(),
      isExpired,
      hoursSincePayment:
        (now.getTime() - paymentTime.getTime()) / (1000 * 60 * 60),
      maxHours: PAYMENT_VALIDITY_HOURS,
    });

    return {
      hasValidPayment: !isExpired,
      lastPaymentTime: paymentTime,
      transactionHash: recentPrediction.transaction_hash,
      expiresAt,
    };
  } catch (error) {
    console.error("[DEBUG] Error in getUserPaymentStatus:", error);
    return { hasValidPayment: false };
  }
}
