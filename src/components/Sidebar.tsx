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
    <aside className="w-80 h-full flex flex-col glass border-r border-white/10 shadow-sm">
      {/* Header */}
      <div className="p-4 sm:p-8 border-b border-white/10 flex-shrink-0">
        <div className="flex flex-col items-center">
          <div className="w-24 sm:w-40 flex items-center justify-center">
            <Image
              src="/logo_oceanfoam.png"
              alt="OceanFoam Logo"
              width={120}
              height={120}
              className="w-16 h-16 sm:w-24 sm:h-24"
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <nav className="p-2 sm:p-4 space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.name}
              onClick={() => handleItemClick(item)}
              className={`w-full text-left flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-200 ${
                item.active
                  ? "bg-gradient-to-r from-teal-500 to-blue-500 text-white border border-teal-400/30 glow-primary"
                  : "text-slate-200 hover:bg-white/5 hover:text-white"
              } ${item.comingSoon ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={item.comingSoon}
            >
              <item.icon className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4 flex-shrink-0" />
              <span className="text-base sm:text-lg">{item.name}</span>
              {item.comingSoon && (
                <span className="ml-auto text-xs bg-teal-400 text-white px-2 sm:px-3 py-1 rounded-full font-semibold">
                  Soon
                </span>
              )}
            </button>
          ))}
        </nav>

        {isAdmin && (
          <>
            <div className="px-3 sm:px-4 py-2">
              <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                Admin Panel
              </h3>
            </div>
            <nav className="px-3 sm:px-4 space-y-2">
              {adminItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleItemClick(item)}
                  className={`w-full text-left flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-200 ${
                    item.active
                      ? "bg-gradient-to-r from-teal-500 to-blue-500 text-white border border-teal-400/30 glow-primary"
                      : "text-slate-200 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4 flex-shrink-0" />
                  <span className="text-base sm:text-lg">{item.name}</span>
                </button>
              ))}
            </nav>
          </>
        )}
      </div>
    </aside>
  );
}
