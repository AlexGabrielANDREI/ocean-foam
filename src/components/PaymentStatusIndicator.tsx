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
        <div className="card p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            <span className="text-secondary-600">
              Checking payment status...
            </span>
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
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {paymentStatus.hasValidPayment ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}

            <div>
              <h3 className="font-semibold text-foreground">Payment Status</h3>
              <p className="text-sm text-secondary-600">
                {paymentStatus.hasValidPayment
                  ? "Valid payment found"
                  : "No valid payment"}
              </p>
            </div>
          </div>

          {paymentStatus.hasValidPayment && paymentStatus.expiresAt && (
            <div className="text-right">
              <div className="flex items-center space-x-1 text-sm text-secondary-600">
                <Clock className="w-4 h-4" />
                <span>{formatTimeRemaining(paymentStatus.expiresAt)}</span>
              </div>
              <div className="text-xs text-secondary-500">
                Paid: {formatDate(paymentStatus.lastPaymentTime!)}
              </div>
            </div>
          )}
        </div>

        {paymentStatus.transactionHash && (
          <div className="mt-3 p-2 bg-secondary-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-secondary-500" />
              <span className="text-xs text-secondary-600">Transaction:</span>
              <a
                href={`https://sepolia.etherscan.io/tx/${paymentStatus.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-500 hover:underline font-mono"
              >
                {paymentStatus.transactionHash.slice(0, 10)}...
              </a>
            </div>
          </div>
        )}

        {!paymentStatus.hasValidPayment && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Payment required to run predictions
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default PaymentStatusIndicator;
