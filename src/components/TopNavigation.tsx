"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Bell, Settings, Wallet, LogOut } from "lucide-react";
import PaymentStatusIndicator, {
  PaymentStatusIndicatorRef,
} from "./PaymentStatusIndicator";
import { forwardRef, useRef, useImperativeHandle } from "react";

export interface TopNavigationRef {
  refreshPaymentStatus: () => void;
}

const TopNavigation = forwardRef<TopNavigationRef>((props, ref) => {
  const { user, disconnect } = useAuth();
  const paymentStatusRef = useRef<PaymentStatusIndicatorRef>(null);

  useImperativeHandle(ref, () => ({
    refreshPaymentStatus: () => {
      paymentStatusRef.current?.refresh();
    },
  }));

  return (
    <header className="glass border-b border-white/10 px-6 py-4 flex-shrink-0 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left Side - Empty for balance */}
        <div className="flex-1"></div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {/* Payment Status Indicator */}
          <PaymentStatusIndicator ref={paymentStatusRef} />

          {/* Notifications */}
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all duration-300">
            <Bell className="w-5 h-5 text-slate-200" />
          </button>

          {/* Settings */}
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all duration-300">
            <Settings className="w-5 h-5 text-slate-200" />
          </button>

          {/* Wallet Info */}
          <div className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl shadow-sm glow-primary">
            <Wallet className="w-4 h-4 text-white" />
            <span className="text-white font-semibold text-sm">
              {user?.wallet_address?.slice(0, 6)}...
              {user?.wallet_address?.slice(-4)}
            </span>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={disconnect}
            className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-2xl transition-all duration-300 shadow-sm glow-secondary"
            title="Disconnect Wallet"
          >
            <LogOut className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </header>
  );
});

TopNavigation.displayName = "TopNavigation";

export default TopNavigation;
