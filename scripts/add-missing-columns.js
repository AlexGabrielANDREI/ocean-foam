const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addMissingColumns() {
  console.log("🔧 Adding Missing Database Columns");
  console.log("=".repeat(40));

  try {
    // Step 1: Test connection
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

    // Step 2: Try to add the missing columns
    console.log("\n2️⃣ Adding missing columns...");

    const columnsToAdd = [
      {
        name: "features_path",
        type: "TEXT",
        nullable: true,
        default: null,
      },
      {
        name: "use_manual_features",
        type: "BOOLEAN",
        nullable: false,
        default: false,
      },
      {
        name: "activated_at",
        type: "TIMESTAMP WITH TIME ZONE",
        nullable: true,
        default: null,
      },
    ];

    for (const column of columnsToAdd) {
      console.log(`🔧 Adding column: ${column.name}`);

      try {
        // Try to insert a test record to see if column exists
        const { error: testInsertError } = await supabase
          .from("models")
          .insert({
            name: "test_column_check",
            description: "Temporary test record",
            version: 1,
            model_hash: "test_hash_" + Date.now(),
            model_path: "test/path.pkl",
            owner_wallet: "0x0000000000000000000000000000000000000000",
            is_active: false,
            [column.name]: column.default,
          });

        if (testInsertError && testInsertError.code === "PGRST204") {
          console.log(`❌ Column '${column.name}' does not exist`);
          console.log(`📝 Please run this SQL in your Supabase dashboard:`);
          console.log(
            `   ALTER TABLE models ADD COLUMN ${column.name} ${column.type}${
              column.nullable ? "" : " NOT NULL"
            }${column.default !== null ? ` DEFAULT ${column.default}` : ""};`
          );
        } else if (testInsertError) {
          console.log(
            `⚠️  Error testing column '${column.name}':`,
            testInsertError.message
          );
        } else {
          console.log(`✅ Column '${column.name}' exists`);
          // Clean up test record
          await supabase
            .from("models")
            .delete()
            .eq("name", "test_column_check");
        }
      } catch (error) {
        console.log(`❌ Error testing column '${column.name}':`, error.message);
      }
    }

    console.log("\n📝 Manual SQL Commands:");
    console.log("=".repeat(60));
    console.log("-- Run these commands in your Supabase SQL Editor:");
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

    console.log("\n🎉 Column check completed!");
    console.log("📝 Next steps:");
    console.log("1. Run the SQL commands above in your Supabase dashboard");
    console.log("2. Restart your development server: npm run dev");
    console.log("3. Try uploading a model again");
  } catch (error) {
    console.error("❌ Column check failed:", error);
  }
}

addMissingColumns();
