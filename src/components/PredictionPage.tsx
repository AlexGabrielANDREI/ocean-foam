"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Upload,
  File,
  Database,
  Info,
  AlertCircle,
  Play,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import InterestRateChart from "./InterestRateChart";
import PaymentModal from "./PaymentModal";

interface Model {
  id: string;
  name: string;
  description: string;
  version: number;
  use_manual_features: boolean;
  is_active: boolean;
}

interface PredictionPageProps {
  onRefreshPaymentStatus?: () => void;
}

export default function PredictionPage({
  onRefreshPaymentStatus,
}: PredictionPageProps) {
  const { user } = useAuth();
  const [activeModel, setActiveModel] = useState<Model | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [currentTransactionHash, setCurrentTransactionHash] =
    useState<string>("");
  const [paymentRequired, setPaymentRequired] = useState(true);

  useEffect(() => {
    loadActiveModel();
    checkPaymentStatus();
  }, []);

  const checkPaymentStatus = async () => {
    try {
      const response = await fetch("/api/payment/status", {
        headers: {
          "x-wallet-address": user!.wallet_address,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const hasValidPayment = data.paymentStatus.hasValidPayment;
        setPaymentRequired(!hasValidPayment);
        console.log("[DEBUG] Payment status check:", {
          hasValidPayment,
          paymentRequired: !hasValidPayment,
        });
      } else {
        console.error("Failed to check payment status");
        setPaymentRequired(true); // Default to requiring payment if check fails
      }
    } catch (error) {
      console.error("Payment status check error:", error);
      setPaymentRequired(true); // Default to requiring payment if check fails
    }
  };

  const loadActiveModel = async () => {
    try {
      const response = await fetch("/api/models", {
        headers: {
          "x-wallet-address": user!.wallet_address,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const active = data.models.find((model: Model) => model.is_active);
        setActiveModel(active || null);
      }
    } catch (error) {
      console.error("Failed to load model:", error);
      toast.error("Failed to load model");
    }
  };

  // Unified payment modal logic for both chart and page
  const handleShowPaymentModal = () => setShowPaymentModal((v) => !v);
  const handlePaymentSuccess = (transactionHash: string) => {
    setShowPaymentModal(false);
    setPaymentComplete(true);
    setCurrentTransactionHash(transactionHash);
    setPaymentRequired(false); // User now has valid payment
    toast.success("Payment successful! You can now run your prediction.");

    // Refresh payment status after successful payment with longer delay
    setTimeout(() => {
      console.log("[DEBUG] Refreshing payment status after payment success");
      checkPaymentStatus(); // Update our local payment status
      onRefreshPaymentStatus?.(); // Refresh the payment status indicator in top navigation
    }, 3000); // Longer delay to ensure backend processes the payment
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Authentication Required
          </h1>
          <p className="text-secondary-600">
            Please connect your wallet to access predictions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="text-center mb-8">
          <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-4">
            FOMC Interest Prediction and Analytics
          </h1>

          <div className="max-w-3xl mx-auto space-y-3">
            <p className="text-lg lg:text-xl text-gray-700 font-medium leading-relaxed">
              A data-driven dApp for forecasting Federal Reserve interest rate
              decisions and market reactions.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Predicts FOMC interest rate moves using historical data and
              financial indicators.
              <span className="font-semibold text-gray-700">
                {" "}
                Useful for traders, researchers, and data scientists.
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-4 mt-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
              <span>Real-time Data</span>
            </div>
            <div className="hidden lg:block w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>ML-Powered</span>
            </div>
            <div className="hidden lg:block w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Blockchain Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interest Rate Chart with dynamic payment requirement */}
      <InterestRateChart
        paymentRequired={paymentRequired}
        showPaymentModal={showPaymentModal}
        onShowPaymentModal={handleShowPaymentModal}
        onPaymentSuccess={handlePaymentSuccess}
        onRefreshPaymentStatus={() => {
          checkPaymentStatus(); // Update our local payment status
        }}
      />

      {/* Active Model Info */}
      {activeModel ? (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-white">Active Model</h2>
          </div>
          <div className="card-body">
            <div className="mb-4">
              <h3 className="font-medium text-white text-xl">
                {activeModel.name}
              </h3>
              <p className="text-teal-200 mb-2">{activeModel.description}</p>
              <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded text-sm mr-2">
                v{activeModel.version}
              </span>
              {activeModel.use_manual_features && (
                <span className="bg-teal-400 text-white px-2 py-1 rounded text-xs font-semibold">
                  Uses Manual Features
                </span>
              )}
            </div>
            <div className="text-sm text-teal-300 mb-4">
              💡 Use the "Predict Next Rate" button in the chart above to run
              predictions for the upcoming FOMC meeting.
            </div>
            {/* Optionally, you can remove or disable the Predict button here to avoid duplicate payment logic */}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Database className="w-12 h-12 text-teal-400 mx-auto mb-4" />
          <p className="text-teal-200">No active model available</p>
        </div>
      )}
    </div>
  );
}
