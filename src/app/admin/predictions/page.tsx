"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { TrendingUp, User, Database, Calendar, BarChart3 } from "lucide-react";

type Prediction = {
  id: string;
  user_id: string;
  model_id: string;
  prediction_result: string;
  prediction_score: number;
  features_used: "manual" | "api";
  features_data: any;
  transaction_hash: string | null;
  created_at: string;
  user?: {
    wallet_address: string;
  };
  model?: {
    name: string;
  };
};

export default function AdminPredictionsPage() {
  const { user, isAdmin } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    manual: 0,
    api: 0,
    avgScore: 0,
  });

  useEffect(() => {
    if (isAdmin) {
      fetchPredictions();
    }
  }, [isAdmin]);

  const fetchPredictions = async () => {
    try {
      const { data, error } = await supabase
        .from("predictions")
        .select(
          `
          *,
          user:users(wallet_address),
          model:models(name)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const predictionsData = data || [];
      setPredictions(predictionsData);

      // Calculate stats
      const manualCount = predictionsData.filter(
        (p) => p.features_used === "manual"
      ).length;
      const apiCount = predictionsData.filter(
        (p) => p.features_used === "api"
      ).length;
      const avgScore =
        predictionsData.length > 0
          ? predictionsData.reduce((sum, p) => sum + p.prediction_score, 0) /
            predictionsData.length
          : 0;

      setStats({
        total: predictionsData.length,
        manual: manualCount,
        api: apiCount,
        avgScore: Math.round(avgScore * 100) / 100,
      });
    } catch (error) {
      console.error("Error fetching predictions:", error);
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

  const statCards = [
    {
      title: "Total Predictions",
      value: stats.total,
      icon: TrendingUp,
      color: "bg-blue-500",
    },
    {
      title: "Manual Features",
      value: stats.manual,
      icon: User,
      color: "bg-green-500",
    },
    {
      title: "API Features",
      value: stats.api,
      icon: Database,
      color: "bg-purple-500",
    },
    {
      title: "Avg Score",
      value: stats.avgScore,
      icon: BarChart3,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Prediction Analytics
        </h1>
        <p className="text-secondary-600">View all predictions and analytics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "..." : stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.color} text-white`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Predictions List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-foreground">
            All Predictions
          </h2>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-secondary-600 mt-2">Loading predictions...</p>
            </div>
          ) : predictions.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-600">No predictions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">User</th>
                    <th className="text-left py-3 px-4 font-medium">Model</th>
                    <th className="text-left py-3 px-4 font-medium">Result</th>
                    <th className="text-left py-3 px-4 font-medium">Score</th>
                    <th className="text-left py-3 px-4 font-medium">Method</th>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((prediction) => (
                    <tr
                      key={prediction.id}
                      className="border-b border-border hover:bg-secondary-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-secondary-100 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-secondary-600" />
                          </div>
                          <span className="text-sm font-mono">
                            {prediction.user?.wallet_address?.slice(0, 6)}...
                            {prediction.user?.wallet_address?.slice(-4)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium">
                          {prediction.model?.name || "Unknown Model"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">
                          {prediction.prediction_result}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            prediction.prediction_score > 0.7
                              ? "bg-green-100 text-green-700"
                              : prediction.prediction_score > 0.4
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {(prediction.prediction_score * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            prediction.features_used === "manual"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {prediction.features_used}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-secondary-500" />
                          <span className="text-sm text-secondary-600">
                            {new Date(
                              prediction.created_at
                            ).toLocaleDateString()}
                          </span>
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
