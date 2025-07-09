# 🚀 Production Setup Guide

This guide will help you implement production-ready Row Level Security (RLS) policies for wallet-based authentication.

## 📋 Prerequisites

- Supabase project with database tables created
- Environment variables configured
- Application running locally

## 🔐 Step 1: Implement Production RLS Policies

### 1.1 Run the Production RLS Script

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run the production RLS policies script:**

```sql
-- Copy and paste the entire content from database/production-rls-policies.sql
```

This script will:

- ✅ Enable RLS on all tables
- ✅ Create helper functions for wallet authentication
- ✅ Implement secure policies for users, models, and predictions
- ✅ Allow proper access control based on wallet addresses

### 1.2 Verify Policies

After running the script, verify the policies are active:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'models', 'predictions');

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

## 🔧 Step 2: Test the Implementation

### 2.1 Test Wallet Connection

1. **Start your application**: `npm run dev`
2. **Connect MetaMask wallet**
3. **Verify user creation works**
4. **Check admin access (if applicable)**

### 2.2 Test API Endpoints

Test the prediction API with wallet headers:

```bash
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -H "x-wallet-address: YOUR_WALLET_ADDRESS" \
  -d '{
    "model_id": "mock-model-id",
    "features_used": "api",
    "transaction_hash": "0x123..."
  }'
```

## 🛡️ Security Features Implemented

### User Table Policies

- **SELECT**: Users can view their own data, admins can view all
- **INSERT**: Allow new user registration with wallet address
- **UPDATE**: Users can update their own data, admins can update any
- **DELETE**: Only admins can delete users

### Models Table Policies

- **SELECT**: Anyone can view active models, admins can view all
- **INSERT**: Only admins can create models
- **UPDATE**: Only admins can update models
- **DELETE**: Only admins can delete models

### Predictions Table Policies

- **SELECT**: Users can view their own predictions, admins can view all
- **INSERT**: Users can create predictions for themselves
- **UPDATE**: Only admins can update predictions
- **DELETE**: Only admins can delete predictions

## 🔍 How It Works

### 1. Wallet Header Authentication

```typescript
// Frontend sends wallet address in headers
headers: {
  "x-wallet-address": user.wallet_address
}

// Backend extracts and validates
const walletAddress = request.headers.get('x-wallet-address')
```

### 2. Database Functions

```sql
-- Get current wallet address from headers
get_current_wallet_address()

-- Check if user is admin
is_admin()
```

### 3. RLS Policy Example

```sql
-- Users can only see their own data
CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (
    wallet_address = get_current_wallet_address()
    OR is_admin()
  );
```

## 🚨 Important Security Notes

### 1. Header Validation

- Always validate wallet addresses on the backend
- Consider implementing signature verification
- Rate limit API requests

### 2. Admin Access

- Admin status is checked against the database
- Only wallet addresses with admin role have elevated privileges
- Consider implementing multi-signature for admin actions

### 3. Production Considerations

- Use HTTPS in production
- Implement proper CORS policies
- Add request logging and monitoring
- Consider using JWT tokens for session management

## 🔄 Migration from Development

If you previously disabled RLS for testing:

```sql
-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Then run the production policies script
```

## 🧪 Testing Checklist

- [ ] Wallet connection works
- [ ] User registration works
- [ ] Admin access works
- [ ] Users can only see their own data
- [ ] Admins can see all data
- [ ] API endpoints work with wallet headers
- [ ] Predictions are saved correctly
- [ ] Model management works for admins

## 🆘 Troubleshooting

### Common Issues

1. **"new row violates row-level security policy"**

   - Check if wallet address is being sent in headers
   - Verify the `get_current_wallet_address()` function works

2. **"function get_current_wallet_address() does not exist"**

   - Re-run the production RLS policies script
   - Check for SQL syntax errors

3. **"wallet address required"**
   - Ensure frontend is sending `x-wallet-address` header
   - Check network tab for missing headers

### Debug Queries

```sql
-- Check current wallet address function
SELECT get_current_wallet_address();

-- Check admin status
SELECT is_admin();

-- Test policy manually
SELECT * FROM users WHERE wallet_address = 'YOUR_WALLET_ADDRESS';
```

## 📞 Support

If you encounter issues:

1. Check the Supabase logs
2. Verify all SQL commands executed successfully
3. Test with a simple wallet connection first
4. Review the browser network tab for errors

The production RLS policies provide enterprise-grade security while maintaining the flexibility of wallet-based authentication! 🔒
