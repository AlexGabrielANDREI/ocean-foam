"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Bell, Search, Settings, Wallet, LogOut } from "lucide-react";

export default function TopNavigation() {
  const { user, disconnect } = useAuth();

  return (
    <header className="glass px-6 py-4 flex-shrink-0">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search predictions, models..."
              className="w-full pl-12 pr-4 py-3 bg-card border-2 border-border rounded-2xl text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all duration-300"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button className="p-3 bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-500 hover:to-secondary-600 rounded-2xl transition-all duration-300 glow-secondary">
            <Bell className="w-5 h-5 text-white" />
          </button>

          {/* Settings */}
          <button className="p-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 rounded-2xl transition-all duration-300 glow-primary">
            <Settings className="w-5 h-5 text-white" />
          </button>

          {/* Wallet Info */}
          <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-accent-green to-accent-orange rounded-2xl glow-accent">
            <Wallet className="w-4 h-4 text-white" />
            <span className="text-white font-semibold text-sm">
              {user?.wallet_address?.slice(0, 6)}...
              {user?.wallet_address?.slice(-4)}
            </span>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={disconnect}
            className="p-3 bg-gradient-to-r from-accent-pink to-accent-orange hover:from-accent-pink/80 hover:to-accent-orange/80 rounded-2xl transition-all duration-300 glow-accent"
            title="Disconnect Wallet"
          >
            <LogOut className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
}
