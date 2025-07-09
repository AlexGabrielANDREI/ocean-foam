#!/usr/bin/env python3
"""
Create a simple test ML model for demonstration purposes.
This script creates a basic scikit-learn model and saves it as a .pkl file.
"""

import pickle
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

def create_test_model():
    """Create a simple test model for demonstration."""
    
    # Generate synthetic data
    print("Generating synthetic data...")
    X, y = make_classification(
        n_samples=1000,
        n_features=10,
        n_informative=8,
        n_redundant=2,
        n_classes=2,
        random_state=42
    )
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Create and train the model
    print("Training Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate the model
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Model accuracy: {accuracy:.4f}")
    
    # Save the model
    model_path = "test_model.pkl"
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
    
    print(f"Model saved to: {model_path}")
    print(f"Model file size: {len(pickle.dumps(model)) / 1024:.2f} KB")
    
    # Test loading the model
    print("Testing model loading...")
    with open(model_path, 'rb') as f:
        loaded_model = pickle.load(f)
    
    # Test prediction
    test_prediction = loaded_model.predict(X_test[:1])
    test_probability = loaded_model.predict_proba(X_test[:1])
    
    print(f"Test prediction: {test_prediction[0]}")
    print(f"Test probability: {test_probability[0]}")
    
    return model_path

if __name__ == "__main__":
    try:
        model_path = create_test_model()
        print(f"\n✅ Test model created successfully: {model_path}")
        print("You can now upload this model to the platform!")
    except Exception as e:
        print(f"❌ Error creating test model: {e}") 