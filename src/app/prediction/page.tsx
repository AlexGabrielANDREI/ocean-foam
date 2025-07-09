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
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [featuresFile, setFeaturesFile] = useState<File | null>(null);
  const [apiParams, setApiParams] = useState("");

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const response = await fetch("/api/models", {
        headers: {
          "x-wallet-address": user!.wallet_address,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setModels(data.models.filter((model: Model) => model.is_active));
      }
    } catch (error) {
      console.error("Failed to load models:", error);
      toast.error("Failed to load models");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".json")) {
        toast.error("Please upload a .json file");
        return;
      }

      if (file.size > 1 * 1024 * 1024) {
        toast.error("File size must be less than 1MB");
        return;
      }

      setFeaturesFile(file);
      toast.success("Features file selected");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedModel) {
      toast.error("Please select a model");
      return;
    }

    if (selectedModel.use_manual_features && !featuresFile) {
      toast.error("Please select a features file for manual features model");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("modelId", selectedModel.id);

      if (selectedModel.use_manual_features && featuresFile) {
        formData.append("featuresFile", featuresFile);
      } else if (!selectedModel.use_manual_features && apiParams) {
        formData.append("apiParams", apiParams);
      }

      const response = await fetch("/api/prediction", {
        method: "POST",
        headers: {
          "x-wallet-address": user!.wallet_address,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Prediction failed");
      }

      const result = await response.json();
      setPredictionResult(result);
      toast.success("Prediction completed successfully!");
    } catch (error) {
      console.error("Prediction error:", error);
      toast.error(error instanceof Error ? error.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleFeatures = () => {
    const sampleFeatures = {
      price: 150.25,
      volume: 1000000,
      change: 2.5,
      market_cap: 5000000000,
      gdp: 2.1,
      inflation: 3.2,
      unemployment: 4.5,
    };

    const blob = new Blob([JSON.stringify(sampleFeatures, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_features.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          Make predictions using our trained machine learning models
        </p>
      </div>

      {/* Model Selection */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-foreground">
            Step 1: Select Model
          </h2>
        </div>
        <div className="card-body">
          {models.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
              <p className="text-secondary-600">No active models available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {models.map((model) => (
                <div
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedModel?.id === model.id
                      ? "border-primary-500 bg-primary-50"
                      : "border-border hover:border-primary-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-foreground">
                      {model.name}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                      v{model.version}
                    </span>
                  </div>
                  <p className="text-sm text-secondary-600 mb-3">
                    {model.description}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                      {model.use_manual_features
                        ? "Manual Features"
                        : "API Features"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Prediction Form */}
      {selectedModel && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-foreground">
              Step 2:{" "}
              {selectedModel.use_manual_features
                ? "Upload Features"
                : "Configure API Parameters"}
            </h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Model Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800 mb-1">
                      Selected Model
                    </h3>
                    <p className="text-sm text-blue-700">
                      <strong>{selectedModel.name}</strong> (v
                      {selectedModel.version}) - {selectedModel.description}
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Type:{" "}
                      {selectedModel.use_manual_features
                        ? "Manual Features Upload"
                        : "API Features Fetch"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Manual Features Upload */}
              {selectedModel.use_manual_features && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Features File (.json) *
                  </label>
                  <div className="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center">
                    <Upload className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="hidden"
                      id="features-upload"
                      required
                    />
                    <label htmlFor="features-upload" className="cursor-pointer">
                      <span className="text-primary-600 hover:text-primary-700 font-medium">
                        Click to upload
                      </span>
                      <span className="text-secondary-500">
                        {" "}
                        or drag and drop
                      </span>
                    </label>
                    <p className="text-sm text-secondary-500 mt-2">
                      Maximum file size: 1MB
                    </p>
                    <button
                      type="button"
                      onClick={downloadSampleFeatures}
                      className="mt-4 inline-flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Sample Features</span>
                    </button>
                    {featuresFile && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <File className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-green-700">
                            {featuresFile.name} (
                            {Math.round((featuresFile.size / 1024) * 100) / 100}{" "}
                            KB)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* API Parameters */}
              {!selectedModel.use_manual_features && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    API Parameters (JSON)
                  </label>
                  <textarea
                    value={apiParams}
                    onChange={(e) => setApiParams(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
                    placeholder={`{
  "stock_data": {
    "symbol": "AAPL"
  },
  "economic_data": {
    "indicator": "gdp"
  }
}`}
                  />
                  <p className="text-xs text-secondary-600 mt-1">
                    Optional: Provide API parameters for feature fetching. Leave
                    empty to use default mock data.
                  </p>
                </div>
              )}

              {/* Requirements Info */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800 mb-1">
                      Requirements
                    </h3>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• You need at least 1 token to make a prediction</li>
                      <li>• Each prediction costs 1 token</li>
                      <li>• Results are logged for audit purposes</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={
                    loading ||
                    (selectedModel.use_manual_features && !featuresFile)
                  }
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Make Prediction</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prediction Results */}
      {predictionResult && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-foreground">
              Prediction Results
            </h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-600 mb-1">
                    Prediction
                  </label>
                  <div className="bg-secondary-100 px-3 py-2 rounded text-lg font-mono">
                    {predictionResult.prediction.prediction}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-600 mb-1">
                    Type
                  </label>
                  <div className="bg-secondary-100 px-3 py-2 rounded text-sm">
                    {predictionResult.prediction.prediction_type}
                  </div>
                </div>
              </div>

              {predictionResult.prediction.confidence && (
                <div>
                  <label className="block text-sm font-medium text-secondary-600 mb-1">
                    Confidence
                  </label>
                  <div className="bg-secondary-100 px-3 py-2 rounded text-sm">
                    {(predictionResult.prediction.confidence * 100).toFixed(2)}%
                  </div>
                </div>
              )}

              {predictionResult.prediction.probabilities && (
                <div>
                  <label className="block text-sm font-medium text-secondary-600 mb-1">
                    Class Probabilities
                  </label>
                  <div className="space-y-2">
                    {Object.entries(
                      predictionResult.prediction.probabilities
                    ).map(([class_name, prob]) => (
                      <div
                        key={class_name}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm">{class_name}</span>
                        <span className="text-sm font-mono">
                          {(Number(prob) * 100).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-secondary-600 mb-1">
                  Features Used
                </label>
                <div className="bg-secondary-100 px-3 py-2 rounded text-sm">
                  {predictionResult.prediction.features_used.join(", ")}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-600 mb-1">
                  Timestamp
                </label>
                <div className="bg-secondary-100 px-3 py-2 rounded text-sm">
                  {new Date(
                    predictionResult.prediction.timestamp
                  ).toLocaleString()}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-secondary-600">
                    Tokens Remaining:
                  </span>
                  <span className="text-sm font-medium">
                    {predictionResult.tokens_remaining}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
