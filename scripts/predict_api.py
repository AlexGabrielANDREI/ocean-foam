import pickle
import pandas as pd
import numpy as np
import json
import sys
import warnings
import requests
from datetime import datetime, timedelta
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

def fetch_features_from_api():
    """Fetch features from external API (mock implementation for now)"""
    try:
        # This is a mock implementation - replace with actual API calls
        # For now, we'll generate realistic mock data
        
        # Mock sentiment data
        sentiment_score = np.random.uniform(-1, 1)
        finbert_score = np.random.uniform(-1, 1)
        avg_sentiment = np.random.uniform(-0.5, 0.5)
        
        # Mock hawkish/dovish counts
        hawkish_count = np.random.randint(0, 10)
        dovish_count = np.random.randint(0, 10)
        hawkish_to_dovish_ratio = hawkish_count / (dovish_count + 1)
        hawkish_weighted_count = hawkish_count * np.random.uniform(0.8, 1.2)
        
        # Mock topic data
        topics = ['monetary_policy', 'inflation', 'employment', 'growth']
        topic = np.random.choice(topics)
        topic_probabilities = np.random.dirichlet(np.ones(4))
        
        # Mock text features
        text_length = np.random.randint(100, 1000)
        word_count = np.random.randint(50, 200)
        high_point = np.random.randint(0, 5)
        
        # Mock keyword counts
        keyword_counts = {
            'tightening': np.random.randint(0, 3),
            'inflation': np.random.randint(0, 5),
            'rate hike': np.random.randint(0, 2),
            'restrictive': np.random.randint(0, 2),
            'interest rate increase': np.random.randint(0, 2),
            'monetary policy tightening': np.random.randint(0, 1),
            'overheating': np.random.randint(0, 1),
            'constraining': np.random.randint(0, 1),
            'hawkish': np.random.randint(0, 3),
            'discipline': np.random.randint(0, 1),
            'easing': np.random.randint(0, 2),
            'accommodative': np.random.randint(0, 2),
            'supportive': np.random.randint(0, 2),
            'stimulation': np.random.randint(0, 1),
            'interest rate cut': np.random.randint(0, 1),
            'monetary policy easing': np.random.randint(0, 1),
            'softening': np.random.randint(0, 1),
            'expansionary': np.random.randint(0, 1),
            'stimulus': np.random.randint(0, 1),
            'dovish': np.random.randint(0, 2)
        }
        
        # Mock economic indicators
        economic_data = {
            'Actual': np.random.uniform(2.0, 4.0),
            'Previous': np.random.uniform(2.0, 4.0),
            'CPI': np.random.uniform(2.0, 5.0),
            'UnemploymentRate': np.random.uniform(3.0, 6.0),
            'FedFundsRate': np.random.uniform(4.0, 6.0),
            '10Y_Treasury_Yield': np.random.uniform(3.0, 5.0),
            '2Y_Treasury_Yield': np.random.uniform(4.0, 6.0),
            'GDP': np.random.uniform(1.0, 3.0),
            'PCE': np.random.uniform(2.0, 4.0),
            'Consumer_Sentiment_Index': np.random.uniform(50, 100),
            'Housing_Starts': np.random.uniform(1000, 2000),
            'Mortgage_Rates': np.random.uniform(5.0, 8.0),
            '10Yr_Treasury_Rate': np.random.uniform(3.0, 5.0),
            '2Yr_Treasury_Rate': np.random.uniform(4.0, 6.0),
            'Core_CPI': np.random.uniform(2.0, 4.0),
            'PCEPI': np.random.uniform(2.0, 4.0),
            'PPI': np.random.uniform(1.0, 3.0),
            'Real_GDP': np.random.uniform(1.0, 3.0),
            'Inflation_Expectations': np.random.uniform(2.0, 4.0),
            'Non_Farm_Payrolls': np.random.uniform(100, 300),
            'Eurozone_CPI': np.random.uniform(1.0, 3.0),
            'China_CPI': np.random.uniform(1.0, 3.0),
            'WTI_Crude_Oil': np.random.uniform(60, 100),
            'Brent_Crude_Oil': np.random.uniform(65, 105),
            'Bank_Loan_Rate': np.random.uniform(5.0, 8.0),
            'Real_Export_Rate': np.random.uniform(1.0, 2.0),
            'Total_Vehicle_Sales': np.random.uniform(10, 20),
            'Corporate_Yield': np.random.uniform(4.0, 7.0),
            'Effective_Rate': np.random.uniform(4.0, 6.0),
            'Fed_Reserve': np.random.uniform(4.0, 6.0)
        }
        
        # Combine all features
        features = {
            'Unnamed: 0': 0,
            'Sentiment Score': sentiment_score,
            'FinBERT Score': finbert_score,
            'Average Sentiment Score': avg_sentiment,
            'Hawkish_Count': hawkish_count,
            'Dovish_Count': dovish_count,
            'Hawkish_to_Dovish_Ratio': hawkish_to_dovish_ratio,
            'Hawkish_Weighted_Count': hawkish_weighted_count,
            'Topic': topic,
            'Topic_Probabilities': topic_probabilities.tolist(),
            'Text_Length': text_length,
            'Word_Count': word_count,
            'High_Point': high_point,
            **keyword_counts,
            **economic_data
        }
        
        return features
        
    except Exception as e:
        print(f"Error fetching features from API: {e}")
        return None

def prepare_input_from_api(features, feature_columns):
    """Prepare input data from API features"""
    try:
        # Create DataFrame with one row
        df = pd.DataFrame([features])
        
        # Ensure all required columns are present
        missing = [col for col in feature_columns if col not in df.columns]
        if missing:
            print(f"Warning: Missing features from API: {missing}. Filling with 0.")
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
        print("Usage: python predict_api.py <model_path> <features_json>")
        sys.exit(1)
    
    model_path = sys.argv[1]
    features_json = sys.argv[2]
    
    # Load model
    model = load_original_model(model_path)
    if model is None:
        sys.exit(1)
    
    # Get feature columns
    feature_columns = get_original_features()
    
    # Parse features from JSON input
    try:
        features = json.loads(features_json)
    except json.JSONDecodeError as e:
        print(f"Error parsing features JSON: {e}")
        sys.exit(1)
    
    # Prepare input data
    input_df = prepare_input_from_api(features, feature_columns)
    if input_df is None:
        sys.exit(1)
    
    # Make prediction
    result = predict(model, input_df)
    if result is None:
        sys.exit(1)
    
    # Output result as JSON
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main() 