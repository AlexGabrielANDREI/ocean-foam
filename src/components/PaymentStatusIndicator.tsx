import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface PaymentStatus {
  hasValidPayment: boolean;
  lastPaymentTime?: Date;
  transactionHash?: string;
  expiresAt?: Date;
}

export interface PaymentStatusIndicatorRef {
  refresh: () => void;
}

const PaymentStatusIndicator = forwardRef<PaymentStatusIndicatorRef>(
  (props, ref) => {
    const { user } = useAuth();
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(
      null
    );
    const [loading, setLoading] = useState(true);

    const checkPaymentStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/payment/status", {
          headers: {
            "x-wallet-address": user!.wallet_address,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("[DEBUG] Payment status API response:", data);

          // Convert date strings to Date objects
          const paymentStatus: PaymentStatus = {
            ...data.paymentStatus,
            lastPaymentTime: data.paymentStatus.lastPaymentTime
              ? new Date(data.paymentStatus.lastPaymentTime)
              : undefined,
            expiresAt: data.paymentStatus.expiresAt
              ? new Date(data.paymentStatus.expiresAt)
              : undefined,
          };

          console.log("[DEBUG] Processed payment status:", {
            hasValidPayment: paymentStatus.hasValidPayment,
            lastPaymentTime: paymentStatus.lastPaymentTime?.toISOString(),
            expiresAt: paymentStatus.expiresAt?.toISOString(),
            transactionHash: paymentStatus.transactionHash,
            now: new Date().toISOString(),
            timeRemaining: paymentStatus.expiresAt
              ? paymentStatus.expiresAt.getTime() - new Date().getTime()
              : "N/A",
          });

          setPaymentStatus(paymentStatus);
        } else {
          console.error("Failed to check payment status");
        }
      } catch (error) {
        console.error("Payment status check error:", error);
        toast.error("Failed to check payment status");
      } finally {
        setLoading(false);
      }
    };

    // Expose refresh function to parent components
    useImperativeHandle(ref, () => ({
      refresh: () => {
        console.log("[DEBUG] PaymentStatusIndicator refresh called");
        checkPaymentStatus();
      },
    }));

    useEffect(() => {
      if (user) {
        checkPaymentStatus();
      }
    }, [user]);

    // Auto-refresh payment status when it's about to expire
    useEffect(() => {
      if (!paymentStatus?.expiresAt || !paymentStatus.hasValidPayment) {
        return;
      }

      const timeUntilExpiry =
        paymentStatus.expiresAt.getTime() - new Date().getTime();

      // Refresh 1 second after expiry, or immediately if already expired
      const refreshDelay = Math.max(timeUntilExpiry + 1000, 1000);

      const timeoutId = setTimeout(() => {
        console.log("[DEBUG] Auto-refreshing payment status after expiry");
        checkPaymentStatus();
      }, refreshDelay);

      return () => clearTimeout(timeoutId);
    }, [paymentStatus?.expiresAt, paymentStatus?.hasValidPayment]);

    if (loading) {
      return (
        <div className="glass border border-white/10 rounded-lg px-3 py-2 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-3 h-3 border-2 border-teal-500 border-t-transparent rounded-full"></div>
            <span className="text-xs text-slate-300">Checking...</span>
          </div>
        </div>
      );
    }

    if (!paymentStatus) {
      return null;
    }

    const formatTimeRemaining = (expiresAt: Date) => {
      const now = new Date();
      const timeLeft = expiresAt.getTime() - now.getTime();

      if (timeLeft <= 0) {
        return "Expired";
      }

      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    };

    return (
      <div className="glass border border-white/10 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 shadow-sm">
        <div className="flex items-center space-x-1 sm:space-x-2">
          {paymentStatus.hasValidPayment ? (
            <CheckCircle className="w-3 h-3 text-teal-500 flex-shrink-0" />
          ) : (
            <XCircle className="w-3 h-3 text-blue-400 flex-shrink-0" />
          )}
          <span className="text-xs font-medium text-slate-200 whitespace-nowrap">
            {paymentStatus.hasValidPayment ? "Active" : "Inactive"}
          </span>

          {paymentStatus.hasValidPayment && paymentStatus.expiresAt && (
            <>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <div className="flex items-center space-x-1 text-xs text-slate-300">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span className="whitespace-nowrap">
                  {formatTimeRemaining(paymentStatus.expiresAt)}
                  {paymentStatus.transactionHash === "MOCK_TX_HASH" && (
                    <span
                      className="ml-1 text-slate-400"
                      title="Mock prediction"
                    ></span>
                  )}
                </span>
              </div>
            </>
          )}

          {paymentStatus.hasValidPayment && !paymentStatus.expiresAt && (
            <>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs text-green-300 bg-green-500/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                Payment gate disabled
              </span>
            </>
          )}

          {!paymentStatus.hasValidPayment && (
            <>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs text-blue-300 bg-blue-500/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap hidden sm:inline">
                Payment required
              </span>
            </>
          )}

          {/* Debug refresh button - remove after testing */}
          <button
            onClick={() => {
              console.log("[DEBUG] Manual refresh clicked");
              checkPaymentStatus();
            }}
            className="text-xs text-slate-400 hover:text-slate-200 ml-1 sm:ml-2 flex-shrink-0"
            title="Refresh payment status"
          >
            ↻
          </button>
        </div>
      </div>
    );
  }
);

export default PaymentStatusIndicator;
