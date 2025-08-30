#!/usr/bin/env node

/**
 * Test script for robust PDF extraction
 * This script tests the robust PDF processor with pdf-lib and pdf-extraction
 */

import fs from 'fs/promises';
import path from 'path';

async function testRobustPDFExtraction() {
  try {
    console.log('🔍 Testing Robust PDF Extraction...\n');

    // Import the robust PDF processor
    const { robustPDFProcessor } = await import('../src/lib/pdf-processor-robust.ts');

    // Test with the Risk_management.pdf file
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

    // Extract text using robust processor
    console.log('\n🔄 Starting robust PDF extraction...');
    const startTime = Date.now();
    
    const result = await robustPDFProcessor.extractTextFromPDF(buffer);
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    console.log('\n✅ Robust PDF Extraction Results:');
    console.log('================================');
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
    console.log('==========================');
    
    // Show first 1000 characters of extracted text
    const preview = result.text.length > 1000 
      ? result.text.substring(0, 1000) + '...'
      : result.text;
    
    console.log(preview);

    // Save full extracted text to file for inspection
    const outputPath = path.join(process.cwd(), 'temp', 'robust_extracted_text.txt');
    await fs.writeFile(outputPath, result.text);
    console.log(`\n💾 Full extracted text saved to: ${outputPath}`);

    // Get processor stats
    const stats = await robustPDFProcessor.getStats();
    console.log(`\n📊 Processor stats: ${stats.tempFiles} temp files in ${stats.tempDir}`);

    // Analysis of the result
    console.log('\n🔍 Analysis:');
    if (result.confidence && result.confidence > 0.8) {
      console.log('✅ High confidence extraction - likely successful');
    } else if (result.confidence && result.confidence > 0.5) {
      console.log('⚠️ Medium confidence extraction - some content extracted');
    } else {
      console.log('❌ Low confidence extraction - limited content extracted');
    }

    if (result.text.length > 500) {
      console.log('✅ Substantial text content extracted');
    } else if (result.text.length > 100) {
      console.log('⚠️ Moderate text content extracted');
    } else {
      console.log('❌ Limited text content extracted');
    }

  } catch (error) {
    console.error('\n❌ Error during robust PDF extraction:', error);
    
    // Provide helpful error information
    if (error.message.includes('pdf-extraction')) {
      console.log('\n💡 Suggestion: Try installing pdf-extraction: npm install pdf-extraction');
    } else if (error.message.includes('pdf-lib')) {
      console.log('\n💡 Suggestion: Try installing pdf-lib: npm install pdf-lib');
    } else if (error.message.includes('stream')) {
      console.log('\n💡 This PDF may have corrupted or unsupported stream compression.');
    }
  }
}

// Run the test
testRobustPDFExtraction();
