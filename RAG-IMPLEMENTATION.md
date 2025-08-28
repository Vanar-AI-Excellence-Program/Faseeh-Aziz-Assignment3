# RAG (Retrieval-Augmented Generation) Implementation

This document describes the RAG backend implementation with pgvector for the AuthApp project.

## 🏗️ Architecture Overview

The RAG system consists of the following components:

1. **PostgreSQL Database with pgvector** - Stores documents, chunks, and embeddings
2. **Embedding Service** - FastAPI service for generating embeddings using OpenAI
3. **RAG Service** - Core business logic for document ingestion and retrieval
4. **API Endpoints** - RESTful endpoints for RAG operations
5. **Integration with Chat** - RAG results integrated into AI chat responses

## 📊 Database Schema

### Tables

#### `documents`
- `id` (uuid, PK) - Unique document identifier
- `userId` (text) - User who owns the document
- `name` (text) - Document name/title
- `metadata` (text) - JSON string for document metadata
- `createdAt` (timestamp) - Document creation time
- `updatedAt` (timestamp) - Document last update time

#### `chunks`
- `id` (uuid, PK) - Unique chunk identifier
- `documentId` (text, FK) - Reference to parent document
- `text` (text) - Chunk content
- `metadata` (text) - JSON string for chunk metadata
- `createdAt` (timestamp) - Chunk creation time

#### `embeddings`
- `id` (uuid, PK) - Unique embedding identifier
- `chunkId` (text, FK) - Reference to parent chunk
- `vector` (vector(768)) - Google Gemini embedding vector
- `createdAt` (timestamp) - Embedding creation time

### Indexes
- Vector similarity search index on embeddings.vector
- Foreign key indexes for performance
- User-specific document indexes

## 🔧 Services

### Embedding Service (`embedding-service/`)

FastAPI service for generating embeddings using Google's Gemini embedding-001 model. Built with Python 3.12 compatibility.

**Endpoints:**
- `GET /health` - Health check
- `POST /embed` - Generate single embedding
- `POST /embed/batch` - Generate batch embeddings

**Features:**
- Google Gemini API integration
- Batch processing for efficiency
- Error handling and logging
- Health monitoring

### RAG Service (`src/lib/server/rag.ts`)

Core business logic for document processing and retrieval.

**Key Methods:**
- `ingestDocument()` - Process and store documents
- `searchChunks()` - Vector similarity search
- `getUserDocuments()` - List user documents
- `deleteDocument()` - Remove documents
- `getDocumentStats()` - User statistics
- `searchDocuments()` - Text search in document names

**Features:**
- Intelligent text chunking (500-1000 tokens with overlap)
- Batch embedding generation
- Vector similarity search using pgvector
- User-specific document isolation
- Metadata tracking

## 🌐 API Endpoints

### Document Management
- `GET /api/documents` - List user documents
- `POST /api/documents` - Upload and ingest document
- `DELETE /api/documents/[id]` - Delete document
- `GET /api/documents/stats` - Get document statistics
- `POST /api/documents/search` - Search documents by name

### RAG Operations
- `POST /api/ingest` - Direct document ingestion
- `POST /api/query` - RAG retrieval with similarity search
- `POST /api/rag/search` - Alternative search endpoint

### Chat Integration
- RAG results automatically integrated into chat responses
- Context from relevant documents included in AI prompts
- Citation tracking for transparency

## 🚀 Setup Instructions

### 0. Python Requirements

This system is built with Python 3.12 compatibility. The embedding service uses:
- Python 3.12
- FastAPI 0.115.6
- Google Generative AI 0.8.3
- Pydantic 2.10.4
- Uvicorn 0.32.1

### 1. Environment Variables

Create a `.env` file with the following variables:

```env
# Google Gemini API Configuration (for embeddings)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5433/auth_chat_db

# Embedding Service Configuration
EMBEDDING_API_URL=http://localhost:8001

# Other required variables...
```

### 2. Start Services

#### Option A: Using Docker (Recommended)
```bash
# Start database and embedding service
docker-compose up -d

# Install dependencies
pnpm install

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

#### Option B: Local Python Setup
```bash
# Navigate to embedding service directory
cd embedding-service

# Install Python dependencies
python setup.py

# Or manually install:
pip install -r requirements.txt

# Start embedding service locally
python main.py

# In another terminal, start the main app
pnpm install
pnpm db:push
pnpm dev
```

### 3. Verify Setup

```bash
# Test embedding service
curl http://localhost:8001/health

# Test RAG endpoints (requires authentication)
node scripts/test_rag.mjs
```

## 📝 Usage Examples

### Document Ingestion

```javascript
// Upload document via form
const formData = new FormData();
formData.append('file', file);
formData.append('name', 'My Document');

const response = await fetch('/api/ingest', {
  method: 'POST',
  body: formData
});
```

### RAG Query

```javascript
// Query RAG system
const response = await fetch('/api/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'What is machine learning?',
    limit: 5
  })
});

const { results } = await response.json();
// results contains relevant document chunks with similarity scores
```

### Chat Integration

The RAG system is automatically integrated into chat responses. When a user asks a question, the system:

1. Generates embedding for the query
2. Searches for similar document chunks
3. Includes relevant context in the AI prompt
4. Returns response with citations

## 🔍 Vector Similarity Search

The system uses pgvector's cosine distance operator (`<=>`) for similarity search:

```sql
-- Example query
SELECT 
  chunks.text,
  documents.name,
  1 - (embeddings.vector <=> query_embedding) as similarity
FROM embeddings
JOIN chunks ON embeddings.chunk_id = chunks.id
JOIN documents ON chunks.document_id = documents.id
WHERE documents.user_id = ?
ORDER BY embeddings.vector <=> query_embedding
LIMIT 5;
```

## 📈 Performance Optimizations

1. **Batch Processing** - Embeddings generated in batches for efficiency
2. **Vector Indexes** - pgvector indexes for fast similarity search
3. **Chunking Strategy** - Optimal chunk sizes with overlap
4. **User Isolation** - Queries scoped to user's documents
5. **Caching** - Embedding service can be cached for repeated queries

## 🔒 Security Features

1. **User Isolation** - Users can only access their own documents
2. **Authentication Required** - All endpoints require valid session
3. **Input Validation** - File types and sizes validated
4. **Error Handling** - Graceful error handling without data leakage

## 🧪 Testing

Run the test script to verify functionality:

```bash
node scripts/test_rag.mjs
```

The script tests:
- Embedding service connectivity
- API endpoint availability
- Database connection
- Basic functionality verification

## 🔄 Integration with Existing Features

The RAG system integrates seamlessly with existing features:

- **Authentication** - Uses existing auth system
- **Chat System** - Enhances chat with document context
- **User Management** - Respects user permissions
- **File Upload** - Extends existing upload functionality

## 📚 File Support

Currently supports:
- **Text files** (.txt) - Full text processing
- **Plain text content** - Direct text ingestion

Future enhancements could include:
- PDF processing
- Word documents
- HTML content
- Markdown files

## 🎯 Best Practices

1. **Chunk Size** - 500-1000 tokens optimal for retrieval
2. **Overlap** - 200 token overlap prevents context loss
3. **Metadata** - Store relevant metadata for better organization
4. **Cleanup** - Regular cleanup of unused embeddings
5. **Monitoring** - Monitor embedding service health

## 🚨 Troubleshooting

### Common Issues

1. **Embedding Service Not Starting**
   - Check GOOGLE_GENERATIVE_AI_API_KEY environment variable
   - Verify Docker container is running
   - Check logs: `docker-compose logs embedding-service`

2. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check if pgvector extension is enabled
   - Ensure database is running: `docker-compose ps`

3. **Vector Search Not Working**
   - Verify pgvector extension is installed
   - Check vector index creation
   - Validate embedding dimensions (should be 768)

### Debug Commands

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Test database connection
psql postgresql://postgres:password@localhost:5433/auth_chat_db

# Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';
```

## 📈 Monitoring

Monitor the following metrics:
- Embedding generation latency
- Vector search performance
- Document ingestion success rate
- User document counts
- API endpoint response times

## 🔮 Future Enhancements

Potential improvements:
- Multi-modal embeddings (images, audio)
- Advanced chunking strategies
- Semantic search improvements
- Real-time document updates
- Collaborative document sharing
- Advanced analytics and insights
