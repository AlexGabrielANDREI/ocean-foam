const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabase() {
  console.log("🔍 Checking Database Schema...");
  console.log("=".repeat(40));

  try {
    // Test basic connection
    console.log("1️⃣ Testing connection...");
    const { data: testData, error: testError } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (testError && testError.code !== "PGRST116") {
      console.log("❌ Connection failed:", testError.message);
      return;
    }
    console.log("✅ Connection successful");

    // Try to query models table structure
    console.log("\n2️⃣ Checking models table...");
    const { data: models, error: modelsError } = await supabase
      .from("models")
      .select("*")
      .limit(1);

    if (modelsError) {
      console.log("❌ Models table error:", modelsError.message);
      console.log(
        "📝 This might indicate missing columns or table doesn't exist"
      );
    } else {
      console.log("✅ Models table accessible");
      if (models && models.length > 0) {
        const columns = Object.keys(models[0]);
        console.log("📋 Current columns:", columns);

        const requiredColumns = [
          "features_path",
          "use_manual_features",
          "activated_at",
        ];
        const missingColumns = requiredColumns.filter(
          (col) => !columns.includes(col)
        );

        if (missingColumns.length > 0) {
          console.log("❌ Missing columns:", missingColumns);
          console.log(
            "\n📝 Please run these SQL statements in your Supabase dashboard:"
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
      } else {
        console.log(
          "📝 Models table is empty (this is normal for new projects)"
        );
      }
    }

    // Test storage access
    console.log("\n3️⃣ Testing storage access...");
    const buckets = ["models", "features"];

    for (const bucketName of buckets) {
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

    console.log("\n🎉 Database check completed!");
    console.log("\n📝 Next steps:");
    console.log(
      "1. If missing columns were found, run the SQL statements above"
    );
    console.log("2. Restart your development server: npm run dev");
    console.log("3. Try uploading a model again");
  } catch (error) {
    console.error("❌ Database check failed:", error);
  }
}

checkDatabase();
