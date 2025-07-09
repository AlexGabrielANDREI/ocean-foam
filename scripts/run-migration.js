const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log("🔍 Running database migration...");

    // Read the migration SQL file
    const migrationPath = path.join(
      __dirname,
      "../database/add-features-columns.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("📝 Migration SQL:");
    console.log(migrationSQL);

    // Execute the migration
    console.log("\n🔄 Executing migration...");
    const { data, error } = await supabase.rpc("exec_sql", {
      sql: migrationSQL,
    });

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log("⚠️  exec_sql not available, trying alternative approach...");

      // Split the SQL into individual statements and execute them
      const statements = migrationSQL
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        try {
          // For ALTER TABLE statements, we'll need to handle them differently
          if (statement.includes("ALTER TABLE")) {
            console.log(
              "⚠️  ALTER TABLE statements need to be run manually in Supabase dashboard"
            );
            console.log(`Statement: ${statement}`);
          }
        } catch (stmtError) {
          console.log(`⚠️  Statement failed: ${stmtError.message}`);
        }
      }
    } else {
      console.log("✅ Migration executed successfully");
    }

    // Verify the migration by checking if columns exist
    console.log("\n🔍 Verifying migration...");
    const { data: columns, error: columnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_name", "models")
      .eq("table_schema", "public");

    if (columnsError) {
      console.log("⚠️  Could not verify columns:", columnsError.message);
    } else {
      const columnNames = columns.map((col) => col.column_name);
      console.log("📋 Current columns in models table:", columnNames);

      const requiredColumns = [
        "features_path",
        "use_manual_features",
        "activated_at",
      ];
      const missingColumns = requiredColumns.filter(
        (col) => !columnNames.includes(col)
      );

      if (missingColumns.length === 0) {
        console.log("✅ All required columns are present!");
      } else {
        console.log("❌ Missing columns:", missingColumns);
        console.log(
          "Please run the ALTER TABLE statements manually in Supabase dashboard:"
        );
        console.log(
          "ALTER TABLE models ADD COLUMN IF NOT EXISTS features_path TEXT;"
        );
        console.log(
          "ALTER TABLE models ADD COLUMN IF NOT EXISTS use_manual_features BOOLEAN DEFAULT false;"
        );
        console.log(
          "ALTER TABLE models ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;"
        );
      }
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    console.log("\n📝 Manual migration steps:");
    console.log("1. Go to your Supabase dashboard");
    console.log("2. Navigate to the SQL Editor");
    console.log("3. Run the following SQL statements:");
    console.log(
      "   ALTER TABLE models ADD COLUMN IF NOT EXISTS features_path TEXT;"
    );
    console.log(
      "   ALTER TABLE models ADD COLUMN IF NOT EXISTS use_manual_features BOOLEAN DEFAULT false;"
    );
    console.log(
      "   ALTER TABLE models ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;"
    );
  }
}

runMigration();
