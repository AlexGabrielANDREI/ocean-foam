"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Bell, Search, Settings, Wallet, LogOut } from "lucide-react";

export default function TopNavigation() {
  const { user, disconnect } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search predictions, models..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all duration-300"
            />
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all duration-300">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>

          {/* Settings */}
          <button className="p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all duration-300">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

          {/* Wallet Info */}
          <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl shadow-sm">
            <Wallet className="w-4 h-4 text-white" />
            <span className="text-white font-semibold text-sm">
              {user?.wallet_address?.slice(0, 6)}...
              {user?.wallet_address?.slice(-4)}
            </span>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={disconnect}
            className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-2xl transition-all duration-300 shadow-sm"
            title="Disconnect Wallet"
          >
            <LogOut className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
}
