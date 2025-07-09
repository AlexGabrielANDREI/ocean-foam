"use client";

import { useAuth } from "@/contexts/AuthContext";
import LoginScreen from "@/components/LoginScreen";
import LoadingSpinner from "@/components/LoadingSpinner";
import Dashboard from "@/components/Dashboard";

export default function AdminPage() {
  const { wallet, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!wallet.connected) {
    return <LoginScreen />;
  }

  // Render the dashboard with admin route
  return <Dashboard />;
}
