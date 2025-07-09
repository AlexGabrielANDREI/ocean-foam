"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Wallet, Sparkles, Zap, Target } from "lucide-react";

export default function LoginScreen() {
  const { connectWallet } = useAuth();

  const features = [
    {
      icon: Zap,
      title: "AI-Powered Predictions",
      description: "Advanced machine learning models for accurate predictions",
      color: "from-accent-green to-accent-orange",
    },
    {
      icon: Target,
      title: "High Accuracy",
      description: "Industry-leading prediction accuracy rates",
      color: "from-primary-500 to-secondary-500",
    },
    {
      icon: Sparkles,
      title: "Real-time Analytics",
      description: "Instant insights and comprehensive analytics",
      color: "from-accent-orange to-accent-pink",
    },
  ];

  return (
    <div className="min-h-screen animated-gradient flex items-center justify-center p-8">
      <div className="max-w-6xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center glow-primary">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold gradient-text">
                    Prediction
                  </h1>
                  <p className="text-xl text-secondary-300">AI Platform</p>
                </div>
              </div>

              <h2 className="text-4xl font-bold text-white leading-tight">
                Unlock the Power of{" "}
                <span className="gradient-text">AI Predictions</span>
              </h2>

              <p className="text-xl text-secondary-300 leading-relaxed">
                Connect your wallet and start making intelligent predictions
                with our cutting-edge machine learning models. Experience the
                future of AI-powered analytics.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 glass rounded-2xl"
                >
                  <div
                    className={`p-3 rounded-2xl bg-gradient-to-r ${feature.color}`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-secondary-400">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className="card max-w-md mx-auto">
            <div className="card-body text-center space-y-8">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-accent-green to-accent-orange rounded-3xl flex items-center justify-center mx-auto glow-accent">
                  <Wallet className="w-10 h-10 text-white" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Connect Your Wallet
                  </h3>
                  <p className="text-secondary-400">
                    Choose your preferred wallet to get started
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => connectWallet("metamask")}
                  className="w-full btn-primary flex items-center justify-center space-x-3"
                >
                  <div className="w-6 h-6 bg-orange-500 rounded"></div>
                  <span>Connect with MetaMask</span>
                </button>

                <button
                  onClick={() => connectWallet("hedera")}
                  className="w-full btn-secondary flex items-center justify-center space-x-3"
                >
                  <div className="w-6 h-6 bg-purple-500 rounded"></div>
                  <span>Connect with Hedera</span>
                </button>
              </div>

              <div className="text-sm text-secondary-400">
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
