# 🚀 Model Upload Guide

This guide will help you upload and use ML models in the Ocean Prediction Platform.

## 📋 Prerequisites

- Admin access to the platform
- Python environment with required packages
- ML model in .pkl format (scikit-learn compatible)

## 🔧 Step 1: Create a Test Model

### Option 1: Use the Provided Script

1. **Navigate to the scripts directory**:

   ```bash
   cd scripts
   ```

2. **Run the test model creation script**:

   ```bash
   python create_test_model.py
   ```

3. **Verify the output**:

   ```
   Generating synthetic data...
   Training Random Forest model...
   Model accuracy: 0.9450
   Model saved to: test_model.pkl
   Model file size: 45.23 KB
   Testing model loading...
   Test prediction: 1
   Test probability: [0.12 0.88]

   ✅ Test model created successfully: test_model.pkl
   You can now upload this model to the platform!
   ```

### Option 2: Use Your Own Model

Ensure your model meets these requirements:

- **Format**: .pkl (Python pickle)
- **Framework**: scikit-learn compatible
- **Size**: < 50MB
- **Features**: 10 features (for the test model)

## 📤 Step 2: Upload the Model

### 2.1 Access the Upload Page

1. **Connect your wallet** (must have admin role)
2. **Navigate to**: `/admin/models`
3. **Click**: "Upload Model" button
4. **Or go directly to**: `/admin/models/upload`

### 2.2 Fill in Model Information

1. **Model Name**: Give your model a descriptive name

   - Example: "Stock Price Predictor v1.0"

2. **Description**: Describe what your model does

   - Example: "Random Forest model for predicting stock price movements based on technical indicators"

3. **Version**: Set the model version number

   - Start with 1 for new models

4. **NFT ID** (Optional): Link to an NFT if applicable

   - Example: "0x1234..." (NFT token ID)

5. **Model File**: Upload your .pkl file
   - Click "Choose File" or drag and drop
   - Maximum size: 50MB

### 2.3 Submit the Upload

1. **Review your information**
2. **Click**: "Upload Model"
3. **Wait for confirmation**: "Model uploaded successfully!"

## 🧪 Step 3: Test the Model

### 3.1 Make a Prediction

1. **Navigate to**: `/prediction`
2. **Select your model** from the dropdown
3. **Choose feature source**:

   - **API Features**: Automatic feature generation
   - **Manual Features**: Upload JSON file with features

4. **Click**: "Make Prediction"
5. **View results**: Prediction and confidence score

### 3.2 Test with Manual Features

Create a JSON file with your model's expected features:

```json
{
  "feature_1": 0.5,
  "feature_2": 0.3,
  "feature_3": 0.8,
  "feature_4": 0.2,
  "feature_5": 0.7,
  "feature_6": 0.4,
  "feature_7": 0.6,
  "feature_8": 0.1,
  "feature_9": 0.9,
  "feature_10": 0.3
}
```

## 🔍 Step 4: Monitor and Manage

### 4.1 View All Models

1. **Go to**: `/admin/models`
2. **See all uploaded models** with:
   - Name and description
   - Version number
   - Active status
   - Creation date
   - Owner wallet

### 4.2 Manage Model Status

- **Activate/Deactivate**: Toggle model availability
- **Delete**: Remove models (admin only)
- **View Details**: See model hash and file path

## 🛠️ Technical Details

### Model Requirements

```python
# Example model structure
from sklearn.ensemble import RandomForestClassifier
import pickle

# Train your model
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Save the model
with open('your_model.pkl', 'wb') as f:
    pickle.dump(model, f)
```

### Feature Format

Your model should expect features in this format:

- **Number of features**: 10 (for test model)
- **Data types**: Numeric (float/int)
- **Range**: 0-1 (normalized)

### API Integration

The platform automatically:

1. **Downloads** your model from storage
2. **Loads** it using pickle
3. **Validates** the model structure
4. **Runs** predictions with provided features
5. **Returns** results with confidence scores

## 🚨 Troubleshooting

### Common Issues

1. **"File size must be less than 50MB"**

   - Compress your model or use model optimization
   - Consider using joblib for larger models

2. **"Only .pkl files are allowed"**

   - Ensure your model is saved as .pkl
   - Use `pickle.dump()` to save

3. **"Model with this hash already exists"**

   - Change your model or version number
   - Each model must have a unique hash

4. **"Admin access required"**
   - Ensure your wallet has admin role
   - Contact platform administrator

### Debug Steps

1. **Check model file**:

   ```python
   import pickle
   with open('your_model.pkl', 'rb') as f:
       model = pickle.load(f)
   print(type(model))  # Should be a scikit-learn estimator
   ```

2. **Test prediction locally**:
   ```python
   # Test with sample data
   sample_features = [[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]]
   prediction = model.predict(sample_features)
   probability = model.predict_proba(sample_features)
   print(f"Prediction: {prediction}")
   print(f"Probability: {probability}")
   ```

## 📊 Best Practices

### Model Optimization

1. **Feature Engineering**: Ensure features are meaningful
2. **Model Selection**: Choose appropriate algorithms
3. **Hyperparameter Tuning**: Optimize model performance
4. **Validation**: Test thoroughly before upload

### Security Considerations

1. **Model Validation**: Verify model behavior
2. **Input Sanitization**: Validate feature inputs
3. **Access Control**: Restrict model access as needed
4. **Monitoring**: Track model performance over time

## 🎯 Next Steps

After uploading your model:

1. **Test thoroughly** with various inputs
2. **Monitor performance** in production
3. **Update models** as needed
4. **Share with users** for predictions

Your model is now ready for production use! 🚀
