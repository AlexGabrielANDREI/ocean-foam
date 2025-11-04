const fs = require("fs");
const path = require("path");

const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Hedera Configuration (DISABLED - No longer using Hedera)
# NEXT_PUBLIC_HEDERA_NETWORK=testnet
# NEXT_PUBLIC_HEDERA_MIRROR_NODE=https://testnet.mirrornode.hedera.com

# Smart Contract Configuration (Ethereum Mainnet)
NEXT_PUBLIC_CONTRACT_ADDRESS=YOUR_MAINNET_CONTRACT_ADDRESS_HERE

# Application Configuration
NEXT_PUBLIC_APP_NAME=Prediction Dashboard
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Payment Gate (set to false to disable payment validation for testing)
# WARNING: Always set to true in production!
PAYMENT_GATE=true
`;

const envPath = path.join(__dirname, ".env.local");

try {
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Created .env.local file with default configuration");
    console.log("📝 Please update the environment variables as needed");
  } else {
    console.log("⚠️  .env.local file already exists");
    console.log("📝 Please check if the required variables are set correctly");
  }
} catch (error) {
  console.error("❌ Error creating .env.local file:", error.message);
}

console.log("\n🔧 Next steps:");
console.log("1. Update the Supabase URL and keys in .env.local");
console.log('2. Run "npm run dev" to start the development server');
console.log("3. Open http://localhost:3000 in your browser");
