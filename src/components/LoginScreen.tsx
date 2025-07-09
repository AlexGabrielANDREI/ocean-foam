"use client";

import { useAuth } from "@/contexts/AuthContext";
import { isMetaMaskInstalled, isHederaWalletAvailable } from "@/lib/wallet";
import { Wallet, Shield, Zap } from "lucide-react";

export default function LoginScreen() {
  const { connectWallet, loading } = useAuth();

  const handleConnect = async (type: "metamask" | "hedera") => {
    try {
      await connectWallet(type);
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="card-header text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <Zap className="w-8 h-8 text-primary-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Prediction Dashboard
            </h1>
            <p className="text-secondary-600">
              Connect your wallet to access AI-powered predictions
            </p>
          </div>

          <div className="card-body space-y-4">
            <div className="space-y-3">
              <button
                onClick={() => handleConnect("metamask")}
                disabled={loading || !isMetaMaskInstalled()}
                className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Wallet className="w-5 h-5" />
                <span>
                  {isMetaMaskInstalled()
                    ? "Connect MetaMask"
                    : "MetaMask Not Installed"}
                </span>
              </button>

              <button
                onClick={() => handleConnect("hedera")}
                disabled={loading || !isHederaWalletAvailable()}
                className="w-full btn-outline flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Shield className="w-5 h-5" />
                <span>
                  {isHederaWalletAvailable()
                    ? "Connect Hedera Wallet"
                    : "Hedera Wallet Not Available"}
                </span>
              </button>
            </div>

            <div className="text-center text-sm text-secondary-500">
              <p>
                By connecting your wallet, you agree to our terms of service
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-secondary-500">
          <p>Powered by Web3 & AI Technology</p>
        </div>
      </div>
    </div>
  );
}
