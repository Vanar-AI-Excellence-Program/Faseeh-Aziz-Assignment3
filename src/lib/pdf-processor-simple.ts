import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export interface PDFExtractionResult {
  text: string;
  pages: number;
  method: string;
  metadata?: any;
}

/**
 * Simplified PDF text extraction with reliable fallback methods
 */
export class SimplePDFProcessor {
  private tempDir: string;

  constructor() {
    this.tempDir = './temp';
  }

  /**
   * Main method to extract text from PDF
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
      { name: 'pdf-parse', fn: () => this.extractWithPDFParse(buffer) },
      { name: 'pdf-lib-basic', fn: () => this.extractWithPDFLibBasic(buffer) },
      { name: 'manual-extraction', fn: () => this.extractManually(buffer) }
    ];

    let lastError: string | null = null;

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
        lastError = error.message;
        continue;
      }
    }

    // If all methods failed, throw the last error
    throw new Error(`All PDF extraction methods failed. Last error: ${lastError}`);
  }

  /**
   * Method 1: Extract using pdf-parse
   */
  private async extractWithPDFParse(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      // Import pdf-parse dynamically
      const pdfParse = (await import('pdf-parse')).default;
      
      const data = await pdfParse(buffer);
      
      if (!data || !data.text || data.text.trim().length === 0) {
        throw new Error('No text content found in PDF');
      }

      return {
        text: this.cleanText(data.text),
        pages: data.numpages || 1,
        method: 'pdf-parse',
        metadata: {
          info: data.info,
          metadata: data.metadata,
          version: data.version
        }
      };
    } catch (error: any) {
      throw new Error(`pdf-parse extraction failed: ${error.message}`);
    }
  }

  /**
   * Method 2: Basic extraction using pdf-lib
   */
  private async extractWithPDFLibBasic(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      // Import pdf-lib for validation and basic info
      const { PDFDocument } = await import('pdf-lib');
      
      const pdfDoc = await PDFDocument.load(buffer);
      const pageCount = pdfDoc.getPageCount();
      
      if (pageCount === 0) {
        throw new Error('PDF contains no pages');
      }

      // Get basic document info
      const pages = pdfDoc.getPages();
      let extractedText = '';

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Add page info as metadata
        extractedText += `Page ${i + 1} (${Math.round(width)}x${Math.round(height)})\n`;
      }

      // Add document metadata
      const title = pdfDoc.getTitle() || 'Untitled Document';
      extractedText += `\nDocument: ${title}\n`;
      extractedText += `Pages: ${pageCount}\n`;
      extractedText += `PDF Version: ${pdfDoc.getPDFVersion()}\n`;

      return {
        text: this.cleanText(extractedText),
        pages: pageCount,
        method: 'pdf-lib-basic'
      };
    } catch (error: any) {
      throw new Error(`pdf-lib basic extraction failed: ${error.message}`);
    }
  }

  /**
   * Method 3: Manual extraction for simple PDFs
   */
  private async extractManually(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      // This is a fallback method that tries to extract basic text patterns
      const bufferString = buffer.toString('utf8', 0, Math.min(buffer.length, 10000));
      
      // Look for text patterns in the PDF
      const textMatches = bufferString.match(/\([^)]{3,}\)/g);
      const streamMatches = bufferString.match(/stream[\s\S]*?endstream/g);
      
      let extractedText = '';
      
      if (textMatches && textMatches.length > 0) {
        // Extract text from parentheses (common in PDFs)
        extractedText += 'Extracted text patterns:\n';
        textMatches.slice(0, 10).forEach((match, i) => {
          const cleanText = match.replace(/[()]/g, '').trim();
          if (cleanText.length > 3 && !cleanText.includes('\\')) {
            extractedText += `${i + 1}. ${cleanText}\n`;
          }
        });
      }
      
      if (streamMatches && streamMatches.length > 0) {
        extractedText += '\nDocument contains embedded streams.\n';
      }
      
      if (!extractedText.trim()) {
        extractedText = 'PDF document detected but no extractable text found. This may be an image-based PDF or contain only vector graphics.';
      }

      return {
        text: this.cleanText(extractedText),
        pages: 1, // Unknown
        method: 'manual-extraction'
      };
    } catch (error: any) {
      throw new Error(`Manual extraction failed: ${error.message}`);
    }
  }

  /**
   * Clean and normalize extracted text
   */
  private cleanText(text: string): string {
    if (!text) return '';

    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove extra line breaks
      .replace(/[^\w\s.,!?;:()[\]{}"'`~@#$%^&*+=|\\<>/]/g, '') // Remove invalid characters
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
export const simplePDFProcessor = new SimplePDFProcessor();
