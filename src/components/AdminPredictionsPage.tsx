"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function AdminPredictionsPage() {
  const { isAdmin } = useAuth();

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
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Prediction Analytics
        </h1>
        <p className="text-secondary-600">View and analyze prediction data</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-foreground">
            All Predictions
          </h2>
        </div>
        <div className="card-body">
          <p className="text-secondary-600">
            Prediction analytics functionality coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
