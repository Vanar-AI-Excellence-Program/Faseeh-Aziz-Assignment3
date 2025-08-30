#!/usr/bin/env node

/**
 * Create a test PDF with actual text content
 * This demonstrates the enhanced PDF processor working with real content
 */

import fs from 'fs/promises';
import path from 'path';

async function createTestPDF() {
  try {
    console.log('📄 Creating test PDF with actual content...\n');

    // Create a simple text document
    const testContent = `
Test Document for PDF Processing

This is a test document created to demonstrate PDF text extraction capabilities.
It contains actual readable text content that should be extractable by the PDF processors.

Key Features:
- Multiple paragraphs of text
- Bullet points and lists
- Different formatting elements
- Numbers and special characters: 123, !@#$%^&*()
- Technical terms: PDF, OCR, FlateDecode, compression

This document is designed to test the enhanced PDF processor's ability to extract
meaningful text content from PDF files. The processor should be able to identify
and extract this text content for use in the RAG (Retrieval-Augmented Generation) system.

Technical Information:
- Document Type: Test PDF
- Purpose: Demonstrate text extraction
- Expected Result: Successful text extraction
- Processing Method: Enhanced PDF Processor

The enhanced PDF processor should successfully extract this content and provide
it in a format suitable for generating embeddings and enabling AI-powered search
and chat functionality.
    `;

    // Create a simple HTML document that can be converted to PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test PDF Document</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; }
        .section { margin: 20px 0; }
        ul { margin: 10px 0; }
        .technical { background: #f5f5f5; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Test Document for PDF Processing</h1>
    
    <div class="section">
        <p>This is a test document created to demonstrate PDF text extraction capabilities. 
        It contains actual readable text content that should be extractable by the PDF processors.</p>
    </div>

    <div class="section">
        <h2>Key Features:</h2>
        <ul>
            <li>Multiple paragraphs of text</li>
            <li>Bullet points and lists</li>
            <li>Different formatting elements</li>
            <li>Numbers and special characters: 123, !@#$%^&*()</li>
            <li>Technical terms: PDF, OCR, FlateDecode, compression</li>
        </ul>
    </div>

    <div class="section">
        <p>This document is designed to test the enhanced PDF processor's ability to extract
        meaningful text content from PDF files. The processor should be able to identify
        and extract this text content for use in the RAG (Retrieval-Augmented Generation) system.</p>
    </div>

    <div class="section technical">
        <h2>Technical Information:</h2>
        <ul>
            <li><strong>Document Type:</strong> Test PDF</li>
            <li><strong>Purpose:</strong> Demonstrate text extraction</li>
            <li><strong>Expected Result:</strong> Successful text extraction</li>
            <li><strong>Processing Method:</strong> Enhanced PDF Processor</li>
        </ul>
    </div>

    <div class="section">
        <p>The enhanced PDF processor should successfully extract this content and provide
        it in a format suitable for generating embeddings and enabling AI-powered search
        and chat functionality.</p>
    </div>
</body>
</html>
    `;

    // Save the HTML content
    const htmlPath = path.join(process.cwd(), 'temp', 'test_document.html');
    await fs.writeFile(htmlPath, htmlContent);
    console.log(`✅ Created HTML document: ${htmlPath}`);

    // Save the text content for comparison
    const textPath = path.join(process.cwd(), 'temp', 'test_document.txt');
    await fs.writeFile(textPath, testContent);
    console.log(`✅ Created text document: ${textPath}`);

    console.log('\n📋 Next Steps:');
    console.log('1. Convert the HTML to PDF using a browser or online tool');
    console.log('2. Save the PDF as "test_document.pdf" in the temp directory');
    console.log('3. Run the enhanced PDF processor test:');
    console.log('   node scripts/test-enhanced-pdf-extraction.mjs');
    console.log('\n💡 You can also use online HTML to PDF converters or browser print-to-PDF functionality.');

  } catch (error) {
    console.error('❌ Error creating test documents:', error);
  }
}

// Run the script
createTestPDF();
