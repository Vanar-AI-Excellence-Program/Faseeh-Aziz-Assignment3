#!/usr/bin/env node

/**
 * Test script for enhanced PDF extraction
 * This script tests the enhanced PDF processor with a specific PDF file
 */

import fs from 'fs/promises';
import path from 'path';

async function testEnhancedPDFExtraction() {
  try {
    console.log('🔍 Testing Enhanced PDF Extraction...\n');

    // Import the enhanced PDF processor
    const { enhancedPDFProcessor } = await import('../src/lib/pdf-processor-enhanced.ts');

    // Test with the interns_overleaf.pdf file
    const pdfPath = path.join(process.cwd(), 'temp', 'test_1756591921981.pdf');
    
    // Check if the file exists
    try {
      await fs.access(pdfPath);
      console.log(`📄 Found PDF file: ${pdfPath}`);
    } catch (error) {
      console.log('❌ PDF file not found. Please place your PDF file in the temp directory.');
      console.log('Expected path:', pdfPath);
      return;
    }

    // Read the PDF file
    console.log('📖 Reading PDF file...');
    const buffer = await fs.readFile(pdfPath);
    console.log(`📊 File size: ${buffer.length} bytes`);

    // Test PDF header
    const header = buffer.toString('ascii', 0, 4);
    console.log(`📋 PDF header: ${header}`);

    if (!header.startsWith('%PDF')) {
      console.log('❌ File does not appear to be a valid PDF');
      return;
    }

    // Extract text using enhanced processor
    console.log('\n🔄 Starting enhanced PDF extraction...');
    const startTime = Date.now();
    
    const result = await enhancedPDFProcessor.extractTextFromPDF(buffer);
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    console.log('\n✅ PDF Extraction Results:');
    console.log('========================');
    console.log(`Method used: ${result.method}`);
    console.log(`Pages processed: ${result.pages}`);
    console.log(`Processing time: ${processingTime}ms`);
    console.log(`Confidence: ${result.confidence || 'N/A'}`);
    console.log(`Text length: ${result.text.length} characters`);
    
    if (result.metadata) {
      console.log('\n📋 Metadata:');
      console.log(JSON.stringify(result.metadata, null, 2));
    }

    console.log('\n📝 Extracted Text Preview:');
    console.log('========================');
    
    // Show first 500 characters of extracted text
    const preview = result.text.length > 500 
      ? result.text.substring(0, 500) + '...'
      : result.text;
    
    console.log(preview);

    // Save full extracted text to file for inspection
    const outputPath = path.join(process.cwd(), 'temp', 'extracted_text.txt');
    await fs.writeFile(outputPath, result.text);
    console.log(`\n💾 Full extracted text saved to: ${outputPath}`);

    // Get processor stats
    const stats = await enhancedPDFProcessor.getStats();
    console.log(`\n📊 Processor stats: ${stats.tempFiles} temp files in ${stats.tempDir}`);

  } catch (error) {
    console.error('\n❌ Error during PDF extraction:', error);
    
    // Provide helpful error information
    if (error.message.includes('pdf-parse')) {
      console.log('\n💡 Suggestion: Try installing pdf-parse: npm install pdf-parse');
    } else if (error.message.includes('pdf2pic')) {
      console.log('\n💡 Suggestion: Try installing pdf2pic: npm install pdf2pic');
    } else if (error.message.includes('tesseract')) {
      console.log('\n💡 Suggestion: Try installing tesseract.js: npm install tesseract.js');
    } else if (error.message.includes('pdf-lib')) {
      console.log('\n💡 Suggestion: Try installing pdf-lib: npm install pdf-lib');
    }
  }
}

// Run the test
testEnhancedPDFExtraction();
