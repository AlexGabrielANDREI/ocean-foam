"""
Vercel Python Serverless Function for ML Predictions
Handles both manual and API-based predictions
"""

from http.server import BaseHTTPRequestHandler
import json
import pickle
import pandas as pd
import numpy as np
import base64
import warnings
warnings.filterwarnings('ignore')


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


def prepare_input_data(features_data, feature_columns):
    """Prepare input data from features dictionary"""
    try:
        # If the data is a list, use the first item
        if isinstance(features_data, list):
            features_data = features_data[0]
        
        # Create DataFrame with one row
        df = pd.DataFrame([features_data])
        
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
        raise Exception(f"Error preparing input data: {e}")


def make_prediction(model, input_df):
    """Make prediction using the model"""
    try:
        prediction = model.predict(input_df)[0]
        probabilities = model.predict_proba(input_df)[0]
        
        # Convert numpy types to Python native types for JSON serialization
        prediction = str(prediction) if hasattr(prediction, 'item') else prediction
        
        return {
            'prediction': prediction,
            'probabilities': {str(k): float(v) for k, v in zip(model.classes_, probabilities.tolist())},
            'confidence': float(max(probabilities))
        }
    except Exception as e:
        raise Exception(f"Error making prediction: {e}")


class handler(BaseHTTPRequestHandler):
    """Vercel serverless function handler"""
    
    def do_POST(self):
        """Handle POST requests"""
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            # Extract parameters
            model_base64 = data.get('model')
            features = data.get('features')
            
            if not model_base64 or not features:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Missing required parameters: model and features'
                }).encode())
                return
            
            # Decode and load model from base64
            model_bytes = base64.b64decode(model_base64)
            model = pickle.loads(model_bytes)
            
            # Get feature columns
            feature_columns = get_original_features()
            
            # Prepare input data
            input_df = prepare_input_data(features, feature_columns)
            
            # Make prediction
            result = make_prediction(model, input_df)
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': str(e)
            }).encode())
    
    def do_GET(self):
        """Handle GET requests - health check"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            'status': 'ok',
            'message': 'Python prediction service is running'
        }).encode())

