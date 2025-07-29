"use client";

import { useState, useEffect, useRef } from "react";
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
import PaymentStatusIndicator, {
  PaymentStatusIndicatorRef,
} from "./PaymentStatusIndicator";

interface Model {
  id: string;
  name: string;
  description: string;
  version: number;
  use_manual_features: boolean;
  is_active: boolean;
}

export default function PredictionPage() {
  const { user } = useAuth();
  const [activeModel, setActiveModel] = useState<Model | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [currentTransactionHash, setCurrentTransactionHash] =
    useState<string>("");

  const paymentStatusRef = useRef<PaymentStatusIndicatorRef>(null);

  useEffect(() => {
    loadActiveModel();
  }, []);

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
    toast.success("Payment successful! You can now run your prediction.");

    // Refresh payment status after successful payment
    setTimeout(() => {
      paymentStatusRef.current?.refresh();
    }, 1000); // Small delay to ensure the prediction is saved first
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Predictions</h1>
        <p className="text-secondary-600">
          Run predictions using the active machine learning model
        </p>
      </div>

      {/* Payment Status Indicator */}
      <PaymentStatusIndicator ref={paymentStatusRef} />

      {/* Interest Rate Chart with payment flow enforced */}
      <InterestRateChart
        paymentRequired={true}
        showPaymentModal={showPaymentModal}
        onShowPaymentModal={handleShowPaymentModal}
        onPaymentSuccess={handlePaymentSuccess}
        onRefreshPaymentStatus={() => paymentStatusRef.current?.refresh()}
      />

      {/* Active Model Info */}
      {activeModel ? (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-foreground">
              Active Model
            </h2>
          </div>
          <div className="card-body">
            <div className="mb-4">
              <h3 className="font-medium text-foreground text-xl">
                {activeModel.name}
              </h3>
              <p className="text-secondary-600 mb-2">
                {activeModel.description}
              </p>
              <span className="bg-secondary-100 text-secondary-700 px-2 py-1 rounded text-sm mr-2">
                v{activeModel.version}
              </span>
              {activeModel.use_manual_features && (
                <span className="bg-accent-yellow text-black px-2 py-1 rounded text-xs font-semibold">
                  Uses Manual Features
                </span>
              )}
            </div>
            <div className="text-sm text-secondary-500 mb-4">
              💡 Use the "Predict Next Rate" button in the chart above to run
              predictions for the upcoming FOMC meeting.
            </div>
            {/* Optionally, you can remove or disable the Predict button here to avoid duplicate payment logic */}
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Database className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
          <p className="text-secondary-600">No active model available</p>
        </div>
      )}
    </div>
  );
}
