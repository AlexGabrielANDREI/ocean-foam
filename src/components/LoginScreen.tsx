"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Wallet } from "lucide-react";
import Image from "next/image";

export default function LoginScreen() {
  const { connectWallet } = useAuth();

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-8 relative"
      style={{ backgroundImage: 'url("/OceanFoam.jpeg")' }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* Logo in bottom right corner */}
      <div className="absolute bottom-8 right-8 z-20">
        <Image
          src="/logo_oceanfoam.png"
          alt="OceanFoam Logo"
          width={80}
          height={80}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div className="space-y-8">
            <div className="space-y-8">
              {/* Main Content */}
              <div className="space-y-6">
                <h1 className="text-6xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                  OceanFoam
                </h1>

                <h2 className="text-5xl font-bold text-white leading-tight">
                  FOMC Interest Prediction and Analytics
                </h2>

                <p className="text-xl text-gray-200 leading-relaxed">
                  A data-driven dApp for forecasting Federal Reserve interest
                  rate decisions and market reactions.
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 max-w-md mx-auto shadow-2xl">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <Wallet className="w-8 h-8 text-white" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Connect Your Wallet
                  </h3>
                  <p className="text-gray-200">
                    Choose your preferred wallet to get started
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => connectWallet("metamask")}
                  className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:scale-105"
                >
                  <div className="w-5 h-5 bg-teal-300 rounded-full"></div>
                  <span>Connect with MetaMask</span>
                </button>

                {/* Hedera wallet button disabled - No longer using Hedera */}
                {/* <button
                  onClick={() => connectWallet("hedera")}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-lg hover:scale-105"
                >
                  <div className="w-5 h-5 bg-purple-300 rounded-full"></div>
                  <span>Connect with Hedera</span>
                </button> */}
              </div>

              <div className="text-sm text-gray-300">
                <p>By connecting, you agree to our Terms of Service</p>
                <p>and Privacy Policy</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
