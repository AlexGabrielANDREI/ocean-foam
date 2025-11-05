"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopNavigation, { TopNavigationRef } from "./TopNavigation";
import DashboardContent from "./DashboardContent";
import AdminDashboard from "./AdminDashboard";
import PredictionPage from "./PredictionPage";
import AdminModelsPage from "./AdminModelsPage";
import AdminUsersPage from "./AdminUsersPage";
import AdminPredictionsPage from "./AdminPredictionsPage";
import ModelUploadPage from "./ModelUploadPage";

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const pathname = usePathname();
  const [currentRoute, setCurrentRoute] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const topNavigationRef = useRef<TopNavigationRef>(null);

  // Update current route when pathname changes
  useEffect(() => {
    if (pathname === "/") {
      setCurrentRoute("dashboard");
    } else if (pathname === "/prediction") {
      setCurrentRoute("prediction");
    } else if (pathname === "/admin") {
      setCurrentRoute("admin");
    } else if (pathname === "/admin/models") {
      setCurrentRoute("admin-models");
    } else if (pathname === "/admin/users") {
      setCurrentRoute("admin-users");
    } else if (pathname === "/admin/predictions") {
      setCurrentRoute("admin-predictions");
    } else if (pathname === "/admin/models/upload") {
      setCurrentRoute("admin-upload");
    } else {
      setCurrentRoute("dashboard");
    }
  }, [pathname]);

  // Handle route changes - update URL without full navigation
  const handleRouteChange = (route: string) => {
    setCurrentRoute(route);

    // Close sidebar on mobile when route changes
    setSidebarOpen(false);

    // Update the URL without triggering a page reload
    const newPath = (() => {
      switch (route) {
        case "dashboard":
          return "/";
        case "prediction":
          return "/prediction";
        case "admin":
          return "/admin";
        case "admin-models":
          return "/admin/models";
        case "admin-users":
          return "/admin/users";
        case "admin-predictions":
          return "/admin/predictions";
        case "admin-upload":
          return "/admin/models/upload";
        default:
          return "/";
      }
    })();

    // Update URL without page reload
    window.history.pushState({}, "", newPath);
  };

  // Render the appropriate component based on current route
  const renderContent = () => {
    switch (currentRoute) {
      case "dashboard":
        return <DashboardContent onRouteChange={handleRouteChange} />;
      case "prediction":
        return (
          <PredictionPage
            onRefreshPaymentStatus={() =>
              topNavigationRef.current?.refreshPaymentStatus()
            }
            onRefreshEdaPaymentStatus={() =>
              topNavigationRef.current?.refreshEdaPaymentStatus()
            }
          />
        );
      case "admin":
        return <AdminDashboard />;
      case "admin-models":
        return <AdminModelsPage onRouteChange={handleRouteChange} />;
      case "admin-users":
        return <AdminUsersPage />;
      case "admin-predictions":
        return <AdminPredictionsPage />;
      case "admin-upload":
        return <ModelUploadPage />;
      default:
        return <DashboardContent onRouteChange={handleRouteChange} />;
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden bg-slate-950">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, visible on lg+ */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <Sidebar
          currentRoute={currentRoute}
          onRouteChange={handleRouteChange}
        />
      </div>

      <div className="flex-1 flex flex-col min-h-0 bg-slate-950 overflow-hidden">
        <TopNavigation
          ref={topNavigationRef}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-auto bg-slate-950">
          <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 glass">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
