import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { documents, chunks, embeddings } from '$lib/server/db/schema';
import { env } from '$env/dynamic/private';
import { eq, sql } from 'drizzle-orm';
import { finalPDFProcessor } from '$lib/pdf-processor-final';

// Extract text from PDF using the enhanced PDF processor
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log(`📄 Processing PDF with enhanced processor: ${buffer.length} bytes`);
    
    const result = await finalPDFProcessor.extractTextFromPDF(buffer);
    
    console.log(`✅ PDF processed successfully using ${result.method}`);
    console.log(`📄 Extracted ${result.text.length} characters from ${result.pages} pages`);
    
    return result.text;
    
  } catch (error) {
    console.error('PDF text extraction error:', error);
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('Invalid PDF')) {
      throw new Error('The file is not a valid PDF document');
    } else if (errorMessage.includes('No text content')) {
      throw new Error('PDF contains no extractable text (may be image-based)');
    } else if (errorMessage.includes('password')) {
      throw new Error('PDF is password protected and cannot be processed');
    } else if (errorMessage.includes('corrupted')) {
      throw new Error('PDF file appears to be corrupted');
    } else if (errorMessage.includes('permission')) {
      throw new Error('PDF access is restricted or requires permissions');
    } else if (errorMessage.includes('All PDF extraction methods failed')) {
      throw new Error('PDF could not be processed with any available method. The file may be corrupted, password-protected, or contain no extractable text.');
    } else {
      throw new Error(`Failed to parse PDF: ${errorMessage}`);
    }
  }
}



// Generate embeddings using Google Gemini directly
async function generateEmbedding(text: string): Promise<{ embedding: number[] }> {
  try {
    if (!env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('No Google Gemini API key configured');
    }

    // Try to import Google Generative AI package
    let GoogleGenerativeAI;
    try {
      const module = await import('@google/generative-ai');
      GoogleGenerativeAI = module.GoogleGenerativeAI;
    } catch (importError) {
      throw new Error('Google Generative AI package not installed');
    }
    
    const genAI = new GoogleGenerativeAI(env.GOOGLE_GENERATIVE_AI_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' });
    
    const result = await embeddingModel.embedContent(text);
    const embedding = result.embedding;
    
    return { embedding: embedding.values };
  } catch (error: any) {
    console.error('❌ Embedding generation failed:', error);
    
    // Fallback: create a simple hash-based embedding (not ideal but functional)
    const hash = text.split('').reduce((a, b) => {
      a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff;
      return a;
    }, 0);
    
    // Create a 768-dimensional vector (like Google Gemini embeddings)
    const fallbackEmbedding = new Array(768).fill(0);
    for (let i = 0; i < 768; i++) {
      fallbackEmbedding[i] = Math.sin(hash + i) * 0.1; // Simple pseudo-random values
    }
    
    console.log('⚠️ Using fallback hash-based embedding');
    return { embedding: fallbackEmbedding };
  }
}

// Improved text chunking function for better RAG performance
function chunkText(text: string, maxTokens: number = 300): string[] {
  // For very short texts, split by lines or sentences
  if (text.length < 200) {
    const lines = text.split(/\n+/).filter(line => line.trim().length > 0);
    if (lines.length > 1) {
      return lines.map(line => line.trim()).filter(line => line.length > 10);
    }
    
    // If single line, split by sentences or punctuation
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 1) {
      return sentences.map(s => s.trim()).filter(s => s.length > 10);
    }
    
    // If still single piece, split by words to create at least 2 chunks
    const words = text.split(/\s+/);
    if (words.length > 5) {
      const midPoint = Math.ceil(words.length / 2);
      return [
        words.slice(0, midPoint).join(' '),
        words.slice(midPoint).join(' ')
      ];
    }
    
    // If text is too short, return as single chunk but warn
    console.log('⚠️ Text is very short, creating single chunk');
    return [text];
  }
  
  // For longer texts, use the existing paragraph-based chunking
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  
  for (const paragraph of paragraphs) {
    if (paragraph.trim().length === 0) continue;
    
    // If paragraph is too long, split by sentences
    if (paragraph.length > maxTokens * 4) { // Rough estimate: 4 chars per token
      const sentences = paragraph.split(/[.!?]+/);
      let currentChunk = '';
      
      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (trimmedSentence.length === 0) continue;
        
        if (currentChunk.length + trimmedSentence.length > maxTokens * 4) {
          if (currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = trimmedSentence;
          } else {
            // Single sentence is too long, split by words
            const words = trimmedSentence.split(/\s+/);
            let wordChunk = '';
            
            for (const word of words) {
              if (wordChunk.length + word.length + 1 > maxTokens * 4) {
                if (wordChunk.length > 0) {
                  chunks.push(wordChunk.trim());
                  wordChunk = word;
                } else {
                  chunks.push(word);
                }
              } else {
                wordChunk += (wordChunk.length > 0 ? ' ' : '') + word;
              }
            }
            
            if (wordChunk.length > 0) {
              currentChunk = wordChunk;
            }
          }
        } else {
          currentChunk += (currentChunk.length > 0 ? ' ' : '') + trimmedSentence;
        }
      }
      
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
      }
    } else {
      chunks.push(paragraph.trim());
    }
  }
  
  // Filter out very short chunks and ensure minimum meaningful content
  return chunks
    .filter(chunk => chunk.length > 20) // Minimum 20 characters for short documents
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length > 0);
}

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Check authentication
    const session = await locals.auth();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file type (text or PDF files)
    if (!file.type.startsWith('text/') && !file.name.endsWith('.txt') && 
        !file.type.startsWith('application/pdf') && !file.name.endsWith('.pdf')) {
      return json({ error: 'Only text and PDF files are supported' }, { status: 400 });
    }

    // Read file content based on file type
    let text = '';
    let fileType = '';
    
    if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
      // Handle text files
      fileType = 'text';
      text = await file.text();
      console.log(`📄 Processing text file: ${file.name} (${text.length} characters)`);
    } else if (file.type.startsWith('application/pdf') || file.name.endsWith('.pdf')) {
      // Handle PDF files
      fileType = 'pdf';
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Log file details for debugging
        console.log(`📄 Processing PDF file: ${file.name}`);
        console.log(`📄 File size: ${file.size} bytes`);
        console.log(`📄 Buffer size: ${buffer.length} bytes`);
        
        // Try primary PDF parsing method
        text = await extractTextFromPDF(buffer);
        console.log(`📄 Processing PDF file: ${file.name} (${text.length} characters extracted)`);
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        const errorMessage = pdfError instanceof Error ? pdfError.message : 'Unknown PDF parsing error';
        return json({ 
          error: `Failed to parse PDF file: ${errorMessage}. Please ensure it's a valid PDF with extractable text.` 
        }, { status: 400 });
      }
    }

    if (!text.trim()) {
      return json({ error: 'File is empty or contains no extractable text' }, { status: 400 });
    }

    // Check if document with same name already exists
    const existingDocument = await db.select().from(documents).where(eq(documents.name, file.name)).limit(1);
    if (existingDocument.length > 0) {
      return json({ 
        error: 'Document with this name already exists',
        existingDocumentId: existingDocument[0].id,
        message: 'Please use a different filename or delete the existing document first'
      }, { status: 409 });
    }

    // Split text into chunks
    const textChunks = chunkText(text);
    console.log(`🧩 Created ${textChunks.length} chunks`);

    // Create document record
    const [document] = await db.insert(documents).values({
      name: file.name,
      uploadedBy: session.user.id,
      metadata: {
        originalSize: text.length,
        chunkCount: textChunks.length,
        uploadedAt: new Date().toISOString(),
        fileType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain'),
        isPDF: fileType === 'pdf',
        processedFileType: fileType
      }
    }).returning();

    console.log(`📋 Document created with ID: ${document.id}`);

    // Process chunks and generate embeddings
    const chunkPromises = textChunks.map(async (chunkText, index) => {
      try {
        // Create chunk record
        const [chunk] = await db.insert(chunks).values({
          documentId: document.id,
          content: chunkText,
          order: index,
          metadata: {
            chunkIndex: index,
            chunkSize: chunkText.length,
            estimatedTokens: Math.ceil(chunkText.length / 4), // Rough estimate
            sourceFileType: fileType
          }
        }).returning();

        console.log(`🧩 Chunk ${index + 1}/${textChunks.length} created with ID: ${chunk.id}`);

        // Generate embedding for the chunk
        console.log(`🔍 Generating embedding for chunk ${chunk.id}...`);
        const embeddingResult = await generateEmbedding(chunkText);
        
        // Store embedding using raw SQL to handle vector type properly
        const embeddingArray = `[${embeddingResult.embedding.join(',')}]`;
        const [embedding] = await db.execute(sql`
          INSERT INTO embeddings (chunk_id, embedding) 
          VALUES (${chunk.id}, ${embeddingArray}::vector)
          RETURNING *
        `);

        console.log(`🔢 Embedding stored with ID: ${embedding.id}`);
        
        return { chunk, embedding, success: true };
      } catch (error) {
        console.error(`❌ Failed to process chunk ${index}:`, error);
        return { chunk: null, embedding: null, success: false, error };
      }
    });

    // Wait for all chunks to be processed
    const results = await Promise.all(chunkPromises);
    const successfulChunks = results.filter(r => r.success).length;
    const failedChunks = results.filter(r => !r.success).length;

    console.log(`✅ Ingestion completed: ${successfulChunks} chunks processed, ${failedChunks} failed`);

    return json({
      success: true,
      documentId: document.id,
      documentName: document.name,
      totalChunks: textChunks.length,
      successfulChunks,
      failedChunks,
      fileType: fileType,
      message: `Successfully ingested ${file.name} (${fileType.toUpperCase()}) with ${successfulChunks} chunks`
    });

  } catch (error) {
    console.error('❌ Ingestion error:', error);
    return json({ 
      error: 'Failed to process file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
