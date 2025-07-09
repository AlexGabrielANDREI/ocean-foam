"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Database, Upload, Plus, Settings, Trash2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

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
};

export default function AdminModelsPage() {
  const { user, isAdmin } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchModels();
    }
  }, [isAdmin]);

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from("models")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error("Error fetching models:", error);
      toast.error("Failed to fetch models");
    } finally {
      setLoading(false);
    }
  };

  const toggleModelStatus = async (modelId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
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

  const deleteModel = async (modelId: string) => {
    if (!confirm("Are you sure you want to delete this model?")) return;

    try {
      const { error } = await supabase
        .from("models")
        .delete()
        .eq("id", modelId);

      if (error) throw error;

      toast.success("Model deleted successfully");
      fetchModels();
    } catch (error) {
      console.error("Error deleting model:", error);
      toast.error("Failed to delete model");
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
        <Link
          href="/admin/models/upload"
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Upload Model</span>
        </Link>
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
              <Link
                href="/admin/models/upload"
                className="btn-primary mt-4 inline-block"
              >
                Upload Your First Model
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                            onClick={() =>
                              toggleModelStatus(model.id, model.is_active)
                            }
                            className="p-1 text-secondary-600 hover:text-secondary-900"
                            title={model.is_active ? "Deactivate" : "Activate"}
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteModel(model.id)}
                            className="p-1 text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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
    </div>
  );
}
