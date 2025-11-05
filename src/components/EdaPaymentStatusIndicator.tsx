import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, CheckCircle, XCircle, BarChart3 } from "lucide-react";
import toast from "react-hot-toast";

interface EdaPaymentStatus {
  hasValidPayment: boolean;
  lastPaymentTime?: Date;
  transactionHash?: string;
  expiresAt?: Date;
}

export interface EdaPaymentStatusIndicatorRef {
  refresh: () => void;
}

const EdaPaymentStatusIndicator = forwardRef<EdaPaymentStatusIndicatorRef>(
  (props, ref) => {
    const { user } = useAuth();
    const [edaPaymentStatus, setEdaPaymentStatus] =
      useState<EdaPaymentStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const checkEdaPaymentStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/eda-payment/status", {
          headers: {
            "x-wallet-address": user!.wallet_address,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log("[DEBUG] EDA Payment status API response:", data);

          // Convert date strings to Date objects
          const edaPaymentStatus: EdaPaymentStatus = {
            ...data.edaPaymentStatus,
            lastPaymentTime: data.edaPaymentStatus.lastPaymentTime
              ? new Date(data.edaPaymentStatus.lastPaymentTime)
              : undefined,
            expiresAt: data.edaPaymentStatus.expiresAt
              ? new Date(data.edaPaymentStatus.expiresAt)
              : undefined,
          };

          console.log("[DEBUG] Processed EDA payment status:", {
            hasValidPayment: edaPaymentStatus.hasValidPayment,
            lastPaymentTime: edaPaymentStatus.lastPaymentTime?.toISOString(),
            expiresAt: edaPaymentStatus.expiresAt?.toISOString(),
            transactionHash: edaPaymentStatus.transactionHash,
            now: new Date().toISOString(),
            timeRemaining: edaPaymentStatus.expiresAt
              ? edaPaymentStatus.expiresAt.getTime() - new Date().getTime()
              : "N/A",
          });

          setEdaPaymentStatus(edaPaymentStatus);
        } else {
          console.error("Failed to check EDA payment status");
        }
      } catch (error) {
        console.error("EDA Payment status check error:", error);
        toast.error("Failed to check EDA payment status");
      } finally {
        setLoading(false);
      }
    };

    // Expose refresh function to parent components
    useImperativeHandle(ref, () => ({
      refresh: () => {
        console.log("[DEBUG] EdaPaymentStatusIndicator refresh called");
        checkEdaPaymentStatus();
      },
    }));

    useEffect(() => {
      if (user) {
        checkEdaPaymentStatus();
      }
    }, [user]);

    // Auto-refresh EDA payment status when it's about to expire
    useEffect(() => {
      if (!edaPaymentStatus?.expiresAt || !edaPaymentStatus.hasValidPayment) {
        return;
      }

      const timeUntilExpiry =
        edaPaymentStatus.expiresAt.getTime() - new Date().getTime();

      // Refresh 1 second after expiry, or immediately if already expired
      const refreshDelay = Math.max(timeUntilExpiry + 1000, 1000);

      const timeoutId = setTimeout(() => {
        console.log("[DEBUG] Auto-refreshing EDA payment status after expiry");
        checkEdaPaymentStatus();
      }, refreshDelay);

      return () => clearTimeout(timeoutId);
    }, [edaPaymentStatus?.expiresAt, edaPaymentStatus?.hasValidPayment]);

    if (loading) {
      return (
        <div className="glass border border-white/10 rounded-lg px-3 py-2 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="text-xs text-slate-300">Checking...</span>
          </div>
        </div>
      );
    }

    if (!edaPaymentStatus) {
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
          {edaPaymentStatus.hasValidPayment ? (
            <CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0" />
          ) : (
            <XCircle className="w-3 h-3 text-purple-400 flex-shrink-0" />
          )}
          <span className="text-xs font-medium text-slate-200 whitespace-nowrap">
            {edaPaymentStatus.hasValidPayment ? "EDA Active" : "EDA Inactive"}
          </span>

          {edaPaymentStatus.hasValidPayment && edaPaymentStatus.expiresAt && (
            <>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <div className="flex items-center space-x-1 text-xs text-slate-300">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span className="whitespace-nowrap">
                  {formatTimeRemaining(edaPaymentStatus.expiresAt)}
                  {edaPaymentStatus.transactionHash === "MOCK_EDA_TX_HASH" && (
                    <span
                      className="ml-1 text-slate-400"
                      title="Mock EDA access"
                    ></span>
                  )}
                </span>
              </div>
            </>
          )}

          {edaPaymentStatus.hasValidPayment && !edaPaymentStatus.expiresAt && (
            <>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs text-green-300 bg-green-500/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                Payment gate disabled
              </span>
            </>
          )}

          {!edaPaymentStatus.hasValidPayment && (
            <>
              <span className="text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs text-purple-300 bg-purple-500/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap hidden sm:inline">
                Payment required
              </span>
            </>
          )}

          {/* Debug refresh button - remove after testing */}
          <button
            onClick={() => {
              console.log("[DEBUG] Manual EDA refresh clicked");
              checkEdaPaymentStatus();
            }}
            className="text-xs text-slate-400 hover:text-slate-200 ml-1 sm:ml-2 flex-shrink-0"
            title="Refresh EDA payment status"
          >
            ↻
          </button>
        </div>
      </div>
    );
  }
);

EdaPaymentStatusIndicator.displayName = "EdaPaymentStatusIndicator";

export default EdaPaymentStatusIndicator;
