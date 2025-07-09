const { createClient } = require("@supabase/supabase-js");
const path = require("path");

// Try to load environment variables
try {
  require("dotenv").config({ path: path.join(__dirname, "../.env.local") });
} catch (error) {
  console.log("Could not load .env.local, trying .env...");
  try {
    require("dotenv").config({ path: path.join(__dirname, "../.env") });
  } catch (error2) {
    console.log("Could not load .env file");
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("🔍 Testing Supabase Connection...");
console.log(
  "URL:",
  supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "❌ Not set"
);
console.log(
  "Key:",
  supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "❌ Not set"
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("\n❌ Missing environment variables!");
  console.error("Please check your .env.local file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log("\n🔄 Testing connection...");

    // Test basic connection
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (error) {
      if (error.code === "PGRST116") {
        console.log(
          "✅ Connection successful! (Table doesn't exist yet, which is expected)"
        );
        console.log("📝 You can now run: npm run init-storage");
      } else {
        console.error("❌ Connection failed:", error.message);
      }
    } else {
      console.log("✅ Connection successful!");
      console.log("📝 You can now run: npm run init-storage");
    }
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    console.error("\nPossible issues:");
    console.error("1. Invalid Supabase URL");
    console.error("2. Invalid API key");
    console.error("3. Project doesn't exist");
    console.error("4. Network connectivity issues");
  }
}

testConnection();
