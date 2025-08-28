#!/usr/bin/env python3
"""
Setup script for embedding service dependencies
"""

import subprocess
import sys
import os

def install_requirements():
    """Install requirements from requirements.txt"""
    print("📦 Installing Python dependencies...")
    
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ])
        print("✅ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def verify_installation():
    """Verify that all packages are installed correctly"""
    print("\n🔍 Verifying installation...")
    
    try:
        import fastapi
        print(f"✅ FastAPI {fastapi.__version__}")
    except ImportError:
        print("❌ FastAPI not installed")
        return False
    
    try:
        import uvicorn
        print(f"✅ Uvicorn {uvicorn.__version__}")
    except ImportError:
        print("❌ Uvicorn not installed")
        return False
    
    try:
        import google.generativeai
        print(f"✅ Google Generative AI {google.generativeai.__version__}")
    except ImportError:
        print("❌ Google Generative AI not installed")
        return False
    
    try:
        import pydantic
        print(f"✅ Pydantic {pydantic.__version__}")
    except ImportError:
        print("❌ Pydantic not installed")
        return False
    
    try:
        import numpy
        print(f"✅ NumPy {numpy.__version__}")
    except ImportError:
        print("❌ NumPy not installed")
        return False
    
    return True

def main():
    print("🚀 Setting up Embedding Service for Python 3.12")
    print(f"Python version: {sys.version}")
    print(f"Python executable: {sys.executable}")
    
    # Install dependencies
    if not install_requirements():
        print("\n❌ Setup failed. Please check the error messages above.")
        sys.exit(1)
    
    # Verify installation
    if not verify_installation():
        print("\n❌ Verification failed. Some packages may not be installed correctly.")
        sys.exit(1)
    
    print("\n✅ Setup completed successfully!")
    print("\n🎯 Next steps:")
    print("1. Set your GOOGLE_GENERATIVE_AI_API_KEY environment variable")
    print("2. Run: python main.py")
    print("3. Or use Docker: docker-compose up -d embedding-service")

if __name__ == "__main__":
    main()
