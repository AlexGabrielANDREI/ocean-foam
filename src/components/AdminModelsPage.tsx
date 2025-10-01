"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, getSupabaseClient } from "@/lib/supabase";
import {
  Database,
  Upload,
  Plus,
  Settings,
  Trash2,
  Eye,
  Edit2,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useDropzone } from "react-dropzone";

type Model = {
  id: string;
  name: string;
  description: string;
  version: number;
  model_hash: string;
  model_path: string;
  owner_wallet: string;
  nft_id: string | null;
  is_active: boolean;
  created_at: string;
  features_path: string;
  eda_path: string | null;
  use_manual_features: boolean;
};

interface AdminModelsPageProps {
  onRouteChange?: (route: string) => void;
}

export default function AdminModelsPage({
  onRouteChange,
}: AdminModelsPageProps) {
  const { user, isAdmin } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModel, setEditModel] = useState<Model | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    version: 1,
    owner_wallet: "",
    use_manual_features: false,
  });
  const [editModelFile, setEditModelFile] = useState<File | null>(null);
  const [editFeaturesFile, setEditFeaturesFile] = useState<File | null>(null);
  const [editEdaFile, setEditEdaFile] = useState<File | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Model | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchModels();
    }
  }, [isAdmin]);

  const fetchModels = async () => {
    try {
      console.log("🔄 Fetching models...");

      // Use authenticated client if user is available
      const client = user?.wallet_address
        ? getSupabaseClient(user.wallet_address)
        : supabase;

      const { data, error } = await client
        .from("models")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log("📋 Fetched models:", data?.length || 0, "models");
      setModels(data || []);
    } catch (error) {
      console.error("Error fetching models:", error);
      toast.error("Failed to fetch models");
    } finally {
      setLoading(false);
    }
  };

  const toggleModelStatus = async (modelId: string, currentStatus: boolean) => {
    if (!user?.wallet_address) return;

    try {
      const authenticatedClient = getSupabaseClient(user.wallet_address);
      const { error } = await authenticatedClient
        .from("models")
        .update({ is_active: !currentStatus })
        .eq("id", modelId);

      if (error) throw error;

      toast.success(
        `Model ${!currentStatus ? "activated" : "deactivated"} successfully`
      );
      fetchModels();
    } catch (error) {
      console.error("Error updating model status:", error);
      toast.error("Failed to update model status");
    }
  };

  const confirmDeleteModel = (model: Model) => setDeleteTarget(model);
  const closeDeleteModal = () => setDeleteTarget(null);

  const deleteModel = async () => {
    if (!deleteTarget || !user?.wallet_address) return;
    setDeleteLoading(true);

    console.log("🗑️ Starting delete process for model:", deleteTarget);
    console.log("🗑️ Model path:", deleteTarget.model_path);
    console.log("🗑️ Features path:", deleteTarget.features_path);
    console.log("🗑️ User wallet:", user.wallet_address);

    // Get authenticated Supabase client
    const authenticatedClient = getSupabaseClient(user.wallet_address);

    try {
      // First, let's test if we can access the storage buckets
      console.log("🔍 Testing storage access...");

      // List files in ml-models bucket
      const { data: modelFiles, error: listModelError } = await supabase.storage
        .from("ml-models")
        .list();

      console.log("📁 Model files in bucket:", modelFiles);
      if (listModelError)
        console.warn("⚠️ Error listing model files:", listModelError);

      // List files in features-uploads bucket
      const { data: featureFiles, error: listFeatureError } =
        await supabase.storage.from("features-uploads").list();

      console.log("📁 Feature files in bucket:", featureFiles);
      if (listFeatureError)
        console.warn("⚠️ Error listing feature files:", listFeatureError);

      // Delete from database first using authenticated client
      console.log("🗑️ Deleting from database...");
      const { error } = await authenticatedClient
        .from("models")
        .delete()
        .eq("id", deleteTarget.id);

      if (error) {
        console.error("❌ Database delete error:", error);
        throw error;
      }

      console.log("✅ Database record deleted successfully");

      // Delete model file from storage
      if (deleteTarget.model_path) {
        console.log(
          "🗑️ Attempting to delete model file:",
          deleteTarget.model_path
        );
        try {
          const { error: modelDeleteError } = await supabase.storage
            .from("ml-models")
            .remove([deleteTarget.model_path]);

          if (modelDeleteError) {
            console.warn("⚠️ Model file delete error:", modelDeleteError);
          } else {
            console.log("✅ Model file deleted successfully");
          }
        } catch (storageError) {
          console.warn("⚠️ Model file storage error:", storageError);
        }
      } else {
        console.log("ℹ️ No model path to delete");
      }

      // Delete features file from storage
      if (deleteTarget.features_path) {
        console.log(
          "🗑️ Attempting to delete features file:",
          deleteTarget.features_path
        );
        try {
          const { error: featuresDeleteError } = await supabase.storage
            .from("features-uploads")
            .remove([deleteTarget.features_path]);

          if (featuresDeleteError) {
            console.warn("⚠️ Features file delete error:", featuresDeleteError);
          } else {
            console.log("✅ Features file deleted successfully");
          }
        } catch (storageError) {
          console.warn("⚠️ Features file storage error:", storageError);
        }
      } else {
        console.log("ℹ️ No features path to delete");
      }

      // Delete EDA file from storage
      if (deleteTarget.eda_path) {
        console.log("🗑️ Attempting to delete EDA file:", deleteTarget.eda_path);
        try {
          const { error: edaDeleteError } = await supabase.storage
            .from("eda-reports")
            .remove([deleteTarget.eda_path]);

          if (edaDeleteError) {
            console.warn("⚠️ EDA file delete error:", edaDeleteError);
          } else {
            console.log("✅ EDA file deleted successfully");
          }
        } catch (storageError) {
          console.warn("⚠️ EDA file storage error:", storageError);
        }
      } else {
        console.log("ℹ️ No EDA path to delete");
      }

      toast.success("Model and associated files deleted successfully");
      setDeleteTarget(null);

      // Update state directly to remove the deleted model
      setModels((prevModels) =>
        prevModels.filter((model) => model.id !== deleteTarget.id)
      );
      console.log("✅ Model removed from state");

      // Also fetch fresh data from database
      console.log("🔄 Refreshing models list after deletion...");
      await fetchModels();
      console.log("✅ Models list refreshed");
    } catch (error) {
      console.error("❌ Error deleting model:", error);
      toast.error("Failed to delete model and files");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUploadClick = () => {
    if (onRouteChange) {
      onRouteChange("admin-upload");
    } else {
      // Fallback: update URL directly
      window.history.pushState({}, "", "/admin/models/upload");
      // Trigger a page reload to ensure the route change is detected
      window.location.reload();
    }
  };

  const openEditModal = (model: Model) => {
    setEditModel(model);
    setEditForm({
      name: model.name,
      description: model.description,
      version: model.version,
      owner_wallet: model.owner_wallet,
      use_manual_features: model.use_manual_features ?? false,
    });
    setEditModelFile(null);
    setEditFeaturesFile(null);
  };

  const closeEditModal = () => {
    setEditModel(null);
    setEditForm({
      name: "",
      description: "",
      version: 1,
      owner_wallet: "",
      use_manual_features: false,
    });
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" && "checked" in e.target
        ? (e.target as HTMLInputElement).checked
        : undefined;
    setEditForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "version"
          ? Number(value)
          : value,
    }));
  };

  // Dropzone for model file
  const onEditModelDrop = (acceptedFiles: File[]) => {
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
      setEditModelFile(file);
      toast.success("Model file selected");
    }
  };
  const {
    getRootProps: getEditModelRootProps,
    getInputProps: getEditModelInputProps,
    isDragActive: isEditModelDragActive,
  } = useDropzone({
    onDrop: onEditModelDrop,
    accept: { "application/octet-stream": [".pkl"] },
    maxFiles: 1,
  });

  // Dropzone for features file
  const onEditFeaturesDrop = (acceptedFiles: File[]) => {
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
      setEditFeaturesFile(file);
      toast.success("Features file selected");
    }
  };
  const {
    getRootProps: getEditFeaturesRootProps,
    getInputProps: getEditFeaturesInputProps,
    isDragActive: isEditFeaturesDragActive,
  } = useDropzone({
    onDrop: onEditFeaturesDrop,
    accept: { "application/json": [".json"] },
    maxFiles: 1,
  });

  const onEditEdaDrop = (acceptedFiles: File[]) => {
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
      setEditEdaFile(file);
      toast.success("EDA file selected");
    }
  };

  const {
    getRootProps: getEditEdaRootProps,
    getInputProps: getEditEdaInputProps,
    isDragActive: isEditEdaDragActive,
  } = useDropzone({
    onDrop: onEditEdaDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
  });

  const saveEdit = async () => {
    if (!editModel) return;
    setEditLoading(true);
    try {
      const formData = new FormData();
      formData.append("modelId", editModel.id);
      formData.append("name", editForm.name);
      formData.append("description", editForm.description);
      formData.append("version", editForm.version.toString());
      formData.append("ownerWallet", editForm.owner_wallet);
      formData.append(
        "useManualFeatures",
        editForm.use_manual_features.toString()
      );

      // Add files if provided
      if (editModelFile) {
        formData.append("modelFile", editModelFile);
      }
      if (editFeaturesFile) {
        formData.append("featuresFile", editFeaturesFile);
      }
      if (editEdaFile) {
        formData.append("edaFile", editEdaFile);
      }

      const response = await fetch("/api/models/update", {
        method: "POST",
        headers: { "x-wallet-address": user?.wallet_address || "" },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update model");
      }

      const result = await response.json();
      toast.success("Model updated successfully");
      closeEditModal();
      fetchModels();
    } catch (error) {
      console.error("Error updating model:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update model"
      );
    } finally {
      setEditLoading(false);
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
            Model Management
          </h1>
          <p className="text-secondary-600">Upload and manage ML models</p>
        </div>
        <button
          onClick={handleUploadClick}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Upload Model</span>
        </button>
      </div>

      {/* Models List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-foreground">All Models</h2>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-secondary-600 mt-2">Loading models...</p>
            </div>
          ) : models.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-600">No models uploaded yet</p>
              <button onClick={handleUploadClick} className="btn-primary mt-4">
                Upload Your First Model
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto table-container">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">Name</th>
                    <th className="text-left py-3 px-4 font-medium">Version</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Owner</th>
                    <th className="text-left py-3 px-4 font-medium">Created</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => (
                    <tr
                      key={model.id}
                      className="border-b border-border hover:bg-secondary-50"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{model.name}</p>
                          <p className="text-sm text-secondary-600">
                            {model.description}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-secondary-100 text-secondary-700 px-2 py-1 rounded text-sm">
                          v{model.version}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            model.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {model.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-mono">
                          {model.owner_wallet.slice(0, 6)}...
                          {model.owner_wallet.slice(-4)}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-secondary-600">
                          {new Date(model.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(model)}
                            className="px-3 py-1 rounded text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 flex items-center"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 mr-1" /> Edit
                          </button>
                          <button
                            onClick={() =>
                              toggleModelStatus(model.id, model.is_active)
                            }
                            className={`px-3 py-1 rounded text-sm ${
                              model.is_active
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                          >
                            {model.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => confirmDeleteModel(model)}
                            className="px-3 py-1 rounded text-sm bg-red-100 text-red-700 hover:bg-red-200 flex items-center"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModel && (
        <div className="modal-overlay flex items-start justify-center p-2 sm:p-4 pt-20">
          <div className="glass rounded-2xl shadow-2xl border border-border w-full max-w-lg sm:max-w-xl md:max-w-2xl modal-content">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex-shrink-0 p-4 sm:p-6 border-b border-white/10">
                <button
                  onClick={closeEditModal}
                  className="absolute top-3 right-3 text-xl text-secondary-400 hover:text-white focus:outline-none"
                  title="Close"
                >
                  &times;
                </button>
                <h2 className="text-xl sm:text-2xl font-bold gradient-text pr-8">
                  Edit Model
                </h2>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0">
                <form
                  className="space-y-6"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveEdit();
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Model Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Owner Wallet Address
                      </label>
                      <input
                        type="text"
                        name="owner_wallet"
                        value={editForm.owner_wallet}
                        onChange={handleEditChange}
                        className="input-field"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={editForm.description}
                      onChange={handleEditChange}
                      className="input-field min-h-[100px]"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="use_manual_features"
                      name="use_manual_features"
                      checked={editForm.use_manual_features}
                      onChange={handleEditChange}
                      className="w-4 h-4 text-primary-500 bg-card border-border rounded focus:ring-primary-400"
                    />
                    <label
                      htmlFor="use_manual_features"
                      className="text-sm font-medium text-white"
                    >
                      Use Manual Features (users upload JSON files)
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Model File Upload */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Model File (.pkl)
                      </label>
                      <div
                        {...getEditModelRootProps()}
                        className={`border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center transition-all duration-300 ${
                          isEditModelDragActive
                            ? "border-primary-500 bg-primary-500/10"
                            : "border-border hover:border-primary-400"
                        }`}
                      >
                        <input {...getEditModelInputProps()} />
                        <Upload className="w-10 h-10 mx-auto mb-2 text-secondary-400" />
                        {editModelFile ? (
                          <div>
                            <p className="text-white font-medium">
                              {editModelFile.name}
                            </p>
                            <p className="text-sm text-secondary-400">
                              Size:{" "}
                              {(editModelFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-white font-medium">
                              {isEditModelDragActive
                                ? "Drop the model file here"
                                : "Drag & drop model file here or click to select"}
                            </p>
                            <p className="text-xs text-secondary-500 mt-2">
                              Maximum size: 50MB
                            </p>
                            <p className="text-xs text-secondary-500 mt-1">
                              Current:{" "}
                              {editModel?.model_path
                                ? editModel.model_path.split("/").pop()
                                : "None"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Features File Upload (if manual features enabled) */}
                    {editForm.use_manual_features && (
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Features Template File (.json)
                        </label>
                        <div
                          {...getEditFeaturesRootProps()}
                          className={`border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center transition-all duration-300 ${
                            isEditFeaturesDragActive
                              ? "border-primary-500 bg-primary-500/10"
                              : "border-border hover:border-primary-400"
                          }`}
                        >
                          <input {...getEditFeaturesInputProps()} />
                          <Upload className="w-10 h-10 mx-auto mb-2 text-secondary-400" />
                          {editFeaturesFile ? (
                            <div>
                              <p className="text-white font-medium">
                                {editFeaturesFile.name}
                              </p>
                              <p className="text-sm text-secondary-400">
                                Size:{" "}
                                {(editFeaturesFile.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-white font-medium">
                                {isEditFeaturesDragActive
                                  ? "Drop the features file here"
                                  : "Drag & drop features file here or click to select"}
                              </p>
                              <p className="text-xs text-secondary-500 mt-2">
                                Maximum size: 1MB
                              </p>
                              <p className="text-xs text-secondary-500 mt-1">
                                Current:{" "}
                                {editModel?.features_path
                                  ? editModel.features_path.split("/").pop()
                                  : "None"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* EDA File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      EDA Report File (.pdf){" "}
                      <span className="text-secondary-400">(Optional)</span>
                    </label>
                    <div
                      {...getEditEdaRootProps()}
                      className={`border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center transition-all duration-300 ${
                        isEditEdaDragActive
                          ? "border-primary-500 bg-primary-500/10"
                          : "border-border hover:border-primary-400"
                      }`}
                    >
                      <input {...getEditEdaInputProps()} />
                      <Upload className="w-10 h-10 mx-auto mb-2 text-secondary-400" />
                      {editEdaFile ? (
                        <div>
                          <p className="text-white font-medium">
                            {editEdaFile.name}
                          </p>
                          <p className="text-sm text-secondary-400">
                            Size: {(editEdaFile.size / 1024 / 1024).toFixed(2)}{" "}
                            MB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-white font-medium">
                            {isEditEdaDragActive
                              ? "Drop the EDA file here"
                              : "Drag & drop EDA file here or click to select"}
                          </p>
                          <p className="text-xs text-secondary-500 mt-2">
                            Maximum size: 10MB
                          </p>
                          <p className="text-xs text-secondary-500 mt-1">
                            Current:{" "}
                            {editModel?.eda_path
                              ? editModel.eda_path.split("/").pop()
                              : "None"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 mt-6">
                    <button
                      type="button"
                      onClick={closeEditModal}
                      className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                      disabled={editLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                      disabled={editLoading}
                    >
                      {editLoading ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay flex items-start justify-center pt-20">
          <div className="glass rounded-2xl shadow-2xl border border-border w-full max-w-md px-2 sm:px-4 py-6 sm:py-8 modal-content">
            <button
              onClick={closeDeleteModal}
              className="absolute top-3 right-3 text-xl text-secondary-400 hover:text-white focus:outline-none"
              title="Close"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-red-600 flex items-center">
              <Trash2 className="w-6 h-6 mr-2" /> Delete Model
            </h2>
            <p className="mb-6 text-secondary-200">
              Are you sure you want to delete the model{" "}
              <span className="font-semibold text-white">
                {deleteTarget.name}
              </span>{" "}
              and all its associated files? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={deleteModel}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold"
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
