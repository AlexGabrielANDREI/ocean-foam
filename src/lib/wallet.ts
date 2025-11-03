import { ethers } from "ethers";

export interface WalletConnection {
  address: string;
  type: "metamask"; // | "hedera"; // Hedera support disabled
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

// Hedera connection (DISABLED - No longer using Hedera)
// export async function connectHedera(): Promise<WalletConnection> {
//   // This is a placeholder implementation
//   // In production, you'd use the Hedera SDK to connect to HashPack or other Hedera wallets
//   throw new Error("Hedera wallet connection not implemented yet");
// }

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

// Ensure user is on Ethereum Mainnet
export async function ensureMainnet(): Promise<void> {
  if (typeof window === "undefined" || typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed");
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();

    // chainId 1 = Ethereum Mainnet
    if (network.chainId !== BigInt(1)) {
      throw new Error(
        `Please switch to Ethereum Mainnet. Current network: ${network.name} (chainId: ${network.chainId})`
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to verify network");
  }
}

// Get current network information
export async function getCurrentNetwork(): Promise<{
  chainId: bigint;
  name: string;
  isMainnet: boolean;
}> {
  if (typeof window === "undefined" || typeof window.ethereum === "undefined") {
    throw new Error("MetaMask is not installed");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();

  return {
    chainId: network.chainId,
    name: network.name,
    isMainnet: network.chainId === BigInt(1),
  };
}

// Check if Hedera wallet is available (DISABLED - No longer using Hedera)
// export function isHederaWalletAvailable(): boolean {
//   // This would check for HashPack or other Hedera wallets
//   return false;
// }
