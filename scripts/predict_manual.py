import pickle
import pandas as pd
import numpy as np
import json
import sys
import warnings
import os
from pathlib import Path
warnings.filterwarnings('ignore')

def load_original_model(model_path):
    """Load the trained model from pickle file"""
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        return model
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

def get_original_features():
    """Get the feature columns that the model was trained on"""
    feature_columns = [
        'Unnamed: 0', 'Sentiment Score', 'FinBERT Score', 'Average Sentiment Score',
        'Hawkish_Count', 'Dovish_Count', 'Hawkish_to_Dovish_Ratio', 'Hawkish_Weighted_Count',
        'Topic', 'Topic_Probabilities', 'Text_Length', 'Word_Count', 'High_Point',
        'tightening', 'inflation', 'rate hike', 'restrictive', 'interest rate increase',
        'monetary policy tightening', 'overheating', 'constraining', 'hawkish', 'discipline',
        'easing', 'accommodative', 'supportive', 'stimulation', 'interest rate cut',
        'monetary policy easing', 'softening', 'expansionary', 'stimulus', 'dovish',
        'Actual', 'Previous', 'CPI', 'UnemploymentRate', 'FedFundsRate', '10Y_Treasury_Yield',
        '2Y_Treasury_Yield', 'GDP', 'PCE', 'Consumer_Sentiment_Index', 'Housing_Starts',
        'Mortgage_Rates', '10Yr_Treasury_Rate', '2Yr_Treasury_Rate', 'Core_CPI', 'PCEPI',
        'PPI', 'Real_GDP', 'Inflation_Expectations', 'Non_Farm_Payrolls', 'Eurozone_CPI',
        'China_CPI', 'WTI_Crude_Oil', 'Brent_Crude_Oil', 'Bank_Loan_Rate', 'Real_Export_Rate',
        'Total_Vehicle_Sales', 'Corporate_Yield', 'Effective_Rate', 'Fed_Reserve'
    ]
    return feature_columns

def prepare_input_from_json(json_path, feature_columns):
    """Prepare input data from JSON file"""
    try:
        # Load features from JSON file
        with open(json_path, 'r') as f:
            data = json.load(f)
        
        # If the JSON is a list, use the first item
        if isinstance(data, list):
            data = data[0]
        
        # Create DataFrame with one row
        df = pd.DataFrame([data])
        
        # Ensure all required columns are present
        missing = [col for col in feature_columns if col not in df.columns]
        if missing:
            print(f"Warning: Missing features in input: {missing}. Filling with 0.")
            for col in missing:
                df[col] = 0
        
        # Ensure correct column order
        df = df[feature_columns]
        
        # Convert boolean columns if needed
        for col in df.columns:
            if df[col].dtype == object and df[col].isin([True, False]).all():
                df[col] = df[col].astype(bool)
        
        # Fill any remaining NaNs
        df = df.fillna(0)
        
        return df
    except Exception as e:
        print(f"Error preparing input data: {e}")
        return None

def predict(model, input_df):
    """Make prediction using the model"""
    try:
        prediction = model.predict(input_df)[0]
        probabilities = model.predict_proba(input_df)[0]
        
        return {
            'prediction': prediction,
            'probabilities': dict(zip(model.classes_, probabilities.tolist())),
            'confidence': float(max(probabilities))
        }
    except Exception as e:
        print(f"Error making prediction: {e}")
        return None

def main():
    """Main function to run prediction"""
    if len(sys.argv) < 3:
        print("Usage: python predict_manual.py <model_path> <input.json>")
        sys.exit(1)
    
    model_path = sys.argv[1]
    json_path = sys.argv[2]
    
    # Load model
    model = load_original_model(model_path)
    if model is None:
        sys.exit(1)
    
    # Get feature columns
    feature_columns = get_original_features()
    
    # Prepare input data
    input_df = prepare_input_from_json(json_path, feature_columns)
    if input_df is None:
        sys.exit(1)

    # Debug prints for feature shape and names
    print("Input DataFrame shape:", input_df.shape, file=sys.stderr)
    print("Input DataFrame columns:", list(input_df.columns), file=sys.stderr)
    print("Model expects n_features_in_:", getattr(model, 'n_features_in_', 'N/A'), file=sys.stderr)
    print("Model expects feature_names_in_:", getattr(model, 'feature_names_in_', 'N/A'), file=sys.stderr)

    # Make prediction
    result = predict(model, input_df)
    if result is None:
        sys.exit(1)
    
    # Output result as JSON
    print(json.dumps(result))

if __name__ == "__main__":
    main() 