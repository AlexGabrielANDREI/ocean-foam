"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  WalletConnection,
  connectMetaMask,
  connectHedera,
  disconnectWallet,
} from "@/lib/wallet";
import { supabase, getSupabaseClient } from "@/lib/supabase";
import toast from "react-hot-toast";

interface AuthContextType {
  wallet: WalletConnection;
  user: any;
  loading: boolean;
  connectWallet: (type: "metamask" | "hedera") => Promise<void>;
  disconnect: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletConnection>({
    address: "",
    type: "metamask",
    connected: false,
  });
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        // Check if user has a stored session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch user data from our users table
          const { data: userData } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (userData) {
            setUser(userData);
            setIsAdmin(userData.role === "admin");
            setWallet({
              address: userData.wallet_address,
              type: userData.wallet_type,
              connected: true,
            });
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      } finally {
        setLoading(false);
      }
    };

    checkWalletConnection();
  }, []);

  const connectWallet = async (type: "metamask" | "hedera") => {
    try {
      setLoading(true);
      let walletConnection: WalletConnection;

      if (type === "metamask") {
        walletConnection = await connectMetaMask();
      } else {
        walletConnection = await connectHedera();
      }

      // Create or get user in Supabase with wallet headers
      const supabaseWithWallet = getSupabaseClient(walletConnection.address);
      const { data: existingUser } = await supabaseWithWallet
        .from("users")
        .select("*")
        .eq("wallet_address", walletConnection.address)
        .single();

      if (existingUser) {
        setUser(existingUser);
        setIsAdmin(existingUser.role === "admin");
        toast.success("Wallet connected successfully!");
      } else {
        // Create new user
        const { data: newUser, error } = await supabaseWithWallet
          .from("users")
          .insert({
            wallet_address: walletConnection.address,
            wallet_type: walletConnection.type,
            role: "consumer",
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        setUser(newUser);
        setIsAdmin(false);
        toast.success("New account created and wallet connected!");
      }

      setWallet(walletConnection);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setWallet(disconnectWallet());
    setUser(null);
    setIsAdmin(false);
    toast.success("Wallet disconnected");
  };

  return (
    <AuthContext.Provider
      value={{
        wallet,
        user,
        loading,
        connectWallet,
        disconnect,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
