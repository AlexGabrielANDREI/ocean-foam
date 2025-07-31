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
      refresh: checkPaymentStatus,
    }));

    useEffect(() => {
      if (user) {
        checkPaymentStatus();
      }
    }, [user]);

    if (loading) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full"></div>
            <span className="text-sm text-gray-600">Checking payment...</span>
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
        return `${hours}h ${minutes}m remaining`;
      } else {
        return `${minutes}m remaining`;
      }
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm min-w-[280px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {paymentStatus.hasValidPayment ? (
              <CheckCircle className="w-4 h-4 text-teal-500" />
            ) : (
              <XCircle className="w-4 h-4 text-blue-500" />
            )}
            <span className="text-sm font-medium text-gray-900">
              {paymentStatus.hasValidPayment
                ? "Payment Active"
                : "Payment Required"}
            </span>
          </div>
        </div>

        {paymentStatus.hasValidPayment && paymentStatus.expiresAt && (
          <div className="flex items-center space-x-1 text-xs text-gray-600 mb-2">
            <Clock className="w-3 h-3" />
            <span>{formatTimeRemaining(paymentStatus.expiresAt)}</span>
          </div>
        )}

        {paymentStatus.transactionHash && (
          <div className="text-xs text-gray-500 mb-2">
            <a
              href={`https://sepolia.etherscan.io/tx/${paymentStatus.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:underline font-mono"
            >
              {paymentStatus.transactionHash.slice(0, 8)}...
              {paymentStatus.transactionHash.slice(-6)}
            </a>
          </div>
        )}

        {!paymentStatus.hasValidPayment && (
          <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
            Payment required to run predictions
          </div>
        )}
      </div>
    );
  }
);

export default PaymentStatusIndicator;
