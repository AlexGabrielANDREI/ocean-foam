const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkModels() {
  console.log("🔍 Checking Models in Database");
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

    // Step 2: Check all models
    console.log("\n2️⃣ Checking all models...");
    const { data: models, error: modelsError } = await supabase
      .from("models")
      .select("*")
      .order("created_at", { ascending: false });

    if (modelsError) {
      console.log("❌ Error fetching models:", modelsError.message);
      return;
    }

    console.log(`📋 Found ${models.length} models in database:`);

    if (models.length === 0) {
      console.log("❌ No models found in database");
      console.log("📝 This means the upload failed to create the model record");
      return;
    }

    // Display each model
    models.forEach((model, index) => {
      console.log(`\n📦 Model ${index + 1}:`);
      console.log(`   ID: ${model.id}`);
      console.log(`   Name: ${model.name}`);
      console.log(`   Version: ${model.version}`);
      console.log(`   Owner Wallet: ${model.owner_wallet}`);
      console.log(`   Is Active: ${model.is_active}`);
      console.log(`   NFT ID: ${model.nft_id || "Not set"}`);
      console.log(`   Created: ${model.created_at}`);
      console.log(`   Features Path: ${model.features_path || "Not set"}`);
      console.log(
        `   Use Manual Features: ${model.use_manual_features || "Not set"}`
      );
      console.log(`   Activated At: ${model.activated_at || "Not set"}`);
    });

    // Step 3: Check specific model from logs
    const specificModelId = "2d79613d-3fd0-4286-a8f7-141d4770367d";
    console.log(`\n3️⃣ Checking specific model: ${specificModelId}`);

    const { data: specificModel, error: specificError } = await supabase
      .from("models")
      .select("*")
      .eq("id", specificModelId)
      .single();

    if (specificError) {
      console.log("❌ Error fetching specific model:", specificError.message);
    } else if (!specificModel) {
      console.log("❌ Specific model not found");
    } else {
      console.log("✅ Specific model found:");
      console.log(`   ID: ${specificModel.id}`);
      console.log(`   Name: ${specificModel.name}`);
      console.log(`   Owner Wallet: ${specificModel.owner_wallet}`);
      console.log(`   Is Active: ${specificModel.is_active}`);
    }

    // Step 4: Check admin user
    console.log("\n4️⃣ Checking admin user...");
    const adminWallet = "0xb8d6b04b82b65e74b390fa606f487f4f039609d9";
    const { data: adminUser, error: adminError } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", adminWallet)
      .single();

    if (adminError) {
      console.log("❌ Error fetching admin user:", adminError.message);
    } else if (!adminUser) {
      console.log("❌ Admin user not found");
    } else {
      console.log("✅ Admin user found:");
      console.log(`   Wallet: ${adminUser.wallet_address}`);
      console.log(`   Role: ${adminUser.role}`);
    }

    // Step 5: Test activation query
    if (specificModel && adminUser) {
      console.log("\n5️⃣ Testing activation query...");
      const { data: activationTest, error: activationError } = await supabase
        .from("models")
        .select("*")
        .eq("id", specificModelId)
        .eq("owner_wallet", adminWallet)
        .single();

      if (activationError) {
        console.log("❌ Activation query failed:", activationError.message);
      } else if (!activationTest) {
        console.log("❌ Activation query returned no results");
        console.log(
          "📝 This means the model exists but owner_wallet doesn't match"
        );
      } else {
        console.log("✅ Activation query successful");
      }
    }

    console.log("\n🎉 Model check completed!");
    console.log("\n📝 Next steps:");
    if (models.length > 0) {
      console.log("1. Try activating the model again");
      console.log("2. Check if the wallet address matches");
      console.log("3. Verify the model ID is correct");
    } else {
      console.log("1. Run the database migration to add missing columns");
      console.log("2. Try uploading the model again");
    }
  } catch (error) {
    console.error("❌ Model check failed:", error);
  }
}

checkModels();
