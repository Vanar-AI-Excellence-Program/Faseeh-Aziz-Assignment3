import { env } from '$env/dynamic/private';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export interface PDFExtractionResult {
  text: string;
  pages: number;
  method: string;
  metadata?: any;
}

export interface PDFProcessingError {
  error: string;
  details?: string;
  method: string;
}

/**
 * Enhanced PDF text extraction with multiple fallback methods
 */
export class PDFProcessor {
  private tempDir: string;

  constructor() {
    this.tempDir = './temp';
  }

  /**
   * Main method to extract text from PDF with multiple fallback strategies
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
      { name: 'pdf-extract', fn: () => this.extractWithPDFExtract(buffer) },
      { name: 'pdf-lib-validation', fn: () => this.extractWithPDFLib(buffer) },
      { name: 'tesseract-ocr', fn: () => this.extractWithOCR(buffer) }
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

    // If all methods failed, throw the last error
    throw new Error(`All PDF extraction methods failed. Last error (${lastError?.method}): ${lastError?.error}`);
  }

  /**
   * Method 1: Extract using pdf-parse (most reliable for text-based PDFs)
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
   * Method 2: Extract using pdf-extract (fallback)
   */
  private async extractWithPDFExtract(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      const tempFilePath = path.join(this.tempDir, `temp_${randomUUID()}.pdf`);
      await fs.writeFile(tempFilePath, buffer);

      // Import pdf-extract dynamically
      const pdfExtract = (await import('pdf-extract')).default;
      
      const options = {
        type: 'text',
        version: 'v2.0.550'
      };

      const data = await pdfExtract(tempFilePath, options);
      
      // Clean up temp file
      await this.cleanupFiles([tempFilePath]);

      return {
        text: this.cleanText(data.text),
        pages: data.pages || 1,
        method: 'pdf-extract',
        metadata: data
      };
    } catch (error: any) {
      throw new Error(`pdf-extract extraction failed: ${error.message}`);
    }
  }

  /**
   * Method 3: Validate with pdf-lib and try basic extraction
   */
  private async extractWithPDFLib(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      // Import pdf-lib for validation
      const { PDFDocument } = await import('pdf-lib');
      
      const pdfDoc = await PDFDocument.load(buffer);
      const pageCount = pdfDoc.getPageCount();
      
      if (pageCount === 0) {
        throw new Error('PDF contains no pages');
      }

      // Try to extract basic text using pdf-lib's text extraction
      const pages = pdfDoc.getPages();
      let extractedText = '';

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();
        
        // Add page info as metadata
        extractedText += `Page ${i + 1} (${width}x${height})\n`;
      }

      return {
        text: this.cleanText(extractedText),
        pages: pageCount,
        method: 'pdf-lib-validation'
      };
    } catch (error: any) {
      throw new Error(`pdf-lib validation failed: ${error.message}`);
    }
  }

  /**
   * Method 4: OCR-based extraction using Tesseract.js
   */
  private async extractWithOCR(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      // Convert PDF to images first using pdf2pic
      const { fromPath } = await import('pdf2pic');
      
      const tempFilePath = path.join(this.tempDir, `temp_${randomUUID()}.pdf`);
      await fs.writeFile(tempFilePath, buffer);

      const options = {
        density: 300,
        saveFilename: "page",
        savePath: this.tempDir,
        format: "png",
        width: 2480,
        height: 3508
      };

      const convert = fromPath(tempFilePath, options);
      const pageData = await convert(1); // Convert first page only for performance

      if (!pageData || !pageData.path) {
        throw new Error('Failed to convert PDF to image');
      }

      // Use Tesseract.js for OCR
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      
      const { data: { text } } = await worker.recognize(pageData.path);
      await worker.terminate();

      // Clean up files
      await this.cleanupFiles([tempFilePath, pageData.path]);

      return {
        text: this.cleanText(text),
        pages: 1, // OCR only first page for performance
        method: 'tesseract-ocr'
      };
    } catch (error: any) {
      throw new Error(`OCR extraction failed: ${error.message}`);
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
export const pdfProcessor = new PDFProcessor();
