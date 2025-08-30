from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import os
import logging
import random
from typing import List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Embedding Service", description="Microservice for generating text embeddings using Vercel AI Gateway")

# Request/Response models
class EmbedRequest(BaseModel):
    text: str

class EmbedResponse(BaseModel):
    embedding: List[float]

@app.get("/")
async def root():
    return {"message": "Embedding Service is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "embedding-service"}

@app.get("/test")
async def test_endpoint():
    """Test endpoint that returns a mock embedding"""
    mock_embedding = [random.uniform(-1, 1) for _ in range(1536)]
    return {"message": "Test successful", "mock_embedding_length": len(mock_embedding)}

@app.post("/embed", response_model=EmbedResponse)
async def generate_embedding(request: EmbedRequest):
    try:
        logger.info(f"Received embedding request for text: {request.text[:50]}...")
        
        # Get API key and URL from environment
        api_key = os.getenv("AI_GATEWAY_API_KEY")
        gateway_url = os.getenv("AI_GATEWAY_URL")
        
        logger.info(f"API key found: {api_key[:10]}..." if api_key else "No API key found")
        logger.info(f"Gateway URL: {gateway_url}")
        
        if not api_key:
            raise HTTPException(status_code=500, detail="AI_GATEWAY_API_KEY not configured")
        
        if not gateway_url:
            raise HTTPException(status_code=500, detail="AI_GATEWAY_URL not configured")
        
        # Prepare request to Vercel AI Gateway
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "text-embedding-004",
            "input": request.text
        }
        
        logger.info(f"Sending request to Vercel AI Gateway with payload: {payload}")
        
        # Send request to Vercel AI Gateway using environment variable
        async with httpx.AsyncClient() as client:
            response = await client.post(
                gateway_url,
                headers=headers,
                json=payload,
                timeout=30.0
            )
            
            logger.info(f"Vercel AI Gateway response status: {response.status_code}")
            logger.info(f"Vercel AI Gateway response: {response.text}")
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"Vercel AI Gateway error: {response.text}"
                )
            
            # Parse response
            result = response.json()
            logger.info(f"Parsed response: {result}")
            
            embedding = result.get("data", [{}])[0].get("embedding", [])
            
            if not embedding:
                raise HTTPException(status_code=500, detail="No embedding returned from Vercel AI Gateway")
            
            logger.info(f"Successfully generated embedding with {len(embedding)} dimensions")
            return EmbedResponse(embedding=embedding)
    
    except httpx.TimeoutException as e:
        logger.error(f"Timeout error: {e}")
        raise HTTPException(status_code=408, detail="Request to Vercel AI Gateway timed out")
    except httpx.RequestError as e:
        logger.error(f"Network error: {e}")
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
