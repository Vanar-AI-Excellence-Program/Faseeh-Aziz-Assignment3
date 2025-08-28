from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
import os
from typing import List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Embedding Service", version="1.0.0")

# Initialize Google Generative AI client
genai.configure(api_key=os.getenv("GOOGLE_GENERATIVE_AI_API_KEY"))
api_key = os.getenv("GOOGLE_GENERATIVE_AI_API_KEY")
if not api_key:
    logger.warning("GOOGLE_GENERATIVE_AI_API_KEY not set. Please set it as an environment variable.")

class EmbedRequest(BaseModel):
    text: str

class EmbedResponse(BaseModel):
    embedding: List[float]

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "embedding-service", "gemini_configured": bool(api_key)}

@app.post("/embed", response_model=EmbedResponse)
async def embed_text(request: EmbedRequest):
    """
    Generate embeddings for the given text using Google's Gemini embedding model.
    """
    if not request.text or request.text.strip() == "":
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    if not api_key:
        raise HTTPException(status_code=500, detail="Google Generative AI API key not configured")
    
    try:
        logger.info(f"Generating embedding for text of length: {len(request.text)}")
        
        # Generate embedding using Google's embedding model
        embedding_model = genai.get_model('embedding-001')
        response = embedding_model.embed_content(request.text)
        
        embedding = response.embedding
        
        logger.info(f"Successfully generated embedding with {len(embedding)} dimensions")
        
        return EmbedResponse(embedding=embedding)
        
    except Exception as e:
        logger.error(f"Error generating embedding: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")

@app.post("/embed/batch")
async def embed_batch_texts(request: List[EmbedRequest]):
    """
    Generate embeddings for multiple texts in batch.
    """
    if not api_key:
        raise HTTPException(status_code=500, detail="Google Generative AI API key not configured")
    
    # Validate input
    if not request or len(request) == 0:
        raise HTTPException(status_code=400, detail="Request cannot be empty")
    
    for req in request:
        if not req.text or req.text.strip() == "":
            raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    try:
        texts = [req.text for req in request]
        logger.info(f"Generating embeddings for {len(texts)} texts")
        
        # Generate embeddings in batch
        embedding_model = genai.get_model('embedding-001')
        embeddings = []
        
        for text in texts:
            response = embedding_model.embed_content(text)
            embeddings.append(response.embedding)
        
        logger.info(f"Successfully generated {len(embeddings)} embeddings")
        
        return {
            "embeddings": embeddings
        }
        
    except Exception as e:
        logger.error(f"Error generating batch embeddings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate batch embeddings: {str(e)}")

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Embedding Service",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "embed": "/embed",
            "embed_batch": "/embed/batch"
        },
        "status": "running"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

