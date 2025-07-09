"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Users, User, Shield, Wallet } from "lucide-react";
import toast from "react-hot-toast";

type User = {
  id: string;
  wallet_address: string;
  wallet_type: "metamask" | "hedera";
  role: "consumer" | "admin";
  created_at: string;
  updated_at: string;
};

export default function AdminUsersPage() {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    if (
      !confirm(
        `Are you sure you want to change this user's role to ${
          currentRole === "admin" ? "consumer" : "admin"
        }?`
      )
    )
      return;

    try {
      const newRole = currentRole === "admin" ? "consumer" : "admin";
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  const deleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    )
      return;

    try {
      const { error } = await supabase.from("users").delete().eq("id", userId);

      if (error) throw error;

      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

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

  const getWalletIcon = (walletType: string) => {
    return walletType === "metamask" ? (
      <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
        <span className="text-white text-xs font-bold">M</span>
      </div>
    ) : (
      <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center">
        <span className="text-white text-xs font-bold">H</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            User Management
          </h1>
          <p className="text-secondary-600">View and manage user accounts</p>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-secondary-600" />
          <span className="text-sm text-secondary-600">
            {users.length} total users
          </span>
        </div>
      </div>

      {/* Users List */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-foreground">All Users</h2>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-secondary-600 mt-2">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-600">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium">User</th>
                    <th className="text-left py-3 px-4 font-medium">Wallet</th>
                    <th className="text-left py-3 px-4 font-medium">Role</th>
                    <th className="text-left py-3 px-4 font-medium">Joined</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userItem) => (
                    <tr
                      key={userItem.id}
                      className="border-b border-border hover:bg-secondary-50"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-secondary-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {userItem.wallet_address.slice(0, 6)}...
                              {userItem.wallet_address.slice(-4)}
                            </p>
                            <p className="text-sm text-secondary-600">
                              ID: {userItem.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getWalletIcon(userItem.wallet_type)}
                          <span className="text-sm capitalize">
                            {userItem.wallet_type}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            userItem.role === "admin"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {userItem.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-secondary-600">
                          {new Date(userItem.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() =>
                              toggleUserRole(userItem.id, userItem.role)
                            }
                            className="p-1 text-secondary-600 hover:text-secondary-900"
                            title={`Change to ${
                              userItem.role === "admin" ? "consumer" : "admin"
                            }`}
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          {userItem.id !== user?.id && (
                            <button
                              onClick={() => deleteUser(userItem.id)}
                              className="p-1 text-red-600 hover:text-red-700"
                              title="Delete user"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
