#!/usr/bin/env python3
"""
API Features Prediction Script

This script handles predictions when features are fetched from external APIs.
It loads the model from storage and fetches features from configured APIs.
"""

import sys
import os
import json
import pickle
import pandas as pd
import numpy as np
import requests
from pathlib import Path
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

# Add the scripts directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class APIFeaturesPredictor:
    def __init__(self, model_path: str, api_config_path: Optional[str] = None):
        """
        Initialize the predictor with model and API configuration.
        
        Args:
            model_path: Path to the .pkl model file
            api_config_path: Optional path to API configuration JSON
        """
        self.model_path = model_path
        self.api_config_path = api_config_path
        self.model = None
        self.feature_names = None
        self.api_config = self._load_api_config()
        
    def _load_api_config(self) -> Dict[str, Any]:
        """
        Load API configuration for feature fetching.
        
        Returns:
            Dict containing API configuration
        """
        if not self.api_config_path or not os.path.exists(self.api_config_path):
            # Return default mock configuration
            return {
                "apis": [
                    {
                        "name": "stock_data",
                        "url": "https://api.example.com/stock/{symbol}",
                        "method": "GET",
                        "headers": {
                            "Authorization": "Bearer YOUR_API_KEY",
                            "Content-Type": "application/json"
                        },
                        "params": {},
                        "features_mapping": {
                            "price": "current_price",
                            "volume": "trading_volume",
                            "change": "price_change",
                            "market_cap": "market_capitalization"
                        },
                        "mock_data": {
                            "current_price": 150.25,
                            "trading_volume": 1000000,
                            "price_change": 2.5,
                            "market_capitalization": 5000000000
                        }
                    },
                    {
                        "name": "economic_data",
                        "url": "https://api.example.com/economic/{indicator}",
                        "method": "GET",
                        "headers": {
                            "Authorization": "Bearer YOUR_API_KEY",
                            "Content-Type": "application/json"
                        },
                        "params": {},
                        "features_mapping": {
                            "gdp": "gdp_growth",
                            "inflation": "inflation_rate",
                            "unemployment": "unemployment_rate"
                        },
                        "mock_data": {
                            "gdp_growth": 2.1,
                            "inflation_rate": 3.2,
                            "unemployment_rate": 4.5
                        }
                    }
                ],
                "feature_aggregation": {
                    "method": "merge",
                    "default_values": {
                        "price": 0.0,
                        "volume": 0,
                        "change": 0.0,
                        "market_cap": 0.0,
                        "gdp": 0.0,
                        "inflation": 0.0,
                        "unemployment": 0.0
                    }
                }
            }
        
        try:
            with open(self.api_config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load API config: {e}")
            return {}
    
    def load_model(self) -> bool:
        """
        Load the ML model from the pickle file.
        
        Returns:
            bool: True if model loaded successfully, False otherwise
        """
        try:
            with open(self.model_path, 'rb') as f:
                self.model = pickle.load(f)
            
            # Try to get feature names from the model
            if hasattr(self.model, 'feature_names_in_'):
                self.feature_names = list(self.model.feature_names_in_)
            elif hasattr(self.model, 'feature_names'):
                self.feature_names = self.model.feature_names
            else:
                logger.warning("Could not determine feature names from model")
                self.feature_names = None
            
            logger.info(f"Model loaded successfully from {self.model_path}")
            if self.feature_names:
                logger.info(f"Expected features: {self.feature_names}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return False
    
    def fetch_features_from_api(self, api_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fetch features from a specific API.
        
        Args:
            api_name: Name of the API to fetch from
            params: Parameters for the API call
            
        Returns:
            Dict containing fetched features
        """
        api_config = next((api for api in self.api_config.get("apis", []) if api["name"] == api_name), None)
        
        if not api_config:
            logger.error(f"API configuration not found for: {api_name}")
            return {}
        
        try:
            # For now, return mock data (replace with actual API calls)
            logger.info(f"Using mock data for API: {api_name}")
            mock_data = api_config.get("mock_data", {})
            
            # Apply feature mapping
            features_mapping = api_config.get("features_mapping", {})
            mapped_features = {}
            
            for api_feature, mapped_name in features_mapping.items():
                if mapped_name in mock_data:
                    mapped_features[api_feature] = mock_data[mapped_name]
            
            return mapped_features
            
        except Exception as e:
            logger.error(f"Failed to fetch features from {api_name}: {e}")
            return {}
    
    def aggregate_features(self, api_features: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Aggregate features from multiple APIs.
        
        Args:
            api_features: List of feature dictionaries from different APIs
            
        Returns:
            Dict containing aggregated features
        """
        aggregation_config = self.api_config.get("feature_aggregation", {})
        method = aggregation_config.get("method", "merge")
        default_values = aggregation_config.get("default_values", {})
        
        if method == "merge":
            # Simple merge of all features
            aggregated = default_values.copy()
            
            for features in api_features:
                aggregated.update(features)
            
            return aggregated
        else:
            logger.warning(f"Unknown aggregation method: {method}")
            return default_values
    
    def validate_features(self, features: Dict[str, Any]) -> "tuple[bool, str]":
        """
        Validate the fetched features against expected format.
        
        Args:
            features: Dictionary of features from APIs
            
        Returns:
            tuple: (is_valid, error_message)
        """
        if not self.feature_names:
            return True, ""  # Can't validate without feature names
        
        missing_features = set(self.feature_names) - set(features.keys())
        extra_features = set(features.keys()) - set(self.feature_names)
        
        if missing_features:
            return False, f"Missing required features: {list(missing_features)}"
        
        if extra_features:
            logger.warning(f"Extra features provided: {list(extra_features)}")
        
        # Validate data types
        for feature_name, value in features.items():
            if feature_name in self.feature_names:
                if not isinstance(value, (int, float, str, bool)):
                    return False, f"Feature '{feature_name}' must be a number, string, or boolean"
        
        return True, ""
    
    def preprocess_features(self, features: Dict[str, Any]) -> np.ndarray:
        """
        Preprocess features for prediction.
        
        Args:
            features: Dictionary of features
            
        Returns:
            np.ndarray: Preprocessed features array
        """
        # Convert to DataFrame for easier manipulation
        df = pd.DataFrame([features])
        
        # Handle categorical variables (convert to numeric if needed)
        for col in df.columns:
            if df[col].dtype == 'object':
                # Try to convert to numeric
                try:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
                except:
                    # If conversion fails, keep as object (will be handled by model)
                    pass
        
        # Ensure all features are numeric for sklearn models
        numeric_features = df.select_dtypes(include=[np.number])
        
        if len(numeric_features.columns) != len(df.columns):
            logger.warning("Some features are non-numeric and may cause issues")
        
        return numeric_features.values
    
    def predict(self, api_params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make a prediction using the loaded model and features from APIs.
        
        Args:
            api_params: Dictionary containing API parameters for feature fetching
            
        Returns:
            Dict containing prediction results and metadata
        """
        if not self.model:
            return {
                "success": False,
                "error": "Model not loaded"
            }
        
        try:
            # Fetch features from all configured APIs
            api_features = []
            for api_config in self.api_config.get("apis", []):
                api_name = api_config["name"]
                api_params_for_call = api_params.get(api_name, {})
                
                features = self.fetch_features_from_api(api_name, api_params_for_call)
                if features:
                    api_features.append(features)
            
            # Aggregate features
            aggregated_features = self.aggregate_features(api_features)
            
            # Validate features
            is_valid, error_msg = self.validate_features(aggregated_features)
            if not is_valid:
                return {
                    "success": False,
                    "error": f"Invalid features: {error_msg}"
                }
            
            # Preprocess features
            X = self.preprocess_features(aggregated_features)
            
            # Make prediction
            prediction = self.model.predict(X)
            prediction_proba = None
            
            # Get prediction probabilities if available
            if hasattr(self.model, 'predict_proba'):
                prediction_proba = self.model.predict_proba(X).tolist()
            
            # Format prediction based on model type
            if hasattr(self.model, 'classes_'):
                # Classification model
                if prediction_proba:
                    class_probs = dict(zip(self.model.classes_, prediction_proba[0]))
                else:
                    class_probs = None
                
                result = {
                    "success": True,
                    "prediction": prediction[0],
                    "prediction_type": "classification",
                    "classes": self.model.classes_.tolist(),
                    "probabilities": class_probs,
                    "confidence": max(prediction_proba[0]) if prediction_proba else None
                }
            else:
                # Regression model
                result = {
                    "success": True,
                    "prediction": float(prediction[0]),
                    "prediction_type": "regression"
                }
            
            # Add metadata
            result.update({
                "model_path": self.model_path,
                "features_used": list(aggregated_features.keys()),
                "api_features": api_features,
                "timestamp": datetime.now().isoformat()
            })
            
            return result
            
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return {
                "success": False,
                "error": f"Prediction failed: {str(e)}"
            }

def main():
    """
    Main function for command-line usage.
    Usage: python api_features.py <model_path> <api_params_json_path>
    """
    if len(sys.argv) != 3:
        print("Usage: python api_features.py <model_path> <api_params_json_path>")
        sys.exit(1)
    
    model_path = sys.argv[1]
    api_params_json_path = sys.argv[2]
    
    # Load API parameters from JSON file
    try:
        with open(api_params_json_path, 'r') as f:
            api_params = json.load(f)
    except Exception as e:
        print(f"Failed to load API parameters JSON: {e}")
        sys.exit(1)
    
    # Initialize predictor
    predictor = APIFeaturesPredictor(model_path)
    
    # Load model
    if not predictor.load_model():
        print("Failed to load model")
        sys.exit(1)
    
    # Make prediction
    result = predictor.predict(api_params)
    
    # Output result
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main() 