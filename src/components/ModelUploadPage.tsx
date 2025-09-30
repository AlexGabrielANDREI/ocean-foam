"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  File,
  Check,
  Copy,
  ArrowRight,
  ArrowLeft,
  Database,
  Sparkles,
  Hash,
  MapPin,
  User,
} from "lucide-react";
import toast from "react-hot-toast";

interface UploadedModel {
  id: string;
  name: string;
  description: string;
  version: number;
  model_path: string;
  model_hash: string;
  owner_wallet: string;
  use_manual_features: boolean;
  is_active: boolean;
}

export default function ModelUploadPage() {
  const { user, isAdmin } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedModel, setUploadedModel] = useState<UploadedModel | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [nftId, setNftId] = useState("");

  // Form data for step 1
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    useManualFeatures: false,
    ownerWalletAddress: user?.wallet_address || "",
  });

  // File states
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [featuresFile, setFeaturesFile] = useState<File | null>(null);
  const [edaFile, setEdaFile] = useState<File | null>(null);

  // Step 1: Model upload dropzone
  const onModelDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (!file.name.endsWith(".pkl")) {
        toast.error("Please upload a .pkl file");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }
      setModelFile(file);
      toast.success("Model file selected");
    }
  }, []);

  const {
    getRootProps: getModelRootProps,
    getInputProps: getModelInputProps,
    isDragActive: isModelDragActive,
  } = useDropzone({
    onDrop: onModelDrop,
    accept: { "application/octet-stream": [".pkl"] },
    maxFiles: 1,
  });

  // Features file dropzone
  const onFeaturesDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (!file.name.endsWith(".json")) {
        toast.error("Please upload a .json file");
        return;
      }
      if (file.size > 1 * 1024 * 1024) {
        toast.error("Features file size must be less than 1MB");
        return;
      }
      setFeaturesFile(file);
      toast.success("Features file selected");
    }
  }, []);

  const {
    getRootProps: getFeaturesRootProps,
    getInputProps: getFeaturesInputProps,
    isDragActive: isFeaturesDragActive,
  } = useDropzone({
    onDrop: onFeaturesDrop,
    accept: { "application/json": [".json"] },
    maxFiles: 1,
  });

  // EDA file dropzone
  const onEdaDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (!file.name.endsWith(".pdf")) {
        toast.error("Please upload a .pdf file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("EDA file size must be less than 10MB");
        return;
      }
      setEdaFile(file);
      toast.success("EDA file selected");
    }
  }, []);

  const {
    getRootProps: getEdaRootProps,
    getInputProps: getEdaInputProps,
    isDragActive: isEdaDragActive,
  } = useDropzone({
    onDrop: onEdaDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  // Handle form submission for step 1
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !modelFile) {
      toast.error("Please fill in all required fields and upload a model file");
      return;
    }

    if (formData.useManualFeatures && !featuresFile) {
      toast.error("Please upload a features file for manual features model");
      return;
    }

    setLoading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("name", formData.name);
      uploadFormData.append("description", formData.description);
      uploadFormData.append("modelFile", modelFile);
      uploadFormData.append(
        "useManualFeatures",
        formData.useManualFeatures.toString()
      );
      uploadFormData.append("ownerWalletAddress", formData.ownerWalletAddress);

      if (formData.useManualFeatures && featuresFile) {
        uploadFormData.append("featuresFile", featuresFile);
      }

      if (edaFile) {
        uploadFormData.append("edaFile", edaFile);
      }

      const response = await fetch("/api/models/upload", {
        method: "POST",
        headers: {
          "x-wallet-address": user!.wallet_address,
        },
        body: uploadFormData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const result = await response.json();
      setUploadedModel(result.model);
      setCurrentStep(2);
      toast.success("Model uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  // Handle step 3: NFT registration and activation
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nftId.trim()) {
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
          model_id: uploadedModel!.id,
          nft_id: nftId.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Activation failed");
      }

      toast.success("Model activated successfully!");
      setCurrentStep(1);
      setUploadedModel(null);
      setFormData({
        name: "",
        description: "",
        useManualFeatures: false,
        ownerWalletAddress: user?.wallet_address || "",
      });
      setModelFile(null);
      setFeaturesFile(null);
      setNftId("");
    } catch (error) {
      console.error("Activation error:", error);
      toast.error(error instanceof Error ? error.message : "Activation failed");
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Upload Model</h1>
        <p className="text-xl text-secondary-300">
          Complete the 3-step process to upload and activate your ML model
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= step
                  ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-white"
                  : "bg-card border border-border text-secondary-400"
              }`}
            >
              {currentStep > step ? <Check className="w-5 h-5" /> : step}
            </div>
            {step < 3 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  currentStep > step
                    ? "bg-gradient-to-r from-primary-500 to-secondary-500"
                    : "bg-card border border-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Model Information & Upload */}
      {currentStep === 1 && (
        <div className="glass rounded-3xl p-8">
          <div className="flex items-center mb-6">
            <Database className="w-6 h-6 mr-3 text-accent-green" />
            <h2 className="text-2xl font-bold text-white">
              Step 1: Model Information & Upload
            </h2>
          </div>

          <form onSubmit={handleStep1Submit} className="space-y-6">
            {/* Model Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Model Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., Stock Price Predictor v1.0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Owner Wallet Address
                </label>
                <input
                  type="text"
                  value={formData.ownerWalletAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ownerWalletAddress: e.target.value,
                    })
                  }
                  className="input-field"
                  placeholder="Wallet address for model ownership"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="input-field min-h-[100px]"
                placeholder="Describe what your model does..."
              />
            </div>

            {/* Manual Features Toggle */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="useManualFeatures"
                checked={formData.useManualFeatures}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    useManualFeatures: e.target.checked,
                  })
                }
                className="w-4 h-4 text-primary-500 bg-card border-border rounded focus:ring-primary-400"
              />
              <label
                htmlFor="useManualFeatures"
                className="text-sm font-medium text-white"
              >
                Use Manual Features (users upload JSON files)
              </label>
            </div>

            {/* Model File Upload */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Model File (.pkl) *
              </label>
              <div
                {...getModelRootProps()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                  isModelDragActive
                    ? "border-primary-500 bg-primary-500/10"
                    : "border-border hover:border-primary-400"
                }`}
              >
                <input {...getModelInputProps()} />
                <Upload className="w-12 h-12 mx-auto mb-4 text-secondary-400" />
                {modelFile ? (
                  <div>
                    <p className="text-white font-medium">{modelFile.name}</p>
                    <p className="text-sm text-secondary-400">
                      Size: {(modelFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-white font-medium">
                      {isModelDragActive
                        ? "Drop the model file here"
                        : "Drag & drop model file here"}
                    </p>
                    <p className="text-sm text-secondary-400">
                      or click to select
                    </p>
                    <p className="text-xs text-secondary-500 mt-2">
                      Maximum size: 50MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Features File Upload (if manual features enabled) */}
            {formData.useManualFeatures && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Features Template File (.json)
                </label>
                <div
                  {...getFeaturesRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                    isFeaturesDragActive
                      ? "border-accent-green bg-accent-green/10"
                      : "border-border hover:border-accent-green"
                  }`}
                >
                  <input {...getFeaturesInputProps()} />
                  <File className="w-12 h-12 mx-auto mb-4 text-secondary-400" />
                  {featuresFile ? (
                    <div>
                      <p className="text-white font-medium">
                        {featuresFile.name}
                      </p>
                      <p className="text-sm text-secondary-400">
                        Size: {(featuresFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white font-medium">
                        {isFeaturesDragActive
                          ? "Drop the features file here"
                          : "Drag & drop features template here"}
                      </p>
                      <p className="text-sm text-secondary-400">
                        or click to select
                      </p>
                      <p className="text-xs text-secondary-500 mt-2">
                        Maximum size: 1MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* EDA File Upload (Optional) */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                EDA Report File (.pdf){" "}
                <span className="text-secondary-400">(Optional)</span>
              </label>
              <div
                {...getEdaRootProps()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                  isEdaDragActive
                    ? "border-accent-green bg-accent-green/10"
                    : "border-border hover:border-accent-green"
                }`}
              >
                <input {...getEdaInputProps()} />
                <File className="w-12 h-12 mx-auto mb-4 text-secondary-400" />
                {edaFile ? (
                  <div>
                    <p className="text-white font-medium">{edaFile.name}</p>
                    <p className="text-sm text-secondary-400">
                      Size: {(edaFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-white font-medium">
                      {isEdaDragActive
                        ? "Drop the EDA file here"
                        : "Drag & drop EDA report here"}
                    </p>
                    <p className="text-sm text-secondary-400">
                      or click to select
                    </p>
                    <p className="text-xs text-secondary-500 mt-2">
                      Maximum size: 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <span>Upload Model</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Review Model Details */}
      {currentStep === 2 && uploadedModel && (
        <div className="glass rounded-3xl p-8">
          <div className="flex items-center mb-6">
            <Sparkles className="w-6 h-6 mr-3 text-accent-green" />
            <h2 className="text-2xl font-bold text-white">
              Step 2: Review Model Details
            </h2>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Hash className="w-5 h-5 text-primary-500" />
                    <h3 className="font-semibold text-white">Model Hash</h3>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(uploadedModel.model_hash, "Model Hash")
                    }
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 text-secondary-400" />
                  </button>
                </div>
                <p className="text-sm text-secondary-400 font-mono break-all">
                  {uploadedModel.model_hash}
                </p>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-secondary-500" />
                    <h3 className="font-semibold text-white">Model Path</h3>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(uploadedModel.model_path, "Model Path")
                    }
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 text-secondary-400" />
                  </button>
                </div>
                <p className="text-sm text-secondary-400 font-mono break-all">
                  {uploadedModel.model_path}
                </p>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-accent-green" />
                    <h3 className="font-semibold text-white">Model Name</h3>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(uploadedModel.name, "Model Name")
                    }
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 text-secondary-400" />
                  </button>
                </div>
                <p className="text-sm text-secondary-400">
                  {uploadedModel.name} (v{uploadedModel.version})
                </p>
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-accent-orange" />
                    <h3 className="font-semibold text-white">Owner Wallet</h3>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        uploadedModel.owner_wallet,
                        "Owner Wallet"
                      )
                    }
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 text-secondary-400" />
                  </button>
                </div>
                <p className="text-sm text-secondary-400 font-mono break-all">
                  {uploadedModel.owner_wallet}
                </p>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="btn-secondary flex items-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="btn-primary flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: NFT Registration */}
      {currentStep === 3 && uploadedModel && (
        <div className="glass rounded-3xl p-8">
          <div className="flex items-center mb-6">
            <Sparkles className="w-6 h-6 mr-3 text-accent-green" />
            <h2 className="text-2xl font-bold text-white">
              Step 3: NFT Registration & Activation
            </h2>
          </div>

          <form onSubmit={handleStep3Submit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                NFT ID *
              </label>
              <input
                type="text"
                value={nftId}
                onChange={(e) => setNftId(e.target.value)}
                className="input-field"
                placeholder="Enter the NFT token ID for this model"
                required
              />
              <p className="text-sm text-secondary-400 mt-2">
                This NFT ID will be associated with the model and required for
                activation.
              </p>
            </div>

            <div className="bg-accent-green/10 border border-accent-green/20 rounded-2xl p-6">
              <h3 className="font-semibold text-accent-green mb-2">
                Model Ready for Activation
              </h3>
              <p className="text-sm text-secondary-400">
                Once you provide the NFT ID and click "Register & Activate", the
                model will become available for predictions.
              </p>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="btn-secondary flex items-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-accent flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Activating...</span>
                  </>
                ) : (
                  <>
                    <span>Register & Activate</span>
                    <Sparkles className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
