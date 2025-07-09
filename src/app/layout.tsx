import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Prediction Dashboard",
  description: "AI-powered prediction platform with Web3 integration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#f8fafc", // light background
              color: "#1e293b", // dark text
              border: "1px solid #cbd5e1", // subtle border
              boxShadow: "0 4px 24px 0 rgba(30,41,59,0.10)",
              fontWeight: 500,
            },
          }}
        />
      </body>
    </html>
  );
}
