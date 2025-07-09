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
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);

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

  const handleRun = async () => {
    setLoading(true);
    setPredictionResult(null);
    try {
      const response = await fetch("/api/prediction", {
        method: "POST",
        headers: {
          "x-wallet-address": user!.wallet_address,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Prediction failed");
      }
      const result = await response.json();
      setPredictionResult(result.prediction);
      toast.success("Prediction completed successfully!");
    } catch (error) {
      console.error("Prediction error:", error);
      toast.error(error instanceof Error ? error.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
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
            <button
              onClick={handleRun}
              className="btn-primary flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <span className="animate-spin mr-2">⏳</span>Running...
                </span>
              ) : (
                <span className="flex items-center">
                  <Play className="w-5 h-5 mr-2" />
                  Run Prediction
                </span>
              )}
            </button>
            {predictionResult && (
              <div className="mt-6 p-4 rounded-xl bg-card border border-border">
                <h4 className="font-semibold mb-2 text-foreground">
                  Prediction Result
                </h4>
                <pre className="text-sm text-secondary-200 whitespace-pre-wrap">
                  {JSON.stringify(predictionResult, null, 2)}
                </pre>
              </div>
            )}
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
