#!/usr/bin/env python3
"""
Test script for the embedding service
"""
import requests
import json
import os

def test_embedding_service():
    """Test the embedding service endpoints"""
    base_url = "http://localhost:8001"
    
    # Test health endpoint
    print("Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"Health check: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Health check failed: {e}")
        return False
    
    # Test single embedding
    print("\nTesting single embedding...")
    test_text = "Artificial intelligence is the simulation of human intelligence."
    try:
        response = requests.post(
            f"{base_url}/embed",
            json={"text": test_text},
            headers={"Content-Type": "application/json"}
        )
        print(f"Single embedding: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Embedding dimensions: {len(data['embedding'])}")
            print(f"First few values: {data['embedding'][:5]}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Single embedding failed: {e}")
        return False
    
    # Test batch embedding
    print("\nTesting batch embedding...")
    test_texts = [
        "Machine learning is a subset of artificial intelligence.",
        "Deep learning uses neural networks with multiple layers.",
        "Natural language processing helps computers understand human language."
    ]
    try:
        response = requests.post(
            f"{base_url}/embed/batch",
            json=[{"text": text} for text in test_texts],
            headers={"Content-Type": "application/json"}
        )
        print(f"Batch embedding: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Number of embeddings: {len(data['embeddings'])}")
            for i, embedding in enumerate(data['embeddings']):
                print(f"Embedding {i+1} dimensions: {len(embedding)}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Batch embedding failed: {e}")
        return False
    
    # Test error handling
    print("\nTesting error handling...")
    try:
        response = requests.post(
            f"{base_url}/embed",
            json={"text": ""},
            headers={"Content-Type": "application/json"}
        )
        print(f"Empty text test: {response.status_code}")
        if response.status_code == 400:
            print("✓ Correctly rejected empty text")
        else:
            print(f"Unexpected response: {response.text}")
    except Exception as e:
        print(f"Error handling test failed: {e}")
    
    print("\n✅ All tests completed!")
    return True

if __name__ == "__main__":
    test_embedding_service()
