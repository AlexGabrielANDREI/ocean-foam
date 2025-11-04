# Payment Gate Feature

## Overview

The `PAYMENT_GATE` environment variable allows you to bypass payment validation during development and testing, eliminating the need to make actual blockchain transactions.

## Configuration

### Development/Testing (No Payment Required)

In your `.env.local` file:

```env
PAYMENT_GATE=false
```

With this setting:

- ✅ Models can be run without payment
- ✅ No blockchain transactions needed
- ✅ No gas fees
- ✅ Faster testing workflow
- 💡 Perfect for local development and testing

### Production (Payment Required)

In your production environment variables (Vercel, etc.):

```env
PAYMENT_GATE=true
```

Or simply omit the variable entirely (defaults to `true`):

- ✅ Payment validation enforced
- ✅ Blockchain transactions required
- ✅ Secure monetization enabled

## How It Works

When `PAYMENT_GATE=false`:

1. The API routes (`/api/prediction`, `/api/predict`) skip the `verifyUserPayment()` call
2. Predictions are still logged to the database with `transaction_hash` set to `null` or the provided hash
3. All other functionality remains identical

When `PAYMENT_GATE=true` (or not set):

1. Normal payment validation occurs
2. Valid blockchain transaction required
3. Payment must be recent (within `PAYMENT_VALIDITY_HOURS`)

## Usage Example

### Local Development

```bash
# Edit .env.local
PAYMENT_GATE=false

# Run dev server
npm run dev

# Make predictions without payment!
# No need to connect wallet or make transactions
```

### Staging/Testing Environment

```bash
# Test payment flow
PAYMENT_GATE=true

# Or test without payment
PAYMENT_GATE=false
```

### Production Deployment

```bash
# Always require payment in production!
PAYMENT_GATE=true
```

## Security Considerations

⚠️ **IMPORTANT**: Always set `PAYMENT_GATE=true` in production environments!

- Never deploy to production with `PAYMENT_GATE=false`
- Verify your Vercel environment variables before deployment
- Consider this a development-only feature

## Verification

Check the logs when making a prediction:

With payment gate enabled:

```
[DEBUG] Payment gate enabled: true
[DEBUG] Validating payment for wallet: 0x...
[DEBUG] Payment validation result: { isValid: true, ... }
```

With payment gate disabled:

```
[DEBUG] Payment gate enabled: false
[DEBUG] Payment validation SKIPPED (PAYMENT_GATE=false)
```

## Affected Routes

- `/api/prediction` - Manual feature predictions
- `/api/predict` - API-based predictions

Both routes check the `PAYMENT_GATE` environment variable before validating payment.

