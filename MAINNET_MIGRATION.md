# Ethereum Mainnet Migration Guide

This document outlines the changes made to migrate from Sepolia testnet to Ethereum mainnet and the steps you need to take to complete the setup.

## Changes Made

### 1. Configuration Files Updated

#### `env.example`

- ✅ Updated `NEXT_PUBLIC_ALCHEMY_URL` to use mainnet endpoint placeholder
- ✅ Updated `NEXT_PUBLIC_CONTRACT_ADDRESS` to placeholder
- ✅ Added comments indicating Ethereum Mainnet configuration

#### `setup-env.js`

- ✅ Updated default contract address to placeholder

### 2. Source Code Updated

#### `src/lib/contract.ts`

- ✅ Updated `NEXT_PUBLIC_ALCHEMY_URL` default to mainnet endpoint
- ✅ Updated `CONTRACT_ADDRESS` default to placeholder
- ✅ Added TODO comments for replacement

#### `src/lib/payment-validation.ts`

- ✅ Updated `NEXT_PUBLIC_ALCHEMY_URL` default to mainnet endpoint
- ✅ Updated `CONTRACT_ADDRESS` default to placeholder
- ✅ Updated block time comments to reference "Ethereum mainnet"
- ✅ Added TODO comments for replacement

#### `src/lib/wallet.ts`

- ✅ Added `ensureMainnet()` function to validate network
- ✅ Added `getCurrentNetwork()` function to get network info
- ✅ Includes network validation with clear error messages

### 3. Documentation Updated

#### `README.md`

- ✅ Updated to reference Ethereum Mainnet
- ✅ Added mainnet ETH requirement to prerequisites
- ✅ Updated environment configuration examples
- ✅ Added warning about real ETH spending

---

## Next Steps - Action Required

### Step 1: Get Alchemy Mainnet API Key

1. Go to [Alchemy](https://www.alchemy.com/)
2. Sign in and create a new app
3. Select **Ethereum** and **Mainnet**
4. Copy your API key

### Step 2: Deploy Smart Contract to Mainnet

⚠️ **CRITICAL**: Before deploying to mainnet:

- Audit your smart contract code
- Test extensively on testnet
- Consider having a professional audit
- Understand that mainnet transactions cost real money

1. Deploy your contract to Ethereum Mainnet
2. Save the deployed contract address
3. Verify the contract on Etherscan

### Step 3: Update Environment Variables

Update your `.env.local` file with real mainnet credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Ethereum Mainnet Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=<YOUR_DEPLOYED_CONTRACT_ADDRESS>
NEXT_PUBLIC_ALCHEMY_URL=https://eth-mainnet.g.alchemy.com/v2/<YOUR_ALCHEMY_API_KEY>

# Application Configuration
NEXT_PUBLIC_APP_NAME=Prediction Dashboard
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Update for production

# Payment Configuration
PAYMENT_VALIDITY_HOURS=0.0167
EDA_PAYMENT_VALIDITY_HOURS=0.0833
```

### Step 4: Update Placeholder Values in Code (Optional)

If you want fallback defaults (not recommended for production), update:

1. `src/lib/contract.ts` lines 6 and 9
2. `src/lib/payment-validation.ts` lines 8 and 11

Replace:

- `YOUR_MAINNET_CONTRACT_ADDRESS_HERE`
- `YOUR_MAINNET_ALCHEMY_API_KEY_HERE`

**Best Practice**: Keep these as placeholders and rely on environment variables.

### Step 5: Test Thoroughly

Before going live:

1. **Local Testing**

   ```bash
   npm run dev
   ```

   - Test wallet connection
   - Verify network validation works
   - Test with small amounts of ETH

2. **Network Validation**

   - The app will now check if users are on Ethereum Mainnet
   - If not, users will see an error message
   - Test by switching to a testnet and attempting to connect

3. **Transaction Testing**
   - Test payment flow with minimal ETH
   - Verify transaction confirmation
   - Check payment validation logic

### Step 6: Monitor Gas Costs

Mainnet transactions cost real ETH:

- Monitor gas prices
- Consider implementing gas estimation
- Warn users about transaction costs

---

## New Features Added

### Network Validation

The app now includes automatic network validation:

```typescript
// Use in components where you need to ensure mainnet
import { ensureMainnet, getCurrentNetwork } from "@/lib/wallet";

// Check if on mainnet
await ensureMainnet(); // Throws error if not on mainnet

// Get current network info
const network = await getCurrentNetwork();
console.log(network.isMainnet); // boolean
console.log(network.chainId); // bigint
console.log(network.name); // string
```

### Error Handling

If a user is not on mainnet, they'll see:

```
Please switch to Ethereum Mainnet. Current network: Sepolia (chainId: 11155111)
```

---

## Security Considerations

### Before Going Live

1. **Smart Contract Security**

   - [ ] Code audit completed
   - [ ] Test coverage > 90%
   - [ ] Security vulnerabilities addressed
   - [ ] Contract verified on Etherscan

2. **Frontend Security**

   - [ ] API keys stored in environment variables
   - [ ] No sensitive data in client-side code
   - [ ] Rate limiting implemented
   - [ ] Error messages don't leak sensitive info

3. **User Safety**
   - [ ] Clear warnings about real ETH spending
   - [ ] Transaction confirmation UI
   - [ ] Gas estimation displayed
   - [ ] Maximum payment limits implemented

### Recommended Additional Features

1. **Gas Price Warning**

   ```typescript
   // Display current gas price to users before transaction
   const gasPrice = await provider.getFeeData();
   ```

2. **Transaction History**

   - Show users their past transactions
   - Link to Etherscan for verification

3. **Emergency Pause**
   - Implement contract pause functionality
   - Add admin controls for emergency stops

---

## Rollback Plan

If you need to switch back to Sepolia testnet:

1. Update environment variables:

   ```env
   NEXT_PUBLIC_ALCHEMY_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   NEXT_PUBLIC_CONTRACT_ADDRESS=YOUR_SEPOLIA_CONTRACT_ADDRESS
   ```

2. Modify `src/lib/wallet.ts` `ensureMainnet()` function:
   ```typescript
   // Change chainId check from 1 (mainnet) to 11155111 (sepolia)
   if (network.chainId !== 11155111n) {
     throw new Error("Please switch to Sepolia testnet");
   }
   ```

---

## Support and Resources

- [Ethereum Mainnet Documentation](https://ethereum.org/en/developers/docs/)
- [Alchemy Documentation](https://docs.alchemy.com/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Gas Price Tracker](https://etherscan.io/gastracker)

---

## Checklist

- [ ] Alchemy mainnet API key obtained
- [ ] Smart contract deployed to mainnet
- [ ] Contract verified on Etherscan
- [ ] Environment variables updated
- [ ] Local testing completed
- [ ] Network validation tested
- [ ] Transaction flow tested with real ETH
- [ ] Gas costs reviewed
- [ ] User warnings added
- [ ] Error handling tested
- [ ] Documentation updated
- [ ] Monitoring/logging set up

---

**Last Updated**: $(date)
**Migration Status**: Configuration Complete - Awaiting Credentials
