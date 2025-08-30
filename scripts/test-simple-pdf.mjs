#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test the simplified PDF processor
async function testSimplePDFProcessor() {
  try {
    console.log('🧪 Testing Simplified PDF Processor...');
    
    // Import the simplified PDF processor
    const { simplePDFProcessor } = await import('../src/lib/pdf-processor-simple.ts');
    
    console.log('✅ Simplified PDF processor imported successfully');
    
    // Test with the generated test PDF
    const testPdfPath = path.join(__dirname, '../test/data/test-document.pdf');
    
    console.log(`📄 Testing with file: ${testPdfPath}`);
    
    // Check if file exists
    try {
      await fs.access(testPdfPath);
      console.log('✅ Test PDF file found');
    } catch (error) {
      console.error('❌ Test PDF file not found:', testPdfPath);
      return;
    }
    
    // Read the PDF file
    const buffer = await fs.readFile(testPdfPath);
    console.log(`📄 PDF file size: ${buffer.length} bytes`);
    
    // Test PDF header
    const header = buffer.toString('ascii', 0, 4);
    console.log(`📄 PDF header: ${header}`);
    
    if (!header.startsWith('%PDF')) {
      console.error('❌ Invalid PDF header');
      return;
    }
    
    // Process the PDF
    console.log('🔄 Processing PDF with simplified processor...');
    const result = await simplePDFProcessor.extractTextFromPDF(buffer);
    
    console.log('✅ PDF processing successful!');
    console.log(`📄 Method used: ${result.method}`);
    console.log(`📄 Pages processed: ${result.pages}`);
    console.log(`📄 Text length: ${result.text.length} characters`);
    console.log(`📄 Text preview: ${result.text.substring(0, 200)}...`);
    
    if (result.metadata) {
      console.log(`📄 Metadata:`, result.metadata);
    }
    
    // Get processor stats
    const stats = await simplePDFProcessor.getStats();
    console.log(`📊 Processor stats: ${stats.tempFiles} temp files in ${stats.tempDir}`);
    
  } catch (error) {
    console.error('❌ Simplified PDF processor test failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testSimplePDFProcessor();
