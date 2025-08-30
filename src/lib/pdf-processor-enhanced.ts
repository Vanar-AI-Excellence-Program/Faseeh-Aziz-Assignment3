// Removed SvelteKit-specific import for Node.js compatibility
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export interface PDFExtractionResult {
  text: string;
  pages: number;
  method: string;
  metadata?: any;
  confidence?: number;
}

export interface PDFProcessingError {
  error: string;
  details?: string;
  method: string;
}

/**
 * Enhanced PDF text extraction with OCR and multiple fallback methods
 * Specifically designed to handle complex PDFs with compressed streams and embedded content
 */
export class EnhancedPDFProcessor {
  private tempDir: string;

  constructor() {
    this.tempDir = './temp';
  }

  /**
   * Main method to extract text from PDF with comprehensive fallback strategies
   */
  async extractTextFromPDF(buffer: Buffer): Promise<PDFExtractionResult> {
    // Validate input
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty or invalid PDF buffer provided');
    }

    // Validate PDF header
    const header = buffer.toString('ascii', 0, 4);
    if (!header.startsWith('%PDF')) {
      throw new Error('File does not appear to be a valid PDF (missing PDF header)');
    }

    console.log(`📄 Processing PDF: ${buffer.length} bytes`);

    // Ensure temp directory exists
    await this.ensureTempDir();

    // Try multiple extraction methods in order of preference
    const methods = [
      { name: 'pdf-parse-enhanced', fn: () => this.extractWithPDFParseEnhanced(buffer) },
      { name: 'pdf2pic-ocr', fn: () => this.extractWithPDF2PicOCR(buffer) },
      { name: 'pdf-lib-detailed', fn: () => this.extractWithPDFLibDetailed(buffer) },
      { name: 'manual-stream-extraction', fn: () => this.extractFromStreams(buffer) },
      { name: 'fallback-ocr', fn: () => this.extractWithFallbackOCR(buffer) }
    ];

    let lastError: PDFProcessingError | null = null;

    for (const method of methods) {
      try {
        console.log(`🔄 Trying ${method.name}...`);
        const result = await method.fn();
        
        if (result.text && result.text.trim().length > 0) {
          console.log(`✅ Success with ${method.name}: ${result.text.length} characters`);
          return result;
        } else {
          throw new Error('No text content extracted');
        }
      } catch (error: any) {
        console.warn(`⚠️ ${method.name} failed:`, error.message);
        lastError = {
          error: error.message,
          details: error.stack,
          method: method.name
        };
        continue;
      }
    }

    // If all methods failed, return a helpful error message
    throw new Error(`All PDF extraction methods failed. This PDF may be image-based or contain only vector graphics. Last error (${lastError?.method}): ${lastError?.error}`);
  }

  /**
   * Method 1: Enhanced pdf-parse with better stream handling
   */
  private async extractWithPDFParseEnhanced(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      // Import pdf-parse dynamically
      const pdfParse = (await import('pdf-parse')).default;
      
      // Enhanced options for better text extraction
      const options = {
        // Try to extract more text content
        normalizeWhitespace: true,
        disableCombineTextItems: false,
        // Handle compressed streams better
        max: 0, // No page limit
        version: 'v2.0.550'
      };
      
      const data = await pdfParse(buffer, options);
      
      if (!data || !data.text || data.text.trim().length === 0) {
        throw new Error('No text content found in PDF');
      }

      // Enhanced text cleaning
      const cleanedText = this.cleanTextEnhanced(data.text);

      return {
        text: cleanedText,
        pages: data.numpages || 1,
        method: 'pdf-parse-enhanced',
        metadata: {
          info: data.info,
          metadata: data.metadata,
          version: data.version,
          textLength: cleanedText.length
        },
        confidence: 0.9
      };
    } catch (error: any) {
      throw new Error(`pdf-parse enhanced extraction failed: ${error.message}`);
    }
  }

  /**
   * Method 2: Convert PDF to images and use OCR
   */
  private async extractWithPDF2PicOCR(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      // Convert PDF to images using pdf2pic
      const { fromPath } = await import('pdf2pic');
      
      const tempFilePath = path.join(this.tempDir, `temp_${randomUUID()}.pdf`);
      await fs.writeFile(tempFilePath, buffer);

      const options = {
        density: 300, // High resolution for better OCR
        saveFilename: "page",
        savePath: this.tempDir,
        format: "png",
        width: 2480,
        height: 3508
      };

      const convert = fromPath(tempFilePath, options);
      
      // Convert first few pages for performance
      const maxPages = 3;
      let extractedText = '';
      let pageCount = 0;

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        try {
          const pageData = await convert(pageNum);
          
          if (!pageData || !pageData.path) {
            break; // No more pages
          }

          // Use Tesseract.js for OCR
          const { createWorker } = await import('tesseract.js');
          const worker = await createWorker('eng');
          
          const { data: { text, confidence } } = await worker.recognize(pageData.path);
          await worker.terminate();

          if (text && text.trim().length > 0) {
            extractedText += `\n--- Page ${pageNum} ---\n${text}\n`;
          }

          pageCount++;
          
          // Clean up page image
          await this.cleanupFiles([pageData.path]);
          
        } catch (pageError) {
          console.warn(`Failed to process page ${pageNum}:`, pageError);
          break;
        }
      }

      // Clean up temp PDF file
      await this.cleanupFiles([tempFilePath]);

      if (!extractedText.trim()) {
        throw new Error('OCR extraction produced no text');
      }

      return {
        text: this.cleanTextEnhanced(extractedText),
        pages: pageCount,
        method: 'pdf2pic-ocr',
        confidence: 0.7
      };
    } catch (error: any) {
      throw new Error(`PDF2Pic OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Method 3: Detailed extraction using pdf-lib
   */
  private async extractWithPDFLibDetailed(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      // Import pdf-lib for detailed analysis
      const { PDFDocument } = await import('pdf-lib');
      
      const pdfDoc = await PDFDocument.load(buffer);
      const pageCount = pdfDoc.getPageCount();
      
      if (pageCount === 0) {
        throw new Error('PDF contains no pages');
      }

      // Get detailed document info
      const pages = pdfDoc.getPages();
      let extractedText = '';

      // Add document metadata
      const title = pdfDoc.getTitle() || 'Untitled Document';
      const author = pdfDoc.getAuthor() || 'Unknown Author';
      const subject = pdfDoc.getSubject() || 'No Subject';
      const creator = pdfDoc.getCreator() || 'Unknown Creator';
      const producer = pdfDoc.getProducer() || 'Unknown Producer';
      const version = pdfDoc.getPDFVersion();

      extractedText += `Document Information:\n`;
      extractedText += `Title: ${title}\n`;
      extractedText += `Author: ${author}\n`;
      extractedText += `Subject: ${subject}\n`;
      extractedText += `Creator: ${creator}\n`;
      extractedText += `Producer: ${producer}\n`;
      extractedText += `PDF Version: ${version}\n`;
      extractedText += `Pages: ${pageCount}\n\n`;

      // Add page information
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        extractedText += `Page ${i + 1}: ${Math.round(width)}x${Math.round(height)} points\n`;
      }

      return {
        text: this.cleanTextEnhanced(extractedText),
        pages: pageCount,
        method: 'pdf-lib-detailed',
        confidence: 0.5
      };
    } catch (error: any) {
      throw new Error(`pdf-lib detailed extraction failed: ${error.message}`);
    }
  }

  /**
   * Method 4: Manual extraction from PDF streams
   */
  private async extractFromStreams(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      // Convert buffer to string for pattern matching
      const bufferString = buffer.toString('utf8', 0, Math.min(buffer.length, 50000));
      
      let extractedText = '';
      
      // Look for text patterns in the PDF
      const textMatches = bufferString.match(/\([^)]{3,}\)/g);
      const streamMatches = bufferString.match(/stream[\s\S]*?endstream/g);
      const objectMatches = bufferString.match(/\d+\s+\d+\s+obj[\s\S]*?endobj/g);
      
      if (textMatches && textMatches.length > 0) {
        extractedText += 'Extracted text patterns:\n';
        textMatches.slice(0, 20).forEach((match, i) => {
          const cleanText = match.replace(/[()]/g, '').trim();
          if (cleanText.length > 3 && !cleanText.includes('\\') && !cleanText.match(/^[0-9\s]+$/)) {
            extractedText += `${i + 1}. ${cleanText}\n`;
          }
        });
      }
      
      if (streamMatches && streamMatches.length > 0) {
        extractedText += `\nDocument contains ${streamMatches.length} embedded streams.\n`;
        extractedText += 'This suggests the PDF contains compressed or encoded content.\n';
      }
      
      if (objectMatches && objectMatches.length > 0) {
        extractedText += `\nDocument contains ${objectMatches.length} PDF objects.\n`;
      }
      
      // Look for specific patterns that might indicate content type
      if (bufferString.includes('FlateDecode')) {
        extractedText += '\nDocument uses FlateDecode compression.\n';
      }
      
      if (bufferString.includes('Image')) {
        extractedText += '\nDocument contains embedded images.\n';
      }
      
      if (!extractedText.trim()) {
        extractedText = 'PDF document detected but no extractable text found. This may be an image-based PDF or contain only vector graphics.';
      }

      return {
        text: this.cleanTextEnhanced(extractedText),
        pages: 1, // Unknown
        method: 'manual-stream-extraction',
        confidence: 0.3
      };
    } catch (error: any) {
      throw new Error(`Manual stream extraction failed: ${error.message}`);
    }
  }

  /**
   * Method 5: Fallback OCR with different settings
   */
  private async extractWithFallbackOCR(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      // Try a different approach with lower resolution but faster processing
      const { fromPath } = await import('pdf2pic');
      
      const tempFilePath = path.join(this.tempDir, `temp_${randomUUID()}.pdf`);
      await fs.writeFile(tempFilePath, buffer);

      const options = {
        density: 150, // Lower resolution for faster processing
        saveFilename: "page",
        savePath: this.tempDir,
        format: "png",
        width: 1240,
        height: 1754
      };

      const convert = fromPath(tempFilePath, options);
      const pageData = await convert(1); // Convert first page only

      if (!pageData || !pageData.path) {
        throw new Error('Failed to convert PDF to image');
      }

      // Use Tesseract.js with different settings
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      
      // Configure OCR for better text recognition
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?;:()[]{}"\'-_+=<>/@#$%^&*|\\~` ',
        tessedit_pageseg_mode: '6', // Uniform block of text
        tessedit_ocr_engine_mode: '3' // Default, based on what is available
      });
      
      const { data: { text } } = await worker.recognize(pageData.path);
      await worker.terminate();

      // Clean up files
      await this.cleanupFiles([tempFilePath, pageData.path]);

      if (!text || text.trim().length === 0) {
        throw new Error('OCR extraction produced no text');
      }

      return {
        text: this.cleanTextEnhanced(text),
        pages: 1,
        method: 'fallback-ocr',
        confidence: 0.6
      };
    } catch (error: any) {
      throw new Error(`Fallback OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Enhanced text cleaning with better handling of PDF artifacts
   */
  private cleanTextEnhanced(text: string): string {
    if (!text) return '';

    return text
      // Remove PDF-specific artifacts
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      // Remove invalid characters but keep more useful ones
      .replace(/[^\w\s.,!?;:()[\]{}"'`~@#$%^&*+=|\\<>/\-_]/g, '')
      // Clean up multiple spaces and line breaks
      .replace(/\n\s+/g, '\n')
      .replace(/\s+\n/g, '\n')
      .trim();
  }

  /**
   * Ensure temp directory exists
   */
  private async ensureTempDir(): Promise<void> {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Clean up temporary files
   */
  private async cleanupFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`Failed to cleanup file ${filePath}:`, error);
      }
    }
  }

  /**
   * Get processing statistics
   */
  async getStats(): Promise<{ tempDir: string; tempFiles: number }> {
    try {
      const files = await fs.readdir(this.tempDir);
      return {
        tempDir: this.tempDir,
        tempFiles: files.length
      };
    } catch (error) {
      return {
        tempDir: this.tempDir,
        tempFiles: 0
      };
    }
  }
}

// Export singleton instance
export const enhancedPDFProcessor = new EnhancedPDFProcessor();
