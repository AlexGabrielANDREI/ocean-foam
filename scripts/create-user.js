const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUser() {
  console.log("🔧 Creating User Record...\n");

  try {
    // The wallet address from the error logs
    const walletAddress = "0xb8d6b04b82b65e74b390fa606f487f4f039609d9";

    console.log("Wallet address:", walletAddress);
    console.log("");

    // Check if user already exists
    console.log("1. Checking if user already exists...");
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", walletAddress)
      .single();

    if (existingUser) {
      console.log("✅ User already exists:");
      console.log("   ID:", existingUser.id);
      console.log("   Wallet:", existingUser.wallet_address);
      console.log("   Type:", existingUser.wallet_type);
      console.log("   Role:", existingUser.role);
      console.log("   Created:", existingUser.created_at);
      return;
    }

    if (checkError && checkError.code !== "PGRST116") {
      throw new Error(`Error checking user: ${checkError.message}`);
    }

    console.log("❌ User not found, creating new user...");
    console.log("");

    // Create new user
    console.log("2. Creating new user...");
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert({
        wallet_address: walletAddress,
        wallet_type: "metamask",
        role: "consumer",
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Error creating user: ${createError.message}`);
    }

    console.log("✅ User created successfully:");
    console.log("   ID:", newUser.id);
    console.log("   Wallet:", newUser.wallet_address);
    console.log("   Type:", newUser.wallet_type);
    console.log("   Role:", newUser.role);
    console.log("   Created:", newUser.created_at);
    console.log("");

    // Test the user lookup
    console.log("3. Testing user lookup...");
    const { data: testUser, error: testError } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", walletAddress)
      .single();

    if (testError) {
      throw new Error(`Error testing user lookup: ${testError.message}`);
    }

    console.log("✅ User lookup successful:");
    console.log("   Found user:", testUser.id);
    console.log("");

    // Test payment validation query
    console.log("4. Testing payment validation query...");
    const { data: predictions, error: predError } = await supabase
      .from("predictions")
      .select("transaction_hash, created_at")
      .eq("user_id", testUser.id)
      .not("transaction_hash", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (predError) {
      console.log(
        "⚠️  Predictions query failed (expected if no data):",
        predError.message
      );
    } else {
      console.log("✅ Predictions query successful");
      if (predictions.length > 0) {
        console.log("   Found recent prediction with payment:", {
          txHash: predictions[0].transaction_hash,
          createdAt: predictions[0].created_at,
        });
      } else {
        console.log("   No recent payments found (expected for new user)");
      }
    }
    console.log("");

    console.log("🎉 User creation and testing completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("   1. Refresh the application");
    console.log("   2. Try making a payment");
    console.log("   3. Check if payment validation works");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Run the script
createUser();
