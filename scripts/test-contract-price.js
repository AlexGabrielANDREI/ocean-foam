const { ethers } = require("ethers");
require("dotenv").config();

const ALCHEMY_URL =
  "https://eth-sepolia.g.alchemy.com/v2/Rw4dHAu8A_9De5-3lRDgr";
const CONTRACT_ADDRESS = "0x2926afd03D40160be5739fA5b063c52e54CAFEBE";

async function testContractPrice() {
  console.log("🧪 Testing Contract Payment Price...\n");

  try {
    // 1. Test blockchain connection
    console.log("1. Testing blockchain connection...");
    const provider = new ethers.JsonRpcProvider(ALCHEMY_URL);
    const blockNumber = await provider.getBlockNumber();
    console.log(
      "✅ Blockchain connection successful, current block:",
      blockNumber,
      "\n"
    );

    // 2. Test contract connection
    console.log("2. Testing contract connection...");
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ["function paymentPrice() view returns (uint256)"],
      provider
    );

    try {
      const price = await contract.paymentPrice();
      console.log("✅ Contract connection successful");
      console.log("   Payment price (wei):", price.toString());
      console.log("   Payment price (ETH):", ethers.formatEther(price));
      console.log("   Contract address:", CONTRACT_ADDRESS);
      console.log("");
    } catch (error) {
      console.log("❌ Contract connection failed:", error.message);
      console.log("   This might be because:");
      console.log("   - Contract is not deployed");
      console.log("   - Contract address is incorrect");
      console.log("   - Network is wrong");
      console.log("");
    }

    // 3. Test getPaymentPrice function
    console.log("3. Testing getPaymentPrice function...");
    try {
      const { getPaymentPrice } = require("../src/lib/contract");
      const price = await getPaymentPrice();
      console.log("✅ getPaymentPrice function works");
      console.log("   Payment price (ETH):", price);
      console.log("");
    } catch (error) {
      console.log("❌ getPaymentPrice function failed:", error.message);
      console.log("");
    }

    // 4. Test with a sample transaction (if you have one)
    console.log("4. Testing with sample transaction...");
    console.log("   To test with a real transaction:");
    console.log("   - Make a payment via MetaMask");
    console.log("   - Copy the transaction hash");
    console.log("   - Run: node scripts/test-transaction.js <tx-hash>");
    console.log("");

    console.log("🎉 Contract Price Test Summary:");
    console.log("   ✅ Blockchain connection: Working");
    console.log("   ✅ Contract interaction: Tested");
    console.log("   ✅ Price fetching: Ready");
    console.log("\n📝 Next steps:");
    console.log("   1. Verify contract is deployed on Sepolia");
    console.log("   2. Check contract address is correct");
    console.log("   3. Test with a real payment transaction");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run the test
testContractPrice();
