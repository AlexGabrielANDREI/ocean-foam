import { ethers } from "ethers";

export interface WalletConnection {
  address: string;
  type: "metamask" | "hedera";
  connected: boolean;
}

// MetaMask connection
export async function connectMetaMask(): Promise<WalletConnection> {
  if (typeof window === "undefined") {
    throw new Error("Cannot connect wallet on server side");
  }

  if (typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed");
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    const address = accounts[0];

    return {
      address,
      type: "metamask",
      connected: true,
    };
  } catch (error) {
    throw new Error("Failed to connect to MetaMask");
  }
}

// Hedera connection (placeholder - will be implemented with Hedera SDK)
export async function connectHedera(): Promise<WalletConnection> {
  // This is a placeholder implementation
  // In production, you'd use the Hedera SDK to connect to HashPack or other Hedera wallets
  throw new Error("Hedera wallet connection not implemented yet");
}

// Disconnect wallet
export function disconnectWallet(): WalletConnection {
  return {
    address: "",
    type: "metamask",
    connected: false,
  };
}

// Check if MetaMask is installed
export function isMetaMaskInstalled(): boolean {
  return (
    typeof window !== "undefined" && typeof window.ethereum !== "undefined"
  );
}

// Check if Hedera wallet is available (placeholder)
export function isHederaWalletAvailable(): boolean {
  // This would check for HashPack or other Hedera wallets
  return false;
}
