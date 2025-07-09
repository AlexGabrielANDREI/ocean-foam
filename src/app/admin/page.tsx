"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Users,
  Database,
  TrendingUp,
  Activity,
  Settings,
  Upload,
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalModels: 0,
    totalPredictions: 0,
    activeModels: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      // Fetch user count
      const { count: userCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true });

      // Fetch model count
      const { count: modelCount } = await supabase
        .from("models")
        .select("*", { count: "exact", head: true });

      // Fetch prediction count
      const { count: predictionCount } = await supabase
        .from("predictions")
        .select("*", { count: "exact", head: true });

      // Fetch active models count
      const { count: activeModelCount } = await supabase
        .from("models")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      setStats({
        totalUsers: userCount || 0,
        totalModels: modelCount || 0,
        totalPredictions: predictionCount || 0,
        activeModels: activeModelCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
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
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-blue-500",
      href: "/admin/users",
    },
    {
      title: "Total Models",
      value: stats.totalModels,
      icon: Database,
      color: "bg-green-500",
      href: "/admin/models",
    },
    {
      title: "Active Models",
      value: stats.activeModels,
      icon: Activity,
      color: "bg-purple-500",
      href: "/admin/models",
    },
    {
      title: "Total Predictions",
      value: stats.totalPredictions,
      icon: TrendingUp,
      color: "bg-orange-500",
      href: "/admin/predictions",
    },
  ];

  const quickActions = [
    {
      title: "Upload Model",
      description: "Add a new ML model to the platform",
      icon: Upload,
      href: "/admin/models",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Manage Users",
      description: "View and manage user accounts",
      icon: Users,
      href: "/admin/users",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "System Settings",
      description: "Configure platform settings",
      icon: Settings,
      href: "/admin/settings",
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-secondary-600">
          Welcome back, {user?.wallet_address?.slice(0, 6)}...
          {user?.wallet_address?.slice(-4)}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Link key={index} href={stat.href} className="block">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-secondary-600">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {loading ? "..." : stat.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color} text-white`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-foreground">
            Quick Actions
          </h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href} className="block">
                <div className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${action.color} text-white`}
                    >
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {action.title}
                      </h3>
                      <p className="text-sm text-secondary-600">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Activity
          </h2>
        </div>
        <div className="card-body">
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
            <p className="text-secondary-600">No recent activity to display</p>
            <p className="text-sm text-secondary-500 mt-1">
              Activity tracking coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
