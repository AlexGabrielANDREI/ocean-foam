"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Upload,
  File,
  Database,
  Info,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";

type UploadStep = "form" | "review" | "nft";

export default function ModelUploadPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<UploadStep>("form");
  const [loading, setLoading] = useState(false);
  const [uploadedModel, setUploadedModel] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    modelFile: null as File | null,
    featuresFile: null as File | null,
    useManualFeatures: false,
    ownerWalletAddress: "",
    nft_id: "",
  });

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "model" | "features"
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (type === "model") {
        // Validate model file
        if (!file.name.endsWith(".pkl")) {
          toast.error("Please upload a .pkl file");
          return;
        }

        if (file.size > 50 * 1024 * 1024) {
          toast.error("File size must be less than 50MB");
          return;
        }

        setFormData((prev) => ({ ...prev, modelFile: file }));
        toast.success("Model file selected");
      } else {
        // Validate features file
        if (!file.name.endsWith(".json")) {
          toast.error("Please upload a .json file");
          return;
        }

        if (file.size > 1 * 1024 * 1024) {
          toast.error("Features file size must be less than 1MB");
          return;
        }

        setFormData((prev) => ({ ...prev, featuresFile: file }));
        toast.success("Features file selected");
      }
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleStep1Submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isAdmin) {
      toast.error("Admin access required");
      return;
    }

    if (!formData.modelFile) {
      toast.error("Please select a model file");
      return;
    }

    if (formData.useManualFeatures && !formData.featuresFile) {
      toast.error(
        "Please select a features file when manual features is enabled"
      );
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("modelFile", formData.modelFile);
      formDataToSend.append(
        "useManualFeatures",
        formData.useManualFeatures.toString()
      );
      formDataToSend.append(
        "ownerWalletAddress",
        formData.ownerWalletAddress || user!.wallet_address
      );

      if (formData.featuresFile) {
        formDataToSend.append("featuresFile", formData.featuresFile);
      }

      const response = await fetch("/api/models/upload", {
        method: "POST",
        headers: {
          "x-wallet-address": user!.wallet_address,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();
      setUploadedModel(result.model);
      setCurrentStep("review");
      toast.success("Model uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    if (!formData.nft_id.trim()) {
      toast.error("Please enter an NFT ID");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/models/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": user!.wallet_address,
        },
        body: JSON.stringify({
          model_id: uploadedModel.id,
          nft_id: formData.nft_id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Activation failed");
      }

      toast.success("Model is now active and available for prediction!");
      router.push("/admin/models");
    } catch (error) {
      console.error("Activation error:", error);
      toast.error(error instanceof Error ? error.message : "Activation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h1>
          <p className="text-secondary-600">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Upload ML Model
          </h1>
          <p className="text-secondary-600">
            Add a new machine learning model to the platform
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center space-x-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === "form"
                ? "bg-primary-600 text-white"
                : "bg-secondary-200 text-secondary-600"
            }`}
          >
            1
          </div>
          <div className="w-4 h-0.5 bg-secondary-300"></div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === "review"
                ? "bg-primary-600 text-white"
                : "bg-secondary-200 text-secondary-600"
            }`}
          >
            2
          </div>
          <div className="w-4 h-0.5 bg-secondary-300"></div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === "nft"
                ? "bg-primary-600 text-white"
                : "bg-secondary-200 text-secondary-600"
            }`}
          >
            3
          </div>
        </div>
      </div>

      {/* Step 1: Upload Form */}
      {currentStep === "form" && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-foreground">
              Step 1: Model Information
            </h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleStep1Submit} className="space-y-6">
              {/* Model Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Model Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Stock Price Predictor v1.0"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Describe what this model does and its key features..."
                />
              </div>

              {/* Owner Wallet Address */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Owner Wallet Address
                </label>
                <input
                  type="text"
                  value={formData.ownerWalletAddress}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ownerWalletAddress: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Leave empty to use your wallet address"
                />
                <p className="text-xs text-secondary-600 mt-1">
                  Optional: Specify a different wallet address as the model
                  owner. If left empty, your wallet address will be used.
                </p>
              </div>

              {/* Model File Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Model File (.pkl) *
                </label>
                <div className="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
                  <input
                    type="file"
                    accept=".pkl"
                    onChange={(e) => handleFileChange(e, "model")}
                    className="hidden"
                    id="model-upload"
                    required
                  />
                  <label htmlFor="model-upload" className="cursor-pointer">
                    <span className="text-primary-600 hover:text-primary-700 font-medium">
                      Click to upload
                    </span>
                    <span className="text-secondary-500">
                      {" "}
                      or drag and drop
                    </span>
                  </label>
                  <p className="text-sm text-secondary-500 mt-2">
                    Maximum file size: 50MB
                  </p>
                  {formData.modelFile && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <File className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-green-700">
                          {formData.modelFile.name} (
                          {Math.round(
                            (formData.modelFile.size / 1024 / 1024) * 100
                          ) / 100}{" "}
                          MB)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Features Checkbox */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.useManualFeatures}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        useManualFeatures: e.target.checked,
                      }))
                    }
                    className="text-primary-600 rounded"
                  />
                  <span className="text-sm font-medium text-foreground">
                    Use manual features upload (JSON file)
                  </span>
                </label>
                <p className="text-xs text-secondary-600 mt-1">
                  If checked, users will upload JSON files with features.
                  Otherwise, features will be fetched from API.
                </p>
              </div>

              {/* Features File Upload (conditional) */}
              {formData.useManualFeatures && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Sample Features File (.json) *
                  </label>
                  <div className="border-2 border-dashed border-secondary-300 rounded-lg p-6 text-center">
                    <Upload className="w-12 h-12 text-secondary-400 mx-auto mb-4" />
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => handleFileChange(e, "features")}
                      className="hidden"
                      id="features-upload"
                      required={formData.useManualFeatures}
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
                    {formData.featuresFile && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <File className="w-5 h-5 text-green-600" />
                          <span className="text-sm text-green-700">
                            {formData.featuresFile.name} (
                            {Math.round(
                              (formData.featuresFile.size / 1024) * 100
                            ) / 100}{" "}
                            KB)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Requirements Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800 mb-1">
                      Model Requirements
                    </h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• File must be in .pkl format (Python pickle)</li>
                      <li>• Model should be trained with scikit-learn</li>
                      <li>• Maximum file size: 50MB</li>
                      <li>
                        • Model will be automatically validated upon upload
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.push("/admin/models")}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !formData.modelFile ||
                    (formData.useManualFeatures && !formData.featuresFile)
                  }
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <span>Upload Model</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {currentStep === "review" && uploadedModel && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-foreground">
              Step 2: Review Model Details
            </h2>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-600 mb-1">
                      Model Hash
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 bg-secondary-100 px-3 py-2 rounded text-sm font-mono">
                        {uploadedModel.model_hash}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            uploadedModel.model_hash,
                            "Model Hash"
                          )
                        }
                        className="p-2 text-secondary-600 hover:text-secondary-900"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-600 mb-1">
                      Model Path
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 bg-secondary-100 px-3 py-2 rounded text-sm font-mono">
                        {uploadedModel.model_path}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            uploadedModel.model_path,
                            "Model Path"
                          )
                        }
                        className="p-2 text-secondary-600 hover:text-secondary-900"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-secondary-600 mb-1">
                      Model Name
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 bg-secondary-100 px-3 py-2 rounded text-sm font-mono">
                        {uploadedModel.name}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(uploadedModel.name, "Model Name")
                        }
                        className="p-2 text-secondary-600 hover:text-secondary-900"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-secondary-600 mb-1">
                      Owner Wallet
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 bg-secondary-100 px-3 py-2 rounded text-sm font-mono">
                        {uploadedModel.owner_wallet}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            uploadedModel.owner_wallet,
                            "Owner Wallet"
                          )
                        }
                        className="p-2 text-secondary-600 hover:text-secondary-900"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setCurrentStep("form")}
                  className="btn-secondary"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep("nft")}
                  className="btn-primary flex items-center space-x-2"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: NFT Registration */}
      {currentStep === "nft" && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-foreground">
              Step 3: NFT Registration
            </h2>
          </div>
          <div className="card-body">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  NFT ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nft_id}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nft_id: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 0x1234... (NFT token ID)"
                />
                <p className="text-xs text-secondary-600 mt-1">
                  Enter the NFT token ID associated with this model
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setCurrentStep("review")}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  onClick={handleStep2Submit}
                  disabled={loading || !formData.nft_id.trim()}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Activating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Register & Activate</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
