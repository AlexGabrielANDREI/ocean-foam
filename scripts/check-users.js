const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  console.log("🔍 Checking Users in Database...\n");

  try {
    // Get all users
    console.log("1. Fetching all users...");
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }

    console.log(`✅ Found ${users.length} users in database:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}`);
      console.log(`   Wallet: ${user.wallet_address}`);
      console.log(`   Type: ${user.wallet_type}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.created_at}`);
      console.log("");
    });

    // Check for the specific wallet address that's failing
    const failingWallet = "0xb8d6b04b82b65e74b390fa606f487f4f039609d9";
    console.log(`2. Checking for wallet: ${failingWallet}`);

    const { data: specificUser, error: specificError } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", failingWallet)
      .single();

    if (specificUser) {
      console.log("✅ Found the failing wallet in database:");
      console.log("   ID:", specificUser.id);
      console.log("   Wallet:", specificUser.wallet_address);
      console.log("   Type:", specificUser.wallet_type);
      console.log("   Role:", specificUser.role);
      console.log("   Created:", specificUser.created_at);
    } else {
      console.log("❌ The failing wallet is NOT in the database");
      if (specificError) {
        console.log("   Error:", specificError.message);
      }
    }

    console.log("\n📝 Analysis:");
    console.log(
      "   - If the wallet exists: The issue is with authentication flow"
    );
    console.log("   - If the wallet doesn't exist: Need to create user record");
    console.log("   - The app should use MetaMask-only auth, not Google OAuth");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run the script
checkUsers();
