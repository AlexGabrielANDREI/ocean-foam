const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

async function checkModels() {
  console.log("🔍 Checking Active Models with Credentials...\n");

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
        "💡 Please create a .env.local file with your Supabase credentials"
      );
      console.log("   Example:");
      console.log("   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url");
      console.log("   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key");
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

    console.log("1. Testing database connection...");
    const { data: testData, error: testError } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (testError) {
      throw new Error(`Database connection failed: ${testError.message}`);
    }

    console.log("✅ Database connection successful");
    console.log("");

    // Check all models
    console.log("2. Checking all models...");
    const { data: allModels, error: allModelsError } = await supabase
      .from("models")
      .select("*")
      .order("created_at", { ascending: false });

    if (allModelsError) {
      throw new Error(`Error fetching all models: ${allModelsError.message}`);
    }

    console.log(`📋 Found ${allModels.length} total models in database:`);

    if (allModels.length === 0) {
      console.log("❌ No models found in database");
      console.log("💡 You need to upload a model via the admin panel first");
      return;
    }

    allModels.forEach((model, index) => {
      console.log(`\n📦 Model ${index + 1}:`);
      console.log(`   ID: ${model.id}`);
      console.log(`   Name: ${model.name}`);
      console.log(`   Version: ${model.version}`);
      console.log(`   Owner Wallet: ${model.owner_wallet}`);
      console.log(`   Is Active: ${model.is_active}`);
      console.log(`   Model Path: ${model.model_path}`);
      console.log(
        `   Use Manual Features: ${model.use_manual_features || "Not set"}`
      );
      console.log(`   Created: ${model.created_at}`);
    });

    // Check active models specifically
    console.log("\n3. Checking active models...");
    const { data: activeModels, error: activeError } = await supabase
      .from("models")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (activeError) {
      throw new Error(`Error fetching active models: ${activeError.message}`);
    }

    console.log(`📋 Found ${activeModels.length} active models:`);

    if (activeModels.length === 0) {
      console.log("❌ No active models found");
      console.log("💡 You need to activate a model first");
      console.log("   - Go to admin panel");
      console.log("   - Find a model and set is_active = true");
      return;
    }

    activeModels.forEach((model, index) => {
      console.log(`\n✅ Active Model ${index + 1}:`);
      console.log(`   ID: ${model.id}`);
      console.log(`   Name: ${model.name}`);
      console.log(`   Is Active: ${model.is_active}`);
      console.log(`   Model Path: ${model.model_path}`);
      console.log(
        `   Use Manual Features: ${model.use_manual_features || "Not set"}`
      );
    });

    // Test model file access
    if (activeModels.length > 0) {
      const testModel = activeModels[0];
      console.log(`\n4. Testing model file access for: ${testModel.name}`);

      try {
        const { data: fileData, error: fileError } = await supabase.storage
          .from("ml-models")
          .list(testModel.model_path.split("/")[0] || "");

        if (fileError) {
          console.log("⚠️  Model file access failed:", fileError.message);
        } else {
          console.log("✅ Model file access successful");
          console.log("   Files found:", fileData?.length || 0);
        }
      } catch (error) {
        console.log("⚠️  Model file access error:", error.message);
      }
    }

    console.log("\n🎉 Model check completed!");
    console.log("\n📝 Summary:");
    console.log(`   - Total models: ${allModels.length}`);
    console.log(`   - Active models: ${activeModels.length}`);

    if (activeModels.length > 0) {
      console.log("   - Prediction should work with active model");
    } else {
      console.log("   - Need to activate a model first");
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run the test
checkModels();
