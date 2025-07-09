import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create a function to get Supabase client with wallet headers
export function getSupabaseClient(walletAddress?: string) {
  if (!walletAddress) {
    return supabase;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        "x-wallet-address": walletAddress,
      },
    },
  });
}

// Storage bucket names
export const STORAGE_BUCKETS = {
  MODELS: "ml-models",
  FEATURES: "features-uploads",
  TEMP: "temp-files",
} as const;

// Initialize storage buckets (run this once)
export async function initializeStorageBuckets() {
  try {
    // Create models bucket
    const { data: modelsBucket, error: modelsError } =
      await supabase.storage.createBucket(STORAGE_BUCKETS.MODELS, {
        public: false,
        fileSizeLimit: 52428800, // 50MB limit for model files
        allowedMimeTypes: ["application/octet-stream", "application/x-pickle"],
      });

    // Create features bucket
    const { data: featuresBucket, error: featuresError } =
      await supabase.storage.createBucket(STORAGE_BUCKETS.FEATURES, {
        public: false,
        fileSizeLimit: 1048576, // 1MB limit for feature files
        allowedMimeTypes: ["application/json"],
      });

    // Create temp bucket
    const { data: tempBucket, error: tempError } =
      await supabase.storage.createBucket(STORAGE_BUCKETS.TEMP, {
        public: false,
        fileSizeLimit: 1048576, // 1MB limit
        allowedMimeTypes: ["application/json", "application/octet-stream"],
      });

    if (modelsError) console.log("Models bucket error:", modelsError);
    if (featuresError) console.log("Features bucket error:", featuresError);
    if (tempError) console.log("Temp bucket error:", tempError);

    return { modelsBucket, featuresBucket, tempBucket };
  } catch (error) {
    console.error("Error initializing storage buckets:", error);
    return null;
  }
}

// Upload model file to storage
export async function uploadModelFile(
  file: File,
  modelId: string
): Promise<string | null> {
  try {
    const fileName = `${modelId}/${file.name}`;
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.MODELS)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading model file:", error);
      return null;
    }

    return fileName;
  } catch (error) {
    console.error("Error uploading model file:", error);
    return null;
  }
}

// Get model file URL
export function getModelFileUrl(filePath: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKETS.MODELS)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Download model file
export async function downloadModelFile(
  filePath: string
): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.MODELS)
      .download(filePath);

    if (error) {
      console.error("Error downloading model file:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error downloading model file:", error);
    return null;
  }
}

// Upload features file
export async function uploadFeaturesFile(
  file: File,
  userId: string
): Promise<string | null> {
  try {
    const fileName = `${userId}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.FEATURES)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading features file:", error);
      return null;
    }

    return fileName;
  } catch (error) {
    console.error("Error uploading features file:", error);
    return null;
  }
}

// Delete file from storage
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error("Error deleting file:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
}

// Generate model hash
export function generateModelHash(modelData: Buffer): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(modelData).digest("hex");
}

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          wallet_type: "metamask" | "hedera";
          role: "consumer" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          wallet_type: "metamask" | "hedera";
          role?: "consumer" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          wallet_type?: "metamask" | "hedera";
          role?: "consumer" | "admin";
          created_at?: string;
          updated_at?: string;
        };
      };
      models: {
        Row: {
          id: string;
          name: string;
          description: string;
          version: number;
          model_hash: string;
          model_path: string;
          owner_wallet: string;
          nft_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          version?: number;
          model_hash: string;
          model_path: string;
          owner_wallet: string;
          nft_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          version?: number;
          model_hash?: string;
          model_path?: string;
          owner_wallet?: string;
          nft_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      predictions: {
        Row: {
          id: string;
          user_id: string;
          model_id: string;
          prediction_result: string;
          prediction_score: number;
          features_used: "manual" | "api";
          features_data: any;
          transaction_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          model_id: string;
          prediction_result: string;
          prediction_score: number;
          features_used: "manual" | "api";
          features_data?: any;
          transaction_hash?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          model_id?: string;
          prediction_result?: string;
          prediction_score?: number;
          features_used?: "manual" | "api";
          features_data?: any;
          transaction_hash?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
