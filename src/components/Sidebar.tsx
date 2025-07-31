"use client";

import { useAuth } from "@/contexts/AuthContext";
import { formatAddress } from "@/lib/utils";
import {
  Home,
  TrendingUp,
  BarChart3,
  Settings,
  Users,
  Database,
  LogOut,
  User,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

interface SidebarProps {
  currentRoute: string;
  onRouteChange: (route: string) => void;
}

export default function Sidebar({ currentRoute, onRouteChange }: SidebarProps) {
  const { user, isAdmin } = useAuth();

  const navigationItems = [
    {
      name: "Prediction",
      route: "prediction",
      icon: TrendingUp,
      active: currentRoute === "prediction",
      comingSoon: false,
    },
    {
      name: "Exploratory Data Analysis",
      route: "eda",
      icon: BarChart3,
      active: currentRoute === "eda",
      comingSoon: true,
    },
    {
      name: "AI Agents",
      route: "ai-agents",
      icon: User,
      active: currentRoute === "ai-agents",
      comingSoon: true,
    },
  ];

  const adminItems = [
    {
      name: "Statistics",
      route: "admin",
      icon: Settings,
      active: currentRoute === "admin",
    },
    {
      name: "Models",
      route: "admin-models",
      icon: Database,
      active: currentRoute === "admin-models",
    },
    {
      name: "Users",
      route: "admin-users",
      icon: Users,
      active: currentRoute === "admin-users",
    },
  ];

  const handleItemClick = (item: any) => {
    if (item.comingSoon) {
      return; // Don't navigate for coming soon items
    }
    onRouteChange(item.route);
  };

  return (
    <aside className="w-80 h-full flex flex-col bg-white border-r border-gray-200 shadow-sm">
      {/* Header */}
      <div className="p-8 border-b  flex-shrink-0">
        <div className="flex flex-col items-center">
          <div className="w-40 flex items-center justify-center">
            <Image
              src="/logo_oceanfoam.png"
              alt="OceanFoam Logo"
              width={120}
              height={120}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleItemClick(item)}
              className={`w-full text-left flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                item.active
                  ? "bg-teal-50 text-teal-700 border border-teal-200"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              } ${item.comingSoon ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={item.comingSoon}
            >
              <item.icon className="w-6 h-6 mr-4" />
              <span className="text-lg">{item.name}</span>
              {item.comingSoon && (
                <span className="ml-auto text-xs bg-teal-400 text-white px-3 py-1 rounded-full font-semibold">
                  Soon
                </span>
              )}
            </button>
          ))}
        </nav>

        {isAdmin && (
          <>
            <div className="px-4 py-2">
              <h3 className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                Admin Panel
              </h3>
            </div>
            <nav className="px-4 space-y-2">
              {adminItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleItemClick(item)}
                  className={`w-full text-left flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                    item.active
                      ? "bg-teal-50 text-teal-700 border border-teal-200"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="w-6 h-6 mr-4" />
                  <span className="text-lg">{item.name}</span>
                </button>
              ))}
            </nav>
          </>
        )}
      </div>
    </aside>
  );
}
