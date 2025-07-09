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
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const { user, isAdmin, disconnect } = useAuth();
  const pathname = usePathname();

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: Home,
      active: pathname === "/",
    },
    {
      name: "Prediction",
      href: "/prediction",
      icon: TrendingUp,
      active: pathname === "/prediction",
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      active: pathname === "/analytics",
      comingSoon: true,
    },
    {
      name: "Portfolio",
      href: "/portfolio",
      icon: BarChart3,
      active: pathname === "/portfolio",
      comingSoon: true,
    },
  ];

  const adminItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: Settings,
      active: pathname === "/admin",
    },
    {
      name: "Models",
      href: "/admin/models",
      icon: Database,
      active: pathname === "/admin/models",
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
      active: pathname === "/admin/users",
    },
    {
      name: "Predictions",
      href: "/admin/predictions",
      icon: TrendingUp,
      active: pathname === "/admin/predictions",
    },
  ];

  return (
    <aside className="sidebar">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Prediction</h1>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`nav-item ${item.active ? "active" : ""} ${
              item.comingSoon ? "opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={(e) => {
              if (item.comingSoon) {
                e.preventDefault();
              }
            }}
          >
            <item.icon className="w-5 h-5 mr-3" />
            <span>{item.name}</span>
            {item.comingSoon && (
              <span className="ml-auto text-xs bg-secondary-100 text-secondary-600 px-2 py-1 rounded">
                Soon
              </span>
            )}
          </Link>
        ))}
      </nav>

      {isAdmin && (
        <>
          <div className="px-4 py-2">
            <h3 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">
              Admin
            </h3>
          </div>
          <nav className="px-4 space-y-2">
            {adminItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-item ${item.active ? "active" : ""}`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-secondary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.wallet_address
                ? formatAddress(user.wallet_address)
                : "User"}
            </p>
            <p className="text-xs text-secondary-500 capitalize">
              {user?.role || "consumer"}
            </p>
          </div>
        </div>
        <button
          onClick={disconnect}
          className="w-full nav-item text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Disconnect</span>
        </button>
      </div>
    </aside>
  );
}
