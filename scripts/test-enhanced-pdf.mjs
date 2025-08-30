#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test the enhanced PDF processor
async function testEnhancedPDFProcessor() {
  try {
    console.log('🧪 Testing Enhanced PDF Processor...');
    
    // Import the PDF processor
    const { pdfProcessor } = await import('../src/lib/pdf-processor.ts');
    
    console.log('✅ PDF processor imported successfully');
    
    // Test with the sample PDF
    const testPdfPath = path.join(__dirname, '../test/data/05-versions-space.pdf');
    
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
    console.log('🔄 Processing PDF with enhanced processor...');
    const result = await pdfProcessor.extractTextFromPDF(buffer);
    
    console.log('✅ PDF processing successful!');
    console.log(`📄 Method used: ${result.method}`);
    console.log(`📄 Pages processed: ${result.pages}`);
    console.log(`📄 Text length: ${result.text.length} characters`);
    console.log(`📄 Text preview: ${result.text.substring(0, 200)}...`);
    
    // Get processor stats
    const stats = await pdfProcessor.getStats();
    console.log(`📊 Processor stats: ${stats.tempFiles} temp files in ${stats.tempDir}`);
    
  } catch (error) {
    console.error('❌ Enhanced PDF processor test failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testEnhancedPDFProcessor();
