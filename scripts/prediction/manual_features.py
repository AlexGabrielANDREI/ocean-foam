#!/usr/bin/env python3
"""
Manual Features Prediction Script

This script handles predictions when users upload JSON files with features.
It loads the model from storage and the uploaded features JSON to make predictions.
"""

import sys
import os
import json
import pickle
import pandas as pd
import numpy as np
from pathlib import Path
import logging
from typing import Dict, Any, Optional

# Add the scripts directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ManualFeaturesPredictor:
    def __init__(self, model_path: str, features_path: Optional[str] = None):
        """
        Initialize the predictor with model and optional features template.
        
        Args:
            model_path: Path to the .pkl model file
            features_path: Optional path to features template JSON
        """
        self.model_path = model_path
        self.features_path = features_path
        self.model = None
        self.feature_names = None
        
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
                # If we have a features template, use that to infer feature names
                if self.features_path and os.path.exists(self.features_path):
                    with open(self.features_path, 'r') as f:
                        template_features = json.load(f)
                    self.feature_names = list(template_features.keys())
                else:
                    logger.warning("Could not determine feature names from model or template")
                    self.feature_names = None
            
            logger.info(f"Model loaded successfully from {self.model_path}")
            if self.feature_names:
                logger.info(f"Expected features: {self.feature_names}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return False
    
    def validate_features(self, features: Dict[str, Any]) -> "tuple[bool, str]":
        """
        Validate the uploaded features against expected format.
        
        Args:
            features: Dictionary of features from uploaded JSON
            
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
    
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make a prediction using the loaded model and provided features.
        
        Args:
            features: Dictionary of features from uploaded JSON
            
        Returns:
            Dict containing prediction results and metadata
        """
        if not self.model:
            return {
                "success": False,
                "error": "Model not loaded"
            }
        
        # Validate features
        is_valid, error_msg = self.validate_features(features)
        if not is_valid:
            return {
                "success": False,
                "error": f"Invalid features: {error_msg}"
            }
        
        try:
            # Preprocess features
            X = self.preprocess_features(features)
            
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
                "features_used": list(features.keys()),
                "timestamp": pd.Timestamp.now().isoformat()
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
    Usage: python manual_features.py <model_path> <features_json_path>
    """
    if len(sys.argv) != 3:
        print("Usage: python manual_features.py <model_path> <features_json_path>")
        sys.exit(1)
    
    model_path = sys.argv[1]
    features_json_path = sys.argv[2]
    
    # Load features from JSON file
    try:
        with open(features_json_path, 'r') as f:
            features = json.load(f)
    except Exception as e:
        print(f"Failed to load features JSON: {e}")
        sys.exit(1)
    
    # Initialize predictor
    predictor = ManualFeaturesPredictor(model_path)
    
    # Load model
    if not predictor.load_model():
        print("Failed to load model")
        sys.exit(1)
    
    # Make prediction
    result = predictor.predict(features)
    
    # Output result
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main() 