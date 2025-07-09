"use client";

import { useAuth } from "@/contexts/AuthContext";
import LoginScreen from "@/components/LoginScreen";
import Dashboard from "@/components/Dashboard";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Home() {
  const { wallet, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!wallet.connected) {
    return <LoginScreen />;
  }

  // Always render the Dashboard component, which will handle internal routing
  return <Dashboard />;
}
