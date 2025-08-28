# Embedding Service

A Python microservice that provides text embedding capabilities using Google's Gemini AI API.

## Features

- **Single Text Embedding**: Generate embeddings for individual text inputs
- **Batch Embedding**: Process multiple texts efficiently
- **Health Check**: Monitor service status
- **Error Handling**: Comprehensive error handling and validation
- **Docker Support**: Containerized deployment

## API Endpoints

### POST /embed
Generate embedding for a single text.

**Request:**
```json
{
  "text": "Your text here"
}
```

**Response:**
```json
{
  "embedding": [0.0123, -0.4321, 0.9987, ...]
}
```

### POST /embed/batch
Generate embeddings for multiple texts.

**Request:**
```json
[
  {"text": "First text"},
  {"text": "Second text"},
  {"text": "Third text"}
]
```

**Response:**
```json
{
  "embeddings": [
    [0.0123, -0.4321, 0.9987, ...],
    [0.0456, -0.1234, 0.8765, ...],
    [0.0789, -0.5678, 0.6543, ...]
  ]
}
```

### GET /health
Check service health status.

**Response:**
```json
{
  "status": "healthy",
  "service": "embedding-service",
  "gemini_configured": true
}
```

### GET /
Get service information.

**Response:**
```json
{
  "service": "Embedding Service",
  "version": "1.0.0",
  "endpoints": {
    "health": "/health",
    "embed": "/embed",
    "embed_batch": "/embed/batch"
  },
  "status": "running"
}
```

## Environment Variables

- `GOOGLE_GENERATIVE_AI_API_KEY`: Your Google Gemini AI API key

## Running the Service

### Using Docker

1. Build the image:
```bash
docker build -t embedding-service .
```

2. Run the container:
```bash
docker run -p 8001:8001 -e GOOGLE_GENERATIVE_AI_API_KEY=your_key_here embedding-service
```

### Using Docker Compose

The service is included in the main `docker-compose.yml`:

```bash
docker-compose up embedding-service
```

### Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variable:
```bash
export GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

3. Run the service:
```bash
uvicorn main:app --host 0.0.0.0 --port 8001
```

## Testing

Run the test script to verify the service:

```bash
python test_service.py
```

## Integration

The service is designed to be used by the main application via the `EMBEDDING_API_URL` environment variable:

```bash
EMBEDDING_API_URL=http://localhost:8001
```

## Error Handling

The service includes comprehensive error handling:

- **400 Bad Request**: Invalid input (empty text, malformed JSON)
- **500 Internal Server Error**: API key not configured, Gemini API errors
- **Graceful Degradation**: Clear error messages for debugging

## Model Information

- **Model**: Google Gemini `embedding-001`
- **Dimensions**: 768 (standard for Gemini embeddings)
- **API**: Google Generative AI API
