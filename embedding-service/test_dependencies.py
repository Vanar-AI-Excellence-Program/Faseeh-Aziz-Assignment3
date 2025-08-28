#!/usr/bin/env python3
"""
Test script to verify Python 3.12 compatibility and dependencies
"""

import sys
import importlib

def test_imports():
    """Test if all required packages can be imported"""
    packages = [
        'fastapi',
        'uvicorn',
        'google.generativeai',
        'pydantic',
        'numpy'
    ]
    
    print(f"Python version: {sys.version}")
    print(f"Python executable: {sys.executable}")
    print("\nTesting package imports:")
    
    for package in packages:
        try:
            module = importlib.import_module(package)
            version = getattr(module, '__version__', 'unknown')
            print(f"✅ {package} - version {version}")
        except ImportError as e:
            print(f"❌ {package} - Import failed: {e}")
        except Exception as e:
            print(f"⚠️  {package} - Error: {e}")

def test_google_generativeai():
    """Test Google Generative AI functionality"""
    try:
        import google.generativeai as genai
        print("\nTesting Google Generative AI:")
        
        # Test configuration
        genai.configure(api_key="test_key")
        print("✅ Configuration works")
        
        # Test model listing (this should work without API key)
        try:
            models = list(genai.list_models())
            print(f"✅ Model listing works - found {len(models)} models")
        except Exception as e:
            print(f"⚠️  Model listing failed (expected without API key): {e}")
            
    except Exception as e:
        print(f"❌ Google Generative AI test failed: {e}")

def test_fastapi():
    """Test FastAPI functionality"""
    try:
        from fastapi import FastAPI
        from pydantic import BaseModel
        
        print("\nTesting FastAPI:")
        
        app = FastAPI()
        print("✅ FastAPI app creation works")
        
        class TestModel(BaseModel):
            name: str
            value: int
        
        model = TestModel(name="test", value=42)
        print("✅ Pydantic model creation works")
        
    except Exception as e:
        print(f"❌ FastAPI test failed: {e}")

if __name__ == "__main__":
    print("🧪 Testing Python 3.12 Dependencies\n")
    
    test_imports()
    test_google_generativeai()
    test_fastapi()
    
    print("\n✅ Dependency test completed!")
