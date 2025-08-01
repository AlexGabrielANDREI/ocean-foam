import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "OceanFoam - AI Prediction Platform",
  description: "AI-powered prediction platform with Web3 integration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo_oceanfoam.png" type="image/png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "rgba(30, 41, 59, 0.95)", // dark background
                color: "#f8fafc", // light text
                border: "1px solid rgba(255, 255, 255, 0.1)", // subtle border
                boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
                fontWeight: 500,
                backdropFilter: "blur(10px)",
              },
            }}
          />
        </ErrorBoundary>
      </body>
    </html>
  );
}
