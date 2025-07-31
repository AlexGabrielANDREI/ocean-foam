"use client";

import { useAuth } from "@/contexts/AuthContext";
import LoginScreen from "@/components/LoginScreen";
import Dashboard from "@/components/Dashboard";
import LoadingSpinner from "@/components/LoadingSpinner";
import ClientOnly from "@/components/ClientOnly";

export default function Home() {
  return (
    <ClientOnly fallback={<LoadingSpinner />}>
      <HomeContent />
    </ClientOnly>
  );
}

function HomeContent() {
  const { wallet, loading } = useAuth();

  // Show loading spinner while checking wallet connection
  if (loading) {
    return <LoadingSpinner />;
  }

  // Show login screen if wallet is not connected
  if (!wallet.connected) {
    return <LoginScreen />;
  }

  // Show dashboard if wallet is connected
  return <Dashboard />;
}
