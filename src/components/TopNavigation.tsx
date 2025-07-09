"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Bell, Search } from "lucide-react";

export default function TopNavigation() {
  const { user } = useAuth();

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-border rounded-lg bg-input text-foreground placeholder:text-secondary-500 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="relative p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-50 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {user?.wallet_address
                  ? `${user.wallet_address.slice(
                      0,
                      6
                    )}...${user.wallet_address.slice(-4)}`
                  : "User"}
              </p>
              <p className="text-xs text-secondary-500 capitalize">
                {user?.role || "consumer"}
              </p>
            </div>
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {user?.wallet_address
                  ? user.wallet_address.slice(2, 4).toUpperCase()
                  : "U"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
