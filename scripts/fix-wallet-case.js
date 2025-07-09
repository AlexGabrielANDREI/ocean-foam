const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixWalletCase() {
  console.log("🔧 Fixing Wallet Address Case Sensitivity");
  console.log("=".repeat(50));

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

    // Step 2: Check current model
    console.log("\n2️⃣ Checking current model...");
    const modelId = "2d79613d-3fd0-4286-a8f7-141d4770367d";
    const { data: model, error: modelError } = await supabase
      .from("models")
      .select("*")
      .eq("id", modelId)
      .single();

    if (modelError) {
      console.log("❌ Error fetching model:", modelError.message);
      return;
    }

    console.log("📋 Current model:");
    console.log(`   ID: ${model.id}`);
    console.log(`   Name: ${model.name}`);
    console.log(`   Owner Wallet: ${model.owner_wallet}`);
    console.log(`   Is Active: ${model.is_active}`);

    // Step 3: Check if wallet needs fixing
    const currentWallet = model.owner_wallet;
    const normalizedWallet = currentWallet.toLowerCase();

    if (currentWallet === normalizedWallet) {
      console.log("✅ Wallet address is already normalized");
    } else {
      console.log("🔧 Fixing wallet address case...");
      console.log(`   From: ${currentWallet}`);
      console.log(`   To: ${normalizedWallet}`);

      // Update the model with normalized wallet
      const { error: updateError } = await supabase
        .from("models")
        .update({ owner_wallet: normalizedWallet })
        .eq("id", modelId);

      if (updateError) {
        console.log("❌ Error updating wallet:", updateError.message);
        return;
      }

      console.log("✅ Wallet address updated successfully");
    }

    // Step 4: Test activation query
    console.log("\n3️⃣ Testing activation query...");
    const adminWallet = "0xb8d6b04b82b65e74b390fa606f487f4f039609d9";
    const { data: activationTest, error: activationError } = await supabase
      .from("models")
      .select("*")
      .eq("id", modelId)
      .eq("owner_wallet", adminWallet)
      .single();

    if (activationError) {
      console.log("❌ Activation query failed:", activationError.message);
    } else if (!activationTest) {
      console.log("❌ Activation query returned no results");
    } else {
      console.log("✅ Activation query successful!");
      console.log(`   Model ID: ${activationTest.id}`);
      console.log(`   Owner Wallet: ${activationTest.owner_wallet}`);
      console.log(`   Is Active: ${activationTest.is_active}`);
    }

    console.log("\n🎉 Wallet case fix completed!");
    console.log("📝 Next steps:");
    console.log("1. Try activating the model again in the UI");
    console.log("2. The activation should now work correctly");
  } catch (error) {
    console.error("❌ Wallet case fix failed:", error);
  }
}

fixWalletCase();
