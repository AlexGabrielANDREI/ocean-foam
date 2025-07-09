"use client";

import { useAuth } from "@/contexts/AuthContext";

export default function AdminUsersPage() {
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
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-secondary-600">
          Manage user accounts and permissions
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-foreground">All Users</h2>
        </div>
        <div className="card-body">
          <p className="text-secondary-600">
            User management functionality coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
