const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function initStorage() {
  try {
    console.log("🔍 Initializing Supabase storage buckets...");

    // Define required buckets
    const buckets = [
      {
        name: "models",
        public: false,
        allowedMimeTypes: ["application/octet-stream", "application/x-pickle"],
      },
      {
        name: "features",
        public: false,
        allowedMimeTypes: ["application/json"],
      },
      {
        name: "temp",
        public: false,
        allowedMimeTypes: ["*/*"],
      },
    ];

    for (const bucket of buckets) {
      console.log(`🔧 Creating bucket: ${bucket.name}`);

      try {
        // Check if bucket exists
        const { data: existingBuckets, error: listError } =
          await supabase.storage.listBuckets();

        if (listError) {
          console.log(`❌ Error listing buckets:`, listError);
          continue;
        }

        const bucketExists = existingBuckets.some(
          (b) => b.name === bucket.name
        );

        if (bucketExists) {
          console.log(`✅ Bucket '${bucket.name}' already exists`);
        } else {
          // Create bucket
          const { data, error } = await supabase.storage.createBucket(
            bucket.name,
            {
              public: bucket.public,
              allowedMimeTypes: bucket.allowedMimeTypes,
              fileSizeLimit: bucket.name === "models" ? 52428800 : 1048576, // 50MB for models, 1MB for others
            }
          );

          if (error) {
            console.log(`❌ Error creating bucket '${bucket.name}':`, error);
          } else {
            console.log(`✅ Bucket '${bucket.name}' created successfully`);
          }
        }
      } catch (error) {
        console.log(`❌ Unexpected error with bucket '${bucket.name}':`, error);
      }
    }

    // Test bucket access
    console.log("\n🔍 Testing bucket access...");

    for (const bucket of buckets) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket.name)
          .list("", { limit: 1 });

        if (error) {
          console.log(`❌ Cannot access bucket '${bucket.name}':`, error);
        } else {
          console.log(`✅ Bucket '${bucket.name}' is accessible`);
        }
      } catch (error) {
        console.log(`❌ Error testing bucket '${bucket.name}':`, error);
      }
    }

    console.log("\n🎉 Storage initialization complete!");
  } catch (error) {
    console.error("❌ Storage initialization failed:", error);
  }
}

initStorage();
