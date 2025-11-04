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
import os
import urllib.request
import urllib.parse
import tempfile
import sklearn
warnings.filterwarnings('ignore')

# Check scikit-learn version
print(f"[Python] scikit-learn version: {sklearn.__version__}")
if sklearn.__version__.startswith('1.4') or sklearn.__version__.startswith('1.5') or sklearn.__version__.startswith('1.6') or sklearn.__version__.startswith('1.7'):
    print("[Python] WARNING: scikit-learn 1.4+ detected, but model was trained with 1.3.x")
    print("[Python] Model requires scikit-learn 1.3.x (without missing_go_to_left field)")


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
            supabase_storage_path = data.get('supabase_storage_path')
            features = data.get('features')
            
            if not features:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Missing required parameter: features'
                }).encode())
                return
            
            # Try to load model from local path first
            model = None
            if model_path:
                try:
                    if os.path.exists(model_path):
                        with open(model_path, 'rb') as f:
                            model = pickle.load(f)
                        print(f"[Python] Loaded model from local path: {model_path}")
                except Exception as e:
                    print(f"[Python] Failed to load from local path: {e}")
            
            # If not found locally, download from Supabase
            if model is None and supabase_storage_path:
                try:
                    # Get Supabase credentials from environment
                    supabase_url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
                    supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
                    
                    if not supabase_url or not supabase_key:
                        raise Exception("Supabase credentials not found in environment")
                    
                    # Construct Supabase storage URL
                    # For private buckets, use: https://{project}.supabase.co/storage/v1/object/sign/{bucket}/{path}
                    # URL encode each path segment separately
                    path_parts = supabase_storage_path.split('/')
                    encoded_parts = [urllib.parse.quote(part, safe='') for part in path_parts]
                    encoded_path = '/'.join(encoded_parts)
                    
                    # Try signed URL endpoint first (for private buckets)
                    storage_url = f"{supabase_url}/storage/v1/object/sign/ml-models/{encoded_path}"
                    
                    print(f"[Python] Downloading model from Supabase")
                    print(f"[Python] Original path: {supabase_storage_path}")
                    print(f"[Python] Encoded path: {encoded_path}")
                    print(f"[Python] Using signed URL endpoint")
                    
                    # Download model file using signed URL
                    req = urllib.request.Request(storage_url)
                    req.add_header('apikey', supabase_key)
                    req.add_header('Authorization', f'Bearer {supabase_key}')
                    
                    try:
                        with urllib.request.urlopen(req) as response:
                            if response.status != 200:
                                raise Exception(f"HTTP {response.status}: {response.reason}")
                            # Signed URL returns a JSON with a signed URL, need to follow redirect or use direct download
                            signed_data = json.loads(response.read().decode('utf-8'))
                            if 'signedURL' in signed_data:
                                # Follow the signed URL
                                signed_url = signed_data['signedURL']
                                print(f"[Python] Following signed URL")
                                with urllib.request.urlopen(signed_url) as signed_response:
                                    model_data = signed_response.read()
                            else:
                                # Fallback: try direct download endpoint
                                direct_url = f"{supabase_url}/storage/v1/object/ml-models/{encoded_path}"
                                req_direct = urllib.request.Request(direct_url)
                                req_direct.add_header('apikey', supabase_key)
                                req_direct.add_header('Authorization', f'Bearer {supabase_key}')
                                with urllib.request.urlopen(req_direct) as direct_response:
                                    model_data = direct_response.read()
                    except urllib.error.HTTPError as e:
                        # If signed URL fails, try direct download endpoint
                        if e.code in [400, 404]:
                            print(f"[Python] Signed URL failed ({e.code}), trying direct download endpoint")
                            direct_url = f"{supabase_url}/storage/v1/object/ml-models/{encoded_path}"
                            print(f"[Python] Direct URL: {direct_url}")
                            req_direct = urllib.request.Request(direct_url)
                            req_direct.add_header('apikey', supabase_key)
                            req_direct.add_header('Authorization', f'Bearer {supabase_key}')
                            try:
                                print(f"[Python] Attempting direct download...")
                                with urllib.request.urlopen(req_direct) as response:
                                    if response.status != 200:
                                        raise Exception(f"HTTP {response.status}: {response.reason}")
                                    model_data = response.read()
                                    print(f"[Python] Downloaded {len(model_data)} bytes")
                            except urllib.error.HTTPError as e2:
                                error_body = e2.read().decode('utf-8') if e2.fp else str(e2)
                                print(f"[Python] Direct download failed: HTTP {e2.code}: {e2.reason}")
                                raise Exception(f"HTTP {e2.code}: {e2.reason}. Details: {error_body}")
                            except Exception as e2:
                                print(f"[Python] Direct download error: {str(e2)}")
                                raise
                        else:
                            error_body = e.read().decode('utf-8') if e.fp else str(e)
                            print(f"[Python] HTTP error: {e.code}: {e.reason}")
                            raise Exception(f"HTTP {e.code}: {e.reason}. Details: {error_body}")
                    except urllib.error.URLError as e:
                        print(f"[Python] URL error: {str(e)}")
                        raise Exception(f"URL Error: {str(e)}")
                    
                    # Save to temp file and load
                    print(f"[Python] Saving model to temp file...")
                    temp_dir = tempfile.gettempdir()
                    temp_model_path = os.path.join(temp_dir, f"model_{hash(supabase_storage_path)}.pkl")
                    with open(temp_model_path, 'wb') as f:
                        f.write(model_data)
                    print(f"[Python] Model saved, loading with pickle...")
                    
                    try:
                        with open(temp_model_path, 'rb') as f:
                            model = pickle.load(f)
                        print(f"[Python] Model loaded successfully: {type(model)}")
                    except ValueError as e:
                        if "missing_go_to_left" in str(e) or "incompatible dtype" in str(e):
                            print(f"[Python] Model version mismatch detected!")
                            print(f"[Python] Runtime scikit-learn: {sklearn.__version__}")
                            print(f"[Python] Model requires scikit-learn 1.3.x (without missing_go_to_left)")
                            print(f"[Python] ERROR: Version mismatch cannot be resolved automatically")
                            print(f"[Python] Solutions:")
                            print(f"[Python]   1. Constrain scikit-learn to >=1.3.0,<1.4.0")
                            print(f"[Python]   2. Or retrain model with scikit-learn {sklearn.__version__}")
                            raise Exception(f"Model/scikit-learn version mismatch. Runtime: {sklearn.__version__}, Model requires: 1.3.x. {str(e)}")
                        else:
                            print(f"[Python] Failed to load model with pickle: {str(e)}")
                            raise Exception(f"Failed to load model: {str(e)}")
                    except Exception as e:
                        print(f"[Python] Failed to load model with pickle: {str(e)}")
                        raise Exception(f"Failed to load model: {str(e)}")
                    
                    print(f"[Python] Model downloaded and cached to: {temp_model_path}")
                    
                except Exception as e:
                    print(f"[Python] Exception during Supabase download: {str(e)}")
                    import traceback
                    traceback.print_exc()
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'error': f'Failed to download model from Supabase: {str(e)}'
                    }).encode())
                    return
            
            if model is None:
                self.send_response(404)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'error': 'Model file not found locally and no Supabase storage path provided'
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
