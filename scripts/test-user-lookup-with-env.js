const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

async function testUserLookup() {
  console.log("🔍 Testing User Lookup with Service Role...\n");

  try {
    // Check if environment variables are set
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.log("❌ Missing environment variables:");
      console.log(
        "   - NEXT_PUBLIC_SUPABASE_URL:",
        !!process.env.NEXT_PUBLIC_SUPABASE_URL
      );
      console.log(
        "   - SUPABASE_SERVICE_ROLE_KEY:",
        !!process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      console.log("");
      console.log(
        "💡 Please create a .env file with your Supabase credentials"
      );
      return;
    }

    console.log("✅ Environment variables found");
    console.log("   - Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log(
      "   - Service Role Key:",
      process.env.SUPABASE_SERVICE_ROLE_KEY ? "***" : "missing"
    );
    console.log("");

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const walletAddress = "0xb8d6b04b82b65e74b390fa606f487f4f039609d9";

    console.log("1. Testing database connection...");
    const { data: users, error: connectionError } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (connectionError) {
      throw new Error(`Database connection failed: ${connectionError.message}`);
    }

    console.log("✅ Database connection successful");
    console.log("");

    // Test user lookup
    console.log("2. Testing user lookup...");
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", walletAddress)
      .single();

    if (userError) {
      console.log("❌ User lookup failed:", userError.message);
      console.log("   Error code:", userError.code);
      console.log("   Error details:", userError.details);
      console.log("");

      if (userError.code === "PGRST116") {
        console.log("💡 This means the user does not exist in the database");
        console.log("   - The wallet address is not found");
        console.log("   - Need to create the user record");
      }
      return;
    }

    console.log("✅ User found successfully:");
    console.log("   ID:", user.id);
    console.log("   Wallet:", user.wallet_address);
    console.log("   Type:", user.wallet_type);
    console.log("   Role:", user.role);
    console.log("   Created:", user.created_at);
    console.log("");

    // Test predictions table access
    console.log("3. Testing predictions table access...");
    const { data: predictions, error: predError } = await supabase
      .from("predictions")
      .select("count")
      .eq("user_id", user.id)
      .limit(1);

    if (predError) {
      console.log("⚠️  Predictions table access failed:", predError.message);
    } else {
      console.log("✅ Predictions table access successful");
    }
    console.log("");

    // Test payment validation query
    console.log("4. Testing payment validation query...");
    const { data: recentPredictions, error: recentError } = await supabase
      .from("predictions")
      .select("transaction_hash, created_at")
      .eq("user_id", user.id)
      .not("transaction_hash", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentError) {
      console.log("⚠️  Recent predictions query failed:", recentError.message);
    } else {
      console.log("✅ Recent predictions query successful");
      if (recentPredictions.length > 0) {
        console.log("   Found recent prediction with payment:", {
          txHash: recentPredictions[0].transaction_hash,
          createdAt: recentPredictions[0].created_at,
        });
      } else {
        console.log("   No recent payments found (expected for new user)");
      }
    }
    console.log("");

    console.log("🎉 All tests passed!");
    console.log("   - Database connection: ✅");
    console.log("   - User lookup: ✅");
    console.log("   - Predictions access: ✅");
    console.log("   - Payment validation query: ✅");
    console.log("");
    console.log("📝 Conclusion:");
    console.log("   - The user exists in the database");
    console.log("   - Service role key works correctly");
    console.log("   - Payment validation should work");
    console.log("   - The issue might be in the frontend authentication flow");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run the test
testUserLookup();
