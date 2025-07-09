# Upload API Fix Guide

## Problem Analysis

The error `HeadersTimeoutError: Headers Timeout Error` with code `UND_ERR_HEADERS_TIMEOUT` occurs during file upload to Supabase Storage. This is typically caused by:

1. **Network timeout issues** - Large files (14.6MB in your case) taking too long to upload
2. **Missing database columns** - The `features_path` and `use_manual_features` columns are missing
3. **Storage bucket configuration** - Missing or incorrectly configured storage buckets
4. **Supabase client configuration** - Missing timeout and retry logic

## Solutions Implemented

### 1. Enhanced Upload API with Retry Logic

The upload API (`src/app/api/models/upload/route.ts`) has been updated with:

- **Retry mechanism** with exponential backoff (3 retries, 2s initial delay)
- **Better error handling** with proper TypeScript types
- **Improved Supabase client configuration** with custom headers
- **Cache control** for better performance

### 2. Database Schema Migration

The database needs additional columns for features support:

```sql
ALTER TABLE models ADD COLUMN IF NOT EXISTS features_path TEXT;
ALTER TABLE models ADD COLUMN IF NOT EXISTS use_manual_features BOOLEAN DEFAULT false;
ALTER TABLE models ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;
```

### 3. Next.js Configuration Updates

The `next.config.js` has been updated with:

- **CORS headers** for API routes
- **External packages configuration** for Supabase
- **Better request handling** for large files

## How to Fix

### Step 1: Run the Fix Script

```bash
npm run fix-upload
```

This script will:

- Test your Supabase connection
- Check and create missing storage buckets
- Verify database schema
- Test storage access
- Check environment variables

### Step 2: Run Database Migration

If the fix script indicates missing database columns, run:

```bash
npm run run-migration
```

Or manually execute the SQL in your Supabase dashboard:

```sql
ALTER TABLE models ADD COLUMN IF NOT EXISTS features_path TEXT;
ALTER TABLE models ADD COLUMN IF NOT EXISTS use_manual_features BOOLEAN DEFAULT false;
ALTER TABLE models ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;
```

### Step 3: Initialize Storage

```bash
npm run init-storage
```

This creates the required storage buckets with proper configuration.

### Step 4: Restart Development Server

```bash
npm run dev
```

## Verification Steps

### 1. Check Database Schema

Run this query in your Supabase dashboard:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'models'
AND table_schema = 'public';
```

You should see:

- `features_path` (TEXT, nullable)
- `use_manual_features` (BOOLEAN, not null)
- `activated_at` (TIMESTAMP, nullable)

### 2. Check Storage Buckets

In your Supabase dashboard, go to Storage and verify you have:

- `models` bucket (50MB file limit)
- `features` bucket (1MB file limit)

### 3. Test Upload

Try uploading a smaller file first (under 10MB) to verify the fix works.

## Troubleshooting

### Still Getting Timeout Errors?

1. **Check network connection** - Ensure stable internet
2. **Reduce file size** - Try with a smaller model file first
3. **Check Supabase quota** - Verify your project has sufficient storage
4. **Verify service role key** - Ensure it has storage permissions

### Database Errors?

1. **Check column types** - Ensure `features_path` is TEXT, not VARCHAR
2. **Verify constraints** - Check for any conflicting constraints
3. **Run migration manually** - Use Supabase dashboard SQL editor

### Storage Errors?

1. **Check bucket permissions** - Verify buckets are accessible
2. **Verify file types** - Ensure .pkl files are allowed
3. **Check file size limits** - Ensure files are under 50MB

## Environment Variables

Ensure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Performance Tips

1. **Compress models** - Use smaller model files when possible
2. **Use CDN** - Consider using Supabase CDN for faster uploads
3. **Monitor quotas** - Keep track of your storage usage
4. **Test incrementally** - Start with small files and increase size

## Support

If you continue to experience issues:

1. Check the browser console for detailed error messages
2. Review server logs for API errors
3. Verify all environment variables are set correctly
4. Test with a fresh Supabase project to isolate the issue

## Files Modified

- `src/app/api/models/upload/route.ts` - Enhanced upload logic
- `next.config.js` - Added CORS and external packages
- `database/add-features-columns.sql` - Database migration
- `scripts/fix-upload-issues.js` - Comprehensive fix script
- `package.json` - Added new scripts

## Next Steps

After implementing these fixes:

1. Test the upload functionality with a small file
2. Monitor the upload process in the browser console
3. Check the server logs for any remaining issues
4. Gradually increase file sizes to test limits
