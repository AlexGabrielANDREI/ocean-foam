"use client";

import { useAuth } from "@/contexts/AuthContext";
import { TrendingUp, BarChart3, PieChart, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardContent() {
  const { user } = useAuth();

  const categories = [
    {
      name: "Prediction",
      description: "Make AI-powered predictions with your connected wallet",
      icon: TrendingUp,
      href: "/prediction",
      available: true,
      color: "bg-primary-500",
    },
    {
      name: "Analytics",
      description: "Advanced analytics and insights (Coming Soon)",
      icon: BarChart3,
      href: "/analytics",
      available: false,
      color: "bg-secondary-500",
    },
    {
      name: "Portfolio",
      description: "Manage your prediction portfolio (Coming Soon)",
      icon: PieChart,
      href: "/portfolio",
      available: false,
      color: "bg-green-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card">
        <div className="card-body">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Welcome back!
          </h1>
          <p className="text-secondary-600">
            Ready to make some predictions? Choose a category below to get
            started.
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div
            key={category.name}
            className="card hover:shadow-md transition-shadow"
          >
            <div className="card-body">
              <div className="flex items-center space-x-3 mb-4">
                <div
                  className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center`}
                >
                  <category.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {category.name}
                  </h3>
                  {!category.available && (
                    <span className="text-xs bg-secondary-100 text-secondary-600 px-2 py-1 rounded">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>

              <p className="text-secondary-600 mb-4">{category.description}</p>

              {category.available ? (
                <Link
                  href={category.href}
                  className="btn-primary inline-flex items-center space-x-2"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  disabled
                  className="btn-secondary inline-flex items-center space-x-2 opacity-50 cursor-not-allowed"
                >
                  <span>Coming Soon</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">
                  Total Predictions
                </p>
                <p className="text-2xl font-bold text-foreground">0</p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">
                  Success Rate
                </p>
                <p className="text-2xl font-bold text-foreground">--</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-secondary-600">
                  Active Models
                </p>
                <p className="text-2xl font-bold text-foreground">0</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <PieChart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
