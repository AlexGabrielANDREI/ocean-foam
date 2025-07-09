"use client";

import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "./Sidebar";
import TopNavigation from "./TopNavigation";
import DashboardContent from "./DashboardContent";

export default function Dashboard() {
  const { user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <TopNavigation />
        <main className="p-6">
          <DashboardContent />
        </main>
      </div>
    </div>
  );
}
