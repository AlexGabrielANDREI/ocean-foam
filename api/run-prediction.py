"""
Vercel Python Serverless Function for ML Predictions
Handles both manual and API-based predictions
Optimized: Removed pandas dependency to reduce size (~100MB savings)
"""

from http.server import BaseHTTPRequestHandler
import json
import pickle
import numpy as np
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
    """Prepare input data from features dictionary - using numpy arrays instead of pandas"""
    try:
        # If the data is a list, use the first item
        if isinstance(features_data, list):
            features_data = features_data[0]
        
        # Build feature array in correct order
        feature_values = []
        for col in feature_columns:
            value = features_data.get(col, 0)
            
            # Handle special cases
            if isinstance(value, (list, np.ndarray)):
                # For Topic_Probabilities, convert to a single value (use first element or sum)
                if col == 'Topic_Probabilities':
                    value = float(np.array(value).sum()) if len(value) > 0 else 0.0
                else:
                    value = float(value[0]) if len(value) > 0 else 0.0
            elif isinstance(value, bool):
                value = 1.0 if value else 0.0
            elif value is None:
                value = 0.0
            else:
                # Convert to float, handling strings
                try:
                    value = float(value)
                except (ValueError, TypeError):
                    # For string columns like 'Topic', use hash or simple encoding
                    if col == 'Topic':
                        value = float(hash(str(value)) % 1000) / 1000.0
                    else:
                        value = 0.0
            
            feature_values.append(value)
        
        # Convert to numpy array and reshape for sklearn (1 sample, n features)
        feature_array = np.array(feature_values, dtype=np.float64)
        feature_array = feature_array.reshape(1, -1)
        
        # Replace any NaN or inf values with 0
        feature_array = np.nan_to_num(feature_array, nan=0.0, posinf=0.0, neginf=0.0)
        
        return feature_array
    except Exception as e:
        raise Exception(f"Error preparing input data: {e}")


def make_prediction(model, input_array):
    """Make prediction using the model - accepts numpy array"""
    try:
        prediction = model.predict(input_array)[0]
        probabilities = model.predict_proba(input_array)[0]
        
        # Convert numpy types to Python native types for JSON serialization
        if hasattr(prediction, 'item'):
            prediction = prediction.item()
        prediction = str(prediction)
        
        return {
            'prediction': prediction,
            'probabilities': {str(k): float(v) for k, v in zip(model.classes_, probabilities.tolist())},
            'confidence': float(np.max(probabilities))
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
            model_path = data.get('model_path')
            features = data.get('features')
            
            if not model_path or not features:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Missing required parameters: model_path and features'
                }).encode())
                return
            
            # Load model from file path (shared /tmp directory)
            try:
                with open(model_path, 'rb') as f:
                    model = pickle.load(f)
            except FileNotFoundError:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': f'Model file not found at path: {model_path}'
                }).encode())
                return
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': f'Failed to load model: {str(e)}'
                }).encode())
                return
            
            # Get feature columns
            feature_columns = get_original_features()
            
            # Prepare input data as numpy array
            input_array = prepare_input_data(features, feature_columns)
            
            # Make prediction
            result = make_prediction(model, input_array)
            
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
            'message': 'Python prediction service is running (optimized - no pandas)'
        }).encode())
