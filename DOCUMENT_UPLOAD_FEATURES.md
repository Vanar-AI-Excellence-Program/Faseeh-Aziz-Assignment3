# Document Upload & RAG Features

## Overview

This document describes the new document upload and RAG (Retrieval-Augmented Generation) features added to the chat interface.

## Features Added

### 1. Upload Button on Chat Page

- **Location**: Beside the send button in the chat interface
- **Functionality**: Allows uploading .txt files directly from the chat page
- **Styling**: Matches the existing chat UI theme with blue upload icon
- **File Support**: Currently supports .txt files only
- **Size Limit**: 10MB maximum file size

### 2. Document Processing

- **Automatic Processing**: Uploaded documents are automatically processed into the RAG pipeline
- **Chunking**: Documents are split into intelligent chunks (~500 tokens each)
- **Embeddings**: Each chunk gets converted to vector embeddings using Google Gemini
- **Storage**: Documents are stored in the database with proper indexing

### 3. RAG-Enhanced Chat

- **Smart Context**: AI responses use relevant document context when available
- **Fallback System**: If no relevant context is found, falls back to regular chat
- **Context Control**: Users can say "answer me out of that context" to skip RAG
- **Citation Tracking**: AI cites which documents were used for context

### 4. UI Elements

#### Upload Progress
- Real-time upload progress indicators
- Success/failure messages
- File validation (type and size)

#### Document List
- Shows all uploaded documents for the current session
- Displays upload time
- Remove button for each document
- Visual indicator when RAG is enabled

#### Integration
- Link to full document management page (/ingest)
- Seamless integration with existing chat functionality

## Technical Implementation

### New API Endpoint

**`/api/chat-with-rag`**
- Combines regular chat and RAG functionality
- Automatically detects when to use RAG
- Handles both streaming and non-streaming responses
- Saves messages to database with proper citations

### Database Integration

- Uses existing `documents`, `chunks`, and `embeddings` tables
- Links documents to conversations via `conversationDocuments` table
- Stores chunk citations in message metadata

### Vector Search

- Uses pgvector extension for similarity search
- Google Gemini embeddings (768 dimensions)
- Configurable similarity threshold (0.8 distance)
- Returns top 5 most relevant chunks

## Usage Instructions

### Uploading Documents

1. Click the upload button (cloud icon) beside the send button
2. Select a .txt file (max 10MB)
3. Wait for processing to complete
4. Document appears in the uploaded documents list

### Using RAG

1. Upload one or more documents
2. Ask questions naturally - AI will automatically use document context
3. AI will cite which documents were used
4. Say "answer me out of that context" to skip document context

### Managing Documents

- Remove documents from the chat session using the X button
- Access full document management at `/ingest`
- Documents persist across chat sessions

## Configuration

### Environment Variables Required

- `GOOGLE_GENERATIVE_AI_API_KEY`: For embedding generation
- `OPENAI_API_KEY`: For text generation (fallback)
- Database with pgvector extension enabled

### File Support

Currently supported:
- `.txt` files
- Text content only
- Maximum 10MB per file

Future enhancements:
- PDF support
- Word documents
- Larger file sizes
- Multiple file uploads

## Error Handling

- File type validation
- File size limits
- Upload progress tracking
- Graceful fallback when RAG fails
- Clear error messages to users

## Performance Considerations

- Embeddings are generated asynchronously
- Vector search is optimized with proper indexing
- Chunking reduces memory usage
- Fallback to regular chat when RAG is unavailable

## Security

- File upload validation
- Authentication required for all operations
- User-specific document isolation
- No file execution or code injection

## Future Enhancements

1. **Multi-format Support**: PDF, DOCX, etc.
2. **Batch Upload**: Multiple files at once
3. **Document Categories**: Organize documents by type/topic
4. **Advanced Search**: Search within uploaded documents
5. **Document Versioning**: Track document updates
6. **Collaborative Features**: Share documents between users
7. **Analytics**: Track document usage and effectiveness
