from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import openai
import os
from typing import List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Embedding Service", version="1.0.0")

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    logger.warning("OPENAI_API_KEY not set. Please set it as an environment variable.")

class EmbedRequest(BaseModel):
    text: str

class EmbedResponse(BaseModel):
    embedding: List[float]
    model: str

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "embedding-service"}

@app.post("/embed", response_model=EmbedResponse)
async def embed_text(request: EmbedRequest):
    """
    Generate embeddings for the given text using OpenAI's text-embedding-ada-002 model.
    """
    if not openai.api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    try:
        logger.info(f"Generating embedding for text of length: {len(request.text)}")
        
        # Generate embedding using OpenAI
        response = openai.Embedding.create(
            input=request.text,
            model="text-embedding-ada-002"
        )
        
        embedding = response['data'][0]['embedding']
        model = response['model']
        
        logger.info(f"Successfully generated embedding with {len(embedding)} dimensions")
        
        return EmbedResponse(
            embedding=embedding,
            model=model
        )
        
    except Exception as e:
        logger.error(f"Error generating embedding: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate embedding: {str(e)}")

@app.post("/embed/batch")
async def embed_batch_texts(request: List[EmbedRequest]):
    """
    Generate embeddings for multiple texts in batch.
    """
    if not openai.api_key:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")
    
    try:
        texts = [req.text for req in request]
        logger.info(f"Generating embeddings for {len(texts)} texts")
        
        # Generate embeddings in batch
        response = openai.Embedding.create(
            input=texts,
            model="text-embedding-ada-002"
        )
        
        embeddings = [data['embedding'] for data in response['data']]
        model = response['model']
        
        logger.info(f"Successfully generated {len(embeddings)} embeddings")
        
        return {
            "embeddings": embeddings,
            "model": model
        }
        
    except Exception as e:
        logger.error(f"Error generating batch embeddings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate batch embeddings: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
