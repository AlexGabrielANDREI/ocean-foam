import { NextRequest } from "next/server";
import { getSupabaseClient } from "./supabase";

export interface AuthenticatedRequest extends NextRequest {
  walletAddress?: string;
  user?: any;
}

export async function authenticateRequest(
  request: NextRequest
): Promise<AuthenticatedRequest> {
  const authRequest = request as AuthenticatedRequest;

  // Get wallet address from headers
  const walletAddress = request.headers.get("x-wallet-address");

  if (!walletAddress) {
    throw new Error("Wallet address required");
  }

  authRequest.walletAddress = walletAddress;

  // Get user data with wallet-aware client
  const supabaseWithWallet = getSupabaseClient(walletAddress);
  const { data: user, error } = await supabaseWithWallet
    .from("users")
    .select("*")
    .eq("wallet_address", walletAddress)
    .single();

  if (error || !user) {
    throw new Error("User not found");
  }

  authRequest.user = user;
  return authRequest;
}

export function getWalletAwareSupabase(walletAddress: string) {
  return getSupabaseClient(walletAddress);
}
