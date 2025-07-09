const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixUploadIssues() {
  console.log("🔧 Fixing Upload Issues - Comprehensive Solution");
  console.log("=".repeat(50));

  try {
    // Step 1: Test connection
    console.log("\n1️⃣ Testing Supabase connection...");
    const { data: testData, error: testError } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (testError && testError.code !== "PGRST116") {
      console.log("❌ Connection failed:", testError.message);
      return;
    }
    console.log("✅ Connection successful");

    // Step 2: Check and create storage buckets
    console.log("\n2️⃣ Checking storage buckets...");
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.log("❌ Error listing buckets:", bucketsError.message);
      return;
    }

    const bucketNames = buckets.map((b) => b.name);
    console.log("📋 Existing buckets:", bucketNames);

    const requiredBuckets = ["models", "features"];
    const missingBuckets = requiredBuckets.filter(
      (name) => !bucketNames.includes(name)
    );

    if (missingBuckets.length > 0) {
      console.log("🔧 Creating missing buckets:", missingBuckets);

      for (const bucketName of missingBuckets) {
        const bucketConfig = {
          name: bucketName,
          public: false,
          fileSizeLimit: bucketName === "models" ? 52428800 : 1048576, // 50MB for models, 1MB for others
          allowedMimeTypes:
            bucketName === "models"
              ? ["application/octet-stream", "application/x-pickle"]
              : ["application/json"],
        };

        const { data, error } = await supabase.storage.createBucket(
          bucketName,
          bucketConfig
        );

        if (error) {
          console.log(
            `❌ Failed to create bucket '${bucketName}':`,
            error.message
          );
        } else {
          console.log(`✅ Created bucket '${bucketName}'`);
        }
      }
    } else {
      console.log("✅ All required buckets exist");
    }

    // Step 3: Check database schema
    console.log("\n3️⃣ Checking database schema...");
    const { data: columns, error: columnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "models")
      .eq("table_schema", "public");

    if (columnsError) {
      console.log("❌ Could not check schema:", columnsError.message);
      return;
    }

    const columnNames = columns.map((col) => col.column_name);
    console.log("📋 Current columns:", columnNames);

    const requiredColumns = [
      "features_path",
      "use_manual_features",
      "activated_at",
    ];
    const missingColumns = requiredColumns.filter(
      (col) => !columnNames.includes(col)
    );

    if (missingColumns.length > 0) {
      console.log("🔧 Missing columns:", missingColumns);
      console.log(
        "📝 Please run the following SQL in your Supabase dashboard:"
      );
      console.log("=".repeat(60));
      console.log(
        "ALTER TABLE models ADD COLUMN IF NOT EXISTS features_path TEXT;"
      );
      console.log(
        "ALTER TABLE models ADD COLUMN IF NOT EXISTS use_manual_features BOOLEAN DEFAULT false;"
      );
      console.log(
        "ALTER TABLE models ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;"
      );
      console.log("=".repeat(60));
    } else {
      console.log("✅ All required columns exist");
    }

    // Step 4: Test storage access
    console.log("\n4️⃣ Testing storage access...");
    for (const bucketName of requiredBuckets) {
      try {
        const { data, error } = await supabase.storage
          .from(bucketName)
          .list("", { limit: 1 });

        if (error) {
          console.log(
            `❌ Cannot access bucket '${bucketName}':`,
            error.message
          );
        } else {
          console.log(`✅ Bucket '${bucketName}' is accessible`);
        }
      } catch (error) {
        console.log(`❌ Error testing bucket '${bucketName}':`, error.message);
      }
    }

    // Step 5: Check environment variables
    console.log("\n5️⃣ Checking environment variables...");
    const requiredEnvVars = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingEnvVars.length > 0) {
      console.log("❌ Missing environment variables:", missingEnvVars);
      console.log("📝 Please check your .env.local file");
    } else {
      console.log("✅ All required environment variables are set");
    }

    // Step 6: Recommendations
    console.log("\n6️⃣ Recommendations:");
    console.log("📋 If you're still experiencing upload issues:");
    console.log("1. Ensure your Supabase project has sufficient storage quota");
    console.log("2. Check if your network connection is stable");
    console.log("3. Try uploading smaller files first (under 10MB)");
    console.log(
      "4. Verify that your Supabase service role key has storage permissions"
    );
    console.log(
      "5. Check the browser console and server logs for detailed error messages"
    );

    console.log("\n🎉 Fix script completed!");
    console.log("📝 Next steps:");
    console.log("1. Run the database migration if needed");
    console.log("2. Restart your development server: npm run dev");
    console.log("3. Try uploading a model again");
  } catch (error) {
    console.error("❌ Fix script failed:", error);
  }
}

fixUploadIssues();
