import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function generateModelHash(modelData: Buffer): string {
  // This is a placeholder - in production you'd use a proper hashing library
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(modelData).digest("hex");
}

export function generateVersionNumber(): number {
  return Math.floor(Date.now() / 1000);
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
