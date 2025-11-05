"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Bell, Settings, Wallet, LogOut, Menu } from "lucide-react";
import PaymentStatusIndicator, {
  PaymentStatusIndicatorRef,
} from "./PaymentStatusIndicator";
import EdaPaymentStatusIndicator, {
  EdaPaymentStatusIndicatorRef,
} from "./EdaPaymentStatusIndicator";
import { forwardRef, useRef, useImperativeHandle } from "react";

export interface TopNavigationRef {
  refreshPaymentStatus: () => void;
  refreshEdaPaymentStatus: () => void;
}

interface TopNavigationProps {
  onMenuClick?: () => void;
}

const TopNavigation = forwardRef<TopNavigationRef, TopNavigationProps>(
  ({ onMenuClick }, ref) => {
    const { user, disconnect } = useAuth();
    const paymentStatusRef = useRef<PaymentStatusIndicatorRef>(null);
    const edaPaymentStatusRef = useRef<EdaPaymentStatusIndicatorRef>(null);

    useImperativeHandle(ref, () => ({
      refreshPaymentStatus: () => {
        paymentStatusRef.current?.refresh();
      },
      refreshEdaPaymentStatus: () => {
        edaPaymentStatusRef.current?.refresh();
      },
    }));

    return (
      <header className="glass border-b border-white/10 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between lg:justify-end">
          {/* Left Side - Hamburger Menu (mobile only) */}
          <div className="flex-1 lg:hidden">
            <button
              onClick={onMenuClick}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5 text-slate-200" />
            </button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Payment Status Indicator - Hidden on very small screens */}
            <div className="hidden sm:block">
              <PaymentStatusIndicator ref={paymentStatusRef} />
            </div>

            {/* EDA Payment Status Indicator - Hidden on very small screens */}
            <div className="hidden sm:block">
              <EdaPaymentStatusIndicator ref={edaPaymentStatusRef} />
            </div>

            {/* Notifications */}
            <button className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl sm:rounded-2xl transition-all duration-300">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200" />
            </button>

            {/* Settings */}
            <button className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl sm:rounded-2xl transition-all duration-300">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200" />
            </button>

            {/* Wallet Info - Compact on mobile */}
            <div className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-teal-500 to-blue-500 rounded-xl sm:rounded-2xl shadow-sm glow-primary">
              <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              <span className="text-white font-semibold text-xs sm:text-sm hidden sm:inline">
                {user?.wallet_address?.slice(0, 6)}...
                {user?.wallet_address?.slice(-4)}
              </span>
              <span className="text-white font-semibold text-xs sm:hidden">
                {user?.wallet_address?.slice(0, 4)}...
              </span>
            </div>

            {/* Disconnect Button */}
            <button
              onClick={disconnect}
              className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-sm glow-secondary"
              title="Disconnect Wallet"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>
        </div>
      </header>
    );
  }
);

TopNavigation.displayName = "TopNavigation";

export default TopNavigation;
