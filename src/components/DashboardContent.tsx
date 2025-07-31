"use client";

import { useAuth } from "@/contexts/AuthContext";
import { TrendingUp, BarChart3, Bot, ArrowRight } from "lucide-react";

interface DashboardContentProps {
  onRouteChange?: (route: string) => void;
}

export default function DashboardContent({
  onRouteChange,
}: DashboardContentProps) {
  const { user } = useAuth();

  const categoryCards = [
    {
      title: "Prediction",
      description: "Make AI-powered predictions using our advanced models",
      icon: TrendingUp,
      color: "from-teal-500 to-teal-600",
      glow: "glow-primary",
      available: true,
      route: "prediction",
    },
    {
      title: "Exploratory Data Analysis",
      description: "Analyze and visualize your data with AI assistance",
      icon: BarChart3,
      color: "from-purple-500 to-purple-600",
      glow: "glow-secondary",
      available: false,
      comingSoon: true,
    },
    {
      title: "AI Agents",
      description: "Deploy intelligent agents for automated tasks",
      icon: Bot,
      color: "from-teal-500 to-blue-500",
      glow: "glow-accent",
      available: false,
      comingSoon: true,
    },
  ];

  const handleCardClick = (card: any) => {
    if (card.available && card.route && onRouteChange) {
      onRouteChange(card.route);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full w-full">
      <div className="flex flex-col items-center w-full max-w-5xl px-2 sm:px-4 py-6 sm:py-10">
        {/* Welcome Header (no glass background) */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold gradient-text mb-2 text-center">
          Welcome back, {user?.wallet_address?.slice(0, 6)}...
          {user?.wallet_address?.slice(-4)}!
        </h1>
        <p className="text-base sm:text-lg text-secondary-300 mb-6 text-center max-w-xl">
          Your AI prediction platform is ready. Choose from our powerful tools
          to get started.
        </p>
        {/* Main Categories */}
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {categoryCards.map((card, index) => (
              <div
                key={index}
                onClick={() => handleCardClick(card)}
                className={`glass rounded-3xl p-5 sm:p-7 md:p-8 hover:scale-105 transition-all duration-300 cursor-pointer min-h-[220px] sm:min-h-[260px] flex flex-col justify-between ${
                  card.available
                    ? "hover:shadow-2xl hover:shadow-primary-500/20"
                    : "opacity-60 cursor-not-allowed"
                }`}
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-r ${card.color} ${card.glow} flex items-center justify-center mb-4`}
                >
                  <card.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                {/* Content */}
                <div className="space-y-2 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      {card.title}
                    </h3>
                    {card.available && (
                      <ArrowRight className="w-5 h-5 text-teal-400" />
                    )}
                    {card.comingSoon && (
                      <span className="text-xs bg-teal-400 text-white px-2 py-1 rounded-full font-semibold">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-secondary-300 leading-relaxed text-sm sm:text-base mb-2">
                    {card.description}
                  </p>
                  {card.available && (
                    <button className="btn-primary w-full text-sm sm:text-base py-2 mt-auto">
                      Get Started
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Additional Info */}
        <div className="text-center mt-6 sm:mt-8 w-full">
          <p className="text-secondary-400 text-xs sm:text-sm">
            More features and capabilities coming soon. Stay tuned for updates!
          </p>
        </div>
      </div>
    </div>
  );
}
