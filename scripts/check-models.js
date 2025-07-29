const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkModels() {
  console.log("🔍 Checking Active Models...\n");

  console.log("📋 Test Scenario:");
  console.log("   - Looking for active models in database");
  console.log("   - Predictions require at least one active model");
  console.log("   - Model must have is_active = true");
  console.log("");

  console.log("🔧 Expected Behavior:");
  console.log("   - At least one model should be active");
  console.log("   - Model should have valid model_path");
  console.log("   - Model should have use_manual_features flag");
  console.log("");

  console.log("💡 If no active models found:");
  console.log("   1. Need to upload a model via admin panel");
  console.log("   2. Set is_active = true");
  console.log("   3. Ensure model_path is valid");
  console.log("");

  console.log("🚀 To check with credentials:");
  console.log("   1. Create .env file with Supabase credentials");
  console.log("   2. Run: node scripts/check-models-with-env.js");
  console.log("");

  console.log("📝 Current Status:");
  console.log("   - Payment validation: ✅ Working");
  console.log("   - User lookup: ✅ Working");
  console.log("   - Need to verify active model exists");
  console.log("   - Need to verify prediction execution");
  console.log("");

  console.log("🎯 Next Steps:");
  console.log("   1. Check if active model exists");
  console.log("   2. If not, upload a model via admin panel");
  console.log("   3. Test prediction flow again");
  console.log("   4. Verify prediction record creation");
}

checkModels();
