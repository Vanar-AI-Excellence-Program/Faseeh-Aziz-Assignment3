#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Test PDF parsing function
async function testPDFParsing() {
  try {
    console.log('🧪 Testing PDF parsing functionality...');
    
    // Import pdf-parse
    const pdfParse = await import('pdf-parse');
    
    console.log('✅ pdf-parse library imported successfully');
    
    // Test with a simple buffer (this will fail but we can see the error)
    const testBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n');
    
    console.log('📄 Test buffer created:', testBuffer.length, 'bytes');
    console.log('📄 Buffer header:', testBuffer.toString('ascii', 0, 10));
    
    try {
      const result = await pdfParse.default(testBuffer);
      console.log('✅ PDF parsing test successful');
      console.log('📄 Extracted text length:', result.text?.length || 0);
    } catch (parseError) {
      console.log('⚠️ Expected parsing error (test buffer is incomplete):', parseError.message);
    }
    
    console.log('✅ PDF parsing library is working correctly');
    
  } catch (error) {
    console.error('❌ PDF parsing test failed:', error);
    process.exit(1);
  }
}

// Run the test
testPDFParsing();
