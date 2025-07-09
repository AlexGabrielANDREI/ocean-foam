const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserStatus() {
  try {
    console.log("🔍 Checking database connection...");

    // Check if users table exists and has data
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .limit(5);

    if (usersError) {
      console.log("❌ Error accessing users table:", usersError);
      return;
    }

    console.log("✅ Users table accessible");
    console.log("📊 Total users found:", users?.length || 0);

    if (users && users.length > 0) {
      console.log("👥 Users in database:");
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. Wallet: ${user.wallet_address}`);
        console.log(`     Role: ${user.role}`);
        console.log(`     Wallet Type: ${user.wallet_type}`);
        console.log(`     Created: ${user.created_at}`);
        console.log("");
      });
    } else {
      console.log("⚠️  No users found in database");
      console.log("💡 You may need to create a user first");
    }

    // Check if models table exists
    const { data: models, error: modelsError } = await supabase
      .from("models")
      .select("*")
      .limit(5);

    if (modelsError) {
      console.log("❌ Error accessing models table:", modelsError);
    } else {
      console.log("✅ Models table accessible");
      console.log("📊 Total models found:", models?.length || 0);
    }
  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

checkUserStatus();
