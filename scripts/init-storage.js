const { createClient } = require("@supabase/supabase-js");
const path = require("path");

// Try to load environment variables from multiple possible locations
try {
  require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
} catch (error) {
  console.log("Could not load .env.local, trying .env...");
  try {
    require("dotenv").config({ path: path.join(__dirname, "../.env") });
  } catch (error2) {
    console.log("Could not load .env file");
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables");
  console.error("Please make sure you have:");
  console.error("- NEXT_PUBLIC_SUPABASE_URL");
  console.error("- NEXT_PUBLIC_SUPABASE_ANON_KEY");
  console.error(
    "\nCreate a .env.local file in the root directory with your Supabase credentials."
  );
  process.exit(1);
}

// Use service role key for bucket creation (bypasses RLS)
const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey
);

const STORAGE_BUCKETS = {
  MODELS: "ml-models",
  FEATURES: "features-uploads",
  TEMP: "temp-files",
};

async function initializeStorageBuckets() {
  console.log("Initializing Supabase Storage buckets...");

  try {
    // Create models bucket
    console.log("Creating models bucket...");
    const { data: modelsBucket, error: modelsError } =
      await supabase.storage.createBucket(STORAGE_BUCKETS.MODELS, {
        public: false,
        fileSizeLimit: 52428800, // 50MB limit for model files
        allowedMimeTypes: ["application/octet-stream", "application/x-pickle"],
      });

    if (modelsError) {
      if (modelsError.message.includes("already exists")) {
        console.log("✓ Models bucket already exists");
      } else if (modelsError.message.includes("row-level security policy")) {
        console.error(
          "❌ RLS Policy Error: Need service role key for bucket creation"
        );
        console.error(
          "   Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file"
        );
      } else {
        console.error("Models bucket error:", modelsError);
      }
    } else {
      console.log("✓ Models bucket created successfully");
    }

    // Create features bucket
    console.log("Creating features bucket...");
    const { data: featuresBucket, error: featuresError } =
      await supabase.storage.createBucket(STORAGE_BUCKETS.FEATURES, {
        public: false,
        fileSizeLimit: 1048576, // 1MB limit for feature files
        allowedMimeTypes: ["application/json"],
      });

    if (featuresError) {
      if (featuresError.message.includes("already exists")) {
        console.log("✓ Features bucket already exists");
      } else if (featuresError.message.includes("row-level security policy")) {
        console.error(
          "❌ RLS Policy Error: Need service role key for bucket creation"
        );
        console.error(
          "   Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file"
        );
      } else {
        console.error("Features bucket error:", featuresError);
      }
    } else {
      console.log("✓ Features bucket created successfully");
    }

    // Create temp bucket
    console.log("Creating temp bucket...");
    const { data: tempBucket, error: tempError } =
      await supabase.storage.createBucket(STORAGE_BUCKETS.TEMP, {
        public: false,
        fileSizeLimit: 1048576, // 1MB limit
        allowedMimeTypes: ["application/json", "application/octet-stream"],
      });

    if (tempError) {
      if (tempError.message.includes("already exists")) {
        console.log("✓ Temp bucket already exists");
      } else if (tempError.message.includes("row-level security policy")) {
        console.error(
          "❌ RLS Policy Error: Need service role key for bucket creation"
        );
        console.error(
          "   Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file"
        );
      } else {
        console.error("Temp bucket error:", tempError);
      }
    } else {
      console.log("✓ Temp bucket created successfully");
    }

    console.log("\n✅ Storage buckets initialization completed!");
    console.log("\nBucket names:");
    console.log(`- ${STORAGE_BUCKETS.MODELS} (for .pkl model files)`);
    console.log(`- ${STORAGE_BUCKETS.FEATURES} (for feature JSON files)`);
    console.log(`- ${STORAGE_BUCKETS.TEMP} (for temporary files)`);
  } catch (error) {
    console.error("Error initializing storage buckets:", error);
    process.exit(1);
  }
}

// Run the initialization
initializeStorageBuckets();
