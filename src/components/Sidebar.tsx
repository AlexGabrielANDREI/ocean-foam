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
    <aside className="w-80 h-full flex flex-col glass border-r border-border">
      {/* Header */}
      <div className="p-6 border-b border-border flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center glow-primary">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold gradient-text">Prediction</h1>
            <p className="text-xs text-secondary-400">AI Platform</p>
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
              className={`nav-item w-full text-left ${
                item.active ? "active" : ""
              } ${item.comingSoon ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={item.comingSoon}
            >
              <item.icon className="w-6 h-6 mr-4" />
              <span className="text-lg">{item.name}</span>
              {item.comingSoon && (
                <span className="ml-auto text-xs bg-accent-yellow text-black px-3 py-1 rounded-full font-semibold">
                  Soon
                </span>
              )}
            </button>
          ))}
        </nav>

        {isAdmin && (
          <>
            <div className="px-4 py-2">
              <h3 className="text-xs font-bold text-accent-green uppercase tracking-wider">
                Admin Panel
              </h3>
            </div>
            <nav className="px-4 space-y-2">
              {adminItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleItemClick(item)}
                  className={`nav-item w-full text-left ${
                    item.active ? "active" : ""
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
