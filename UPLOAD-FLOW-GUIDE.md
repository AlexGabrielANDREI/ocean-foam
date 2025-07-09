# Model Upload Flow Guide

This guide explains the complete multi-step model upload process for administrators, including both manual features and API features workflows.

## Overview

The model upload system now supports two distinct workflows:

1. **Manual Features**: Users upload JSON files with features
2. **API Features**: System fetches features from external APIs

## Upload Flow Steps

### Step 1: Model Information & Upload

**What the Admin Does:**

- Fill out the upload form with:
  - Model Name (required)
  - Description (optional)
  - Model File (.pkl) - drag and drop upload
  - **Manual Features Checkbox**: Check if users should upload JSON files with features

**If Manual Features is checked:**

- Additional drag and drop input appears for sample features JSON file
- This file serves as a template for users

**What the System Does:**

- Validates the model file (.pkl format, < 50MB)
- Validates features file if provided (.json format, < 1MB)
- Computes SHA256 hash of the model
- Generates version number (increments from previous versions)
- Uploads model to Supabase Storage (`models` bucket)
- Uploads features template to Supabase Storage (`features` bucket) if provided
- Creates database record with `is_active = false`
- Stores model path, features path, and metadata

### Step 2: Review Model Details

**What the Admin Sees:**

- Model Hash: `abc123456...efg7890` (with copy button)
- Model Path: `/models/model_v3/model.pkl` (with copy button)
- Model Name: `some name` (with copy button)
- Owner Wallet: `0.0.123abc` (with copy button)

**What the Admin Does:**

- Review all details
- Copy any information needed
- Click "Next" to proceed

### Step 3: NFT Registration

**What the Admin Does:**

- Enter NFT ID in the input field
- Click "Register & Activate"

**What the System Does:**

- Updates model record with NFT ID
- Sets `is_active = true`
- Sets `activated_at` timestamp
- Shows success message: "Model is now active and available for prediction"

## Folder Structure

```
scripts/
├── prediction/
│   ├── manual_features.py      # Handles manual features predictions
│   ├── api_features.py         # Handles API features predictions
│   └── api_config.json         # API configuration and mock data
├── create_test_model.py        # Creates test ML models
└── init_storage.py             # Initializes Supabase storage buckets
```

## Prediction Workflows

### Manual Features Workflow

1. **User selects a manual features model**
2. **User uploads JSON file with features**
3. **System downloads model from storage**
4. **Python script (`manual_features.py`) processes:**
   - Loads model from .pkl file
   - Validates uploaded features against expected format
   - Preprocesses features
   - Makes prediction
   - Returns structured result

### API Features Workflow

1. **User selects an API features model**
2. **User optionally provides API parameters**
3. **System downloads model from storage**
4. **Python script (`api_features.py`) processes:**
   - Loads model from .pkl file
   - Fetches features from configured APIs (or uses mock data)
   - Aggregates features from multiple sources
   - Makes prediction
   - Returns structured result

## API Configuration

The `api_config.json` file contains:

```json
{
  "apis": [
    {
      "name": "stock_data",
      "url": "https://api.example.com/stock/{symbol}",
      "method": "GET",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
      },
      "features_mapping": {
        "price": "current_price",
        "volume": "trading_volume"
      },
      "mock_data": {
        "current_price": 150.25,
        "trading_volume": 1000000
      }
    }
  ],
  "feature_aggregation": {
    "method": "merge",
    "default_values": {
      "price": 0.0,
      "volume": 0
    }
  }
}
```

## Database Schema Updates

The `models` table now includes:

```sql
ALTER TABLE models ADD COLUMN use_manual_features BOOLEAN DEFAULT false;
ALTER TABLE models ADD COLUMN features_path TEXT;
ALTER TABLE models ADD COLUMN activated_at TIMESTAMP;
```

## Security Features

1. **Admin-only access**: Only users with `is_admin = true` can upload models
2. **Wallet authentication**: All operations require valid wallet address
3. **File validation**: Strict file type and size validation
4. **Model hashing**: SHA256 hash for integrity verification
5. **Version control**: Automatic version numbering
6. **NFT registration**: Models require NFT ID for activation

## Error Handling

The system handles various error scenarios:

- **Invalid file types**: Rejects non-.pkl model files and non-.json feature files
- **File size limits**: Enforces 50MB for models, 1MB for features
- **Missing features**: Validates required features for manual uploads
- **API failures**: Graceful fallback to mock data for API features
- **Storage errors**: Proper cleanup of temporary files
- **Database errors**: Transaction rollback on failures

## Testing

### Create Test Model

```bash
cd scripts
python create_test_model.py
```

This creates a test model that can be used for testing both workflows.

### Test Manual Features

1. Upload model with manual features enabled
2. Download sample features JSON
3. Make prediction with uploaded features

### Test API Features

1. Upload model with manual features disabled
2. Make prediction without API parameters (uses mock data)
3. Make prediction with custom API parameters

## Monitoring

The system logs all operations:

- Model uploads and activations
- Prediction requests and results
- Token usage and deductions
- Error conditions and failures

## Future Enhancements

1. **Real API Integration**: Replace mock data with actual API calls
2. **Feature Validation**: Enhanced feature schema validation
3. **Model Performance**: Track prediction accuracy and performance
4. **Batch Processing**: Support for multiple predictions
5. **Advanced Analytics**: Detailed usage analytics and insights

## Troubleshooting

### Common Issues

1. **Upload fails**: Check file size and format
2. **Model not active**: Ensure NFT ID is provided in step 3
3. **Prediction fails**: Verify features match model expectations
4. **Storage errors**: Check Supabase bucket permissions
5. **Python script errors**: Verify dependencies are installed

### Debug Steps

1. Check browser console for frontend errors
2. Check server logs for API errors
3. Verify Supabase connection and permissions
4. Test Python scripts independently
5. Validate file formats and sizes

## Support

For issues or questions:

1. Check the error messages in the UI
2. Review the browser console logs
3. Check the server logs
4. Verify all environment variables are set
5. Ensure all dependencies are installed
