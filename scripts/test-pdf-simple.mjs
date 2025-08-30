#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test PDF processing libraries directly
async function testPDFLibraries() {
  try {
    console.log('🧪 Testing PDF Processing Libraries...');
    
    // Test with the sample PDF
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
    
    // Test 1: pdf-parse
    console.log('\n🔄 Testing pdf-parse...');
    try {
      const pdfParse = (await import('pdf-parse')).default;
      
      const data = await pdfParse(buffer);
      console.log('✅ pdf-parse result:', {
        textLength: data.text?.length || 0,
        pages: data.numpages,
        info: data.info,
        preview: data.text?.substring(0, 100) + '...'
      });
      
    } catch (error) {
      console.error('❌ pdf-parse failed:', error.message);
    }
    
    // Test 2: pdf-extract
    console.log('\n🔄 Testing pdf-extract...');
    try {
      const pdfExtract = (await import('pdf-extract')).default;
      
      const tempDir = './temp';
      await fs.mkdir(tempDir, { recursive: true });
      
      const tempFilePath = path.join(tempDir, `test_${Date.now()}.pdf`);
      await fs.writeFile(tempFilePath, buffer);
      
      const options = {
        type: 'text',
        version: 'v2.0.550'
      };

      const data = await pdfExtract(tempFilePath, options);
      console.log('✅ pdf-extract result:', {
        textLength: data.text?.length || 0,
        pages: data.pages,
        preview: data.text?.substring(0, 100) + '...'
      });
      
      // Clean up
      await fs.unlink(tempFilePath);
      
    } catch (error) {
      console.error('❌ pdf-extract failed:', error.message);
    }
    
    // Test 3: pdf-lib validation
    console.log('\n🔄 Testing pdf-lib...');
    try {
      const { PDFDocument } = await import('pdf-lib');
      
      const pdfDoc = await PDFDocument.load(buffer);
      const pageCount = pdfDoc.getPageCount();
      
      console.log('✅ pdf-lib validation successful:', {
        pageCount,
        pages: pdfDoc.getPages().map((page, i) => {
          const { width, height } = page.getSize();
          return { page: i + 1, width, height };
        })
      });
      
    } catch (error) {
      console.error('❌ pdf-lib failed:', error.message);
    }
    
    // Test 4: Tesseract.js (OCR)
    console.log('\n🔄 Testing Tesseract.js...');
    try {
      const { createWorker } = await import('tesseract.js');
      
      // Create a simple test image (we'll skip PDF conversion for now)
      console.log('⚠️ Tesseract.js requires image input, skipping for now');
      
    } catch (error) {
      console.error('❌ Tesseract.js failed:', error.message);
    }
    
    console.log('\n✅ PDF library testing completed!');
    
  } catch (error) {
    console.error('❌ PDF library test failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testPDFLibraries();
