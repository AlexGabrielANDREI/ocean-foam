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
      console.log("[DEBUG] Starting wallet connection check...");

      try {
        // Check if we're in the browser environment
        if (typeof window === "undefined") {
          console.log(
            "[DEBUG] Not in browser environment, setting loading to false"
          );
          setLoading(false);
          return;
        }

        console.log("[DEBUG] Checking for existing wallet connection...");

        // Check if we have a stored wallet address
        const storedWalletAddress = localStorage.getItem("wallet_address");

        if (storedWalletAddress) {
          console.log(
            "[DEBUG] Found stored wallet address:",
            storedWalletAddress
          );

          // Check if MetaMask is connected and the address matches
          if (window.ethereum) {
            try {
              const accounts = await window.ethereum.request({
                method: "eth_accounts",
              });
              if (
                accounts.length > 0 &&
                accounts[0].toLowerCase() === storedWalletAddress.toLowerCase()
              ) {
                console.log(
                  "[DEBUG] MetaMask is connected with matching address"
                );

                // Fetch user data from our users table with timeout
                const userPromise = supabase
                  .from("users")
                  .select("*")
                  .eq("wallet_address", storedWalletAddress)
                  .single();

                const timeoutPromise = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error("Supabase timeout")), 3000)
                );

                const { data: userData, error: userError } =
                  (await Promise.race([userPromise, timeoutPromise])) as any;

                if (userData) {
                  console.log("[DEBUG] Found user in database:", userData.id);
                  setUser(userData);
                  setIsAdmin(userData.role === "admin");
                  setWallet({
                    address: userData.wallet_address,
                    type: userData.wallet_type,
                    connected: true,
                  });
                } else {
                  console.log(
                    "[DEBUG] User not found in database for stored wallet"
                  );
                  // Clear invalid stored wallet
                  localStorage.removeItem("wallet_address");
                  setUser(null);
                  setWallet({
                    address: "",
                    type: "metamask",
                    connected: false,
                  });
                }
              } else {
                console.log(
                  "[DEBUG] MetaMask connected but address doesn't match stored address"
                );
                // Clear stored wallet as it's no longer valid
                localStorage.removeItem("wallet_address");
                setUser(null);
                setWallet({
                  address: "",
                  type: "metamask",
                  connected: false,
                });
              }
            } catch (error) {
              console.log("[DEBUG] Error checking MetaMask connection:", error);
              // Clear stored wallet on error
              localStorage.removeItem("wallet_address");
              setUser(null);
              setWallet({
                address: "",
                type: "metamask",
                connected: false,
              });
            }
          } else {
            console.log("[DEBUG] MetaMask not available");
            // Clear stored wallet if MetaMask is not available
            localStorage.removeItem("wallet_address");
            setUser(null);
            setWallet({
              address: "",
              type: "metamask",
              connected: false,
            });
          }
        } else {
          console.log("[DEBUG] No stored wallet address found");
          setUser(null);
          setWallet({
            address: "",
            type: "metamask",
            connected: false,
          });
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
        setUser(null);
        setWallet({
          address: "",
          type: "metamask",
          connected: false,
        });
      } finally {
        console.log("[DEBUG] Setting loading to false");
        setLoading(false);
      }
    };

    console.log("[DEBUG] Calling checkWalletConnection");
    checkWalletConnection();

    // Fallback timeout to ensure loading doesn't get stuck
    const timeoutId = setTimeout(() => {
      console.log("[DEBUG] Fallback timeout reached, setting loading to false");
      setLoading(false);
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeoutId);
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

      console.log("[DEBUG] Wallet connected:", walletConnection.address);

      // Store wallet address in localStorage for persistence
      localStorage.setItem("wallet_address", walletConnection.address);

      // Create or get user in Supabase with wallet headers
      const supabaseWithWallet = getSupabaseClient(walletConnection.address);
      const { data: existingUser, error: existingError } =
        await supabaseWithWallet
          .from("users")
          .select("*")
          .eq("wallet_address", walletConnection.address)
          .single();

      if (existingUser) {
        console.log("[DEBUG] Found existing user:", existingUser.id);
        setUser(existingUser);
        setIsAdmin(existingUser.role === "admin");
        toast.success("Wallet connected successfully!");
      } else {
        console.log(
          "[DEBUG] Creating new user for wallet:",
          walletConnection.address
        );
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
          console.error("[DEBUG] Error creating user:", error);
          throw error;
        }

        console.log("[DEBUG] New user created:", newUser.id);
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
    console.log("[DEBUG] Disconnecting wallet");
    localStorage.removeItem("wallet_address");
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
        loading: loading,
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
