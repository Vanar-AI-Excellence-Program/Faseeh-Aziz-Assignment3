import { db } from '../src/lib/server/db/index.ts';
import { documents, chunks, embeddings } from '../src/lib/server/db/schema.ts';
import { eq, sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

// Extract text from PDF using PDF.js
async function extractTextFromPDF(buffer) {
  try {
    // Import PDF.js dynamically
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set up the worker
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry');
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    
    let extractedText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items from the page
      const pageText = textContent.items
        .map((item) => item.str)
        .join(' ');
      
      extractedText += pageText + '\n';
    }
    
    // Clean up the extracted text
    const cleanedText = extractedText
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
      .trim();
    
    if (cleanedText.length === 0) {
      throw new Error('No text content found in PDF');
    }
    
    console.log(`📄 Extracted ${cleanedText.length} characters from PDF`);
    return cleanedText;
    
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

async function reprocessPDFs() {
  try {
    console.log('🔄 Starting PDF reprocessing...');
    
    // Get all PDF documents
    const pdfDocuments = await db.select().from(documents).where(eq(documents.metadata, sql`metadata->>'isPDF' = 'true'`));
    
    console.log(`📚 Found ${pdfDocuments.length} PDF documents to reprocess`);
    
    for (const doc of pdfDocuments) {
      console.log(`\n📄 Processing: ${doc.name} (ID: ${doc.id})`);
      
      // Check if this document has the old fallback text
      const docChunks = await db.select().from(chunks).where(eq(chunks.documentId, doc.id));
      
      const hasOldContent = docChunks.some(chunk => 
        chunk.content.includes('PDF content extracted') || 
        chunk.content.includes('Please note that complex PDF formatting may not be preserved')
      );
      
      if (!hasOldContent) {
        console.log(`✅ Document ${doc.name} already has proper content, skipping`);
        continue;
      }
      
      console.log(`🔄 Document ${doc.name} has old content, needs reprocessing`);
      
      // Note: We can't reprocess the original file since it's not stored
      // But we can update the chunks to indicate they need to be re-uploaded
      console.log(`⚠️ Cannot reprocess ${doc.name} - original file not available`);
      console.log(`💡 Please re-upload ${doc.name} to get proper text extraction`);
    }
    
    console.log('\n✅ PDF reprocessing check completed');
    console.log('💡 To fix PDF content, please re-upload the PDF files');
    
  } catch (error) {
    console.error('❌ Error during PDF reprocessing:', error);
  }
}

// Run the reprocessing
reprocessPDFs().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
