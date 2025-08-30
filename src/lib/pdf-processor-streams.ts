import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { inflate } from 'zlib';
import { promisify } from 'util';

const inflateAsync = promisify(inflate);

export interface PDFExtractionResult {
  text: string;
  pages: number;
  method: string;
  metadata?: any;
  confidence?: number;
}

/**
 * Specialized PDF processor for handling compressed streams and complex PDFs
 * Specifically designed for PDFs with FlateDecode compression and embedded content
 */
export class StreamPDFProcessor {
  private tempDir: string;

  constructor() {
    this.tempDir = './temp';
  }

  /**
   * Main method to extract text from PDF with focus on compressed streams
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

    console.log(`📄 Processing PDF with stream processor: ${buffer.length} bytes`);

    // Ensure temp directory exists
    await this.ensureTempDir();

    // Try multiple extraction methods in order of preference
    const methods = [
      { name: 'stream-decode', fn: () => this.extractFromCompressedStreams(buffer) },
      { name: 'pdf-parse-streams', fn: () => this.extractWithPDFParseStreams(buffer) },
      { name: 'manual-decode', fn: () => this.extractWithManualDecode(buffer) },
      { name: 'metadata-extraction', fn: () => this.extractMetadataOnly(buffer) }
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

    // If all methods failed, return a helpful error message
    throw new Error(`All stream extraction methods failed. Last error: ${lastError}`);
  }

  /**
   * Method 1: Extract from compressed streams using zlib
   */
  private async extractFromCompressedStreams(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      const bufferString = buffer.toString('utf8');
      
      // Look for compressed streams
      const streamMatches = bufferString.match(/stream[\s\S]*?endstream/g);
      
      if (!streamMatches || streamMatches.length === 0) {
        throw new Error('No compressed streams found');
      }

      let extractedText = '';
      let decodedStreams = 0;

      for (let i = 0; i < streamMatches.length; i++) {
        const stream = streamMatches[i];
        
        // Remove stream/endstream markers
        const streamContent = stream.replace(/^stream\s*/, '').replace(/\s*endstream$/, '');
        
        try {
          // Try to decode the stream content
          const decoded = await inflateAsync(Buffer.from(streamContent, 'base64'));
          const decodedString = decoded.toString('utf8');
          
          if (decodedString.length > 0) {
            extractedText += `\n--- Decoded Stream ${i + 1} ---\n${decodedString}\n`;
            decodedStreams++;
          }
        } catch (decodeError) {
          // Try alternative decoding methods
          try {
            // Try hex decoding
            const hexDecoded = Buffer.from(streamContent, 'hex').toString('utf8');
            if (hexDecoded.length > 0 && !hexDecoded.includes('')) {
              extractedText += `\n--- Hex Decoded Stream ${i + 1} ---\n${hexDecoded}\n`;
              decodedStreams++;
            }
          } catch (hexError) {
            // Stream might not be compressed or uses different encoding
            console.log(`Stream ${i + 1} could not be decoded`);
          }
        }
      }

      if (decodedStreams === 0) {
        throw new Error('No streams could be decoded');
      }

      return {
        text: this.cleanTextEnhanced(extractedText),
        pages: 1,
        method: 'stream-decode',
        confidence: 0.8,
        metadata: {
          totalStreams: streamMatches.length,
          decodedStreams: decodedStreams
        }
      };
    } catch (error: any) {
      throw new Error(`Stream decode extraction failed: ${error.message}`);
    }
  }

  /**
   * Method 2: Enhanced pdf-parse with stream handling
   */
  private async extractWithPDFParseStreams(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      // Import pdf-parse dynamically
      const pdfParse = (await import('pdf-parse')).default;
      
      // Enhanced options for stream handling
      const options = {
        normalizeWhitespace: true,
        disableCombineTextItems: false,
        max: 0,
        version: 'v2.0.550',
        // Additional options for better stream handling
        pagerender: (pageData: any) => {
          // Custom page renderer to handle streams
          return pageData.getTextContent().then((textContent: any) => {
            return textContent.items.map((item: any) => item.str).join(' ');
          });
        }
      };
      
      const data = await pdfParse(buffer, options);
      
      if (!data || !data.text || data.text.trim().length === 0) {
        throw new Error('No text content found in PDF');
      }

      return {
        text: this.cleanTextEnhanced(data.text),
        pages: data.numpages || 1,
        method: 'pdf-parse-streams',
        metadata: {
          info: data.info,
          metadata: data.metadata,
          version: data.version,
          textLength: data.text.length
        },
        confidence: 0.9
      };
    } catch (error: any) {
      throw new Error(`pdf-parse streams extraction failed: ${error.message}`);
    }
  }

  /**
   * Method 3: Manual decode with multiple approaches
   */
  private async extractWithManualDecode(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      const bufferString = buffer.toString('utf8');
      
      let extractedText = '';
      
      // Look for text patterns in parentheses (common in PDFs)
      const textMatches = bufferString.match(/\([^)]{3,}\)/g);
      if (textMatches && textMatches.length > 0) {
        extractedText += 'Text patterns found:\n';
        textMatches.slice(0, 15).forEach((match, i) => {
          const cleanText = match.replace(/[()]/g, '').trim();
          if (cleanText.length > 3 && !cleanText.includes('\\') && !cleanText.match(/^[0-9\s]+$/)) {
            extractedText += `${i + 1}. ${cleanText}\n`;
          }
        });
      }

      // Look for object definitions
      const objectMatches = bufferString.match(/\d+\s+\d+\s+obj[\s\S]*?endobj/g);
      if (objectMatches && objectMatches.length > 0) {
        extractedText += `\nPDF Structure:\n`;
        extractedText += `- Contains ${objectMatches.length} PDF objects\n`;
        
        // Analyze object types
        const pageObjects = objectMatches.filter(obj => obj.includes('/Type /Page'));
        const streamObjects = objectMatches.filter(obj => obj.includes('/Filter'));
        const textObjects = objectMatches.filter(obj => obj.includes('/Text'));
        
        if (pageObjects.length > 0) {
          extractedText += `- ${pageObjects.length} page objects\n`;
        }
        if (streamObjects.length > 0) {
          extractedText += `- ${streamObjects.length} stream objects\n`;
        }
        if (textObjects.length > 0) {
          extractedText += `- ${textObjects.length} text objects\n`;
        }
      }

      // Look for specific compression types
      if (bufferString.includes('FlateDecode')) {
        extractedText += '\nCompression: Uses FlateDecode compression\n';
      }
      if (bufferString.includes('DCTDecode')) {
        extractedText += '\nCompression: Uses DCTDecode (JPEG) compression\n';
      }
      if (bufferString.includes('JPXDecode')) {
        extractedText += '\nCompression: Uses JPXDecode (JPEG2000) compression\n';
      }

      // Look for embedded content
      if (bufferString.includes('/Image')) {
        extractedText += '\nContent: Contains embedded images\n';
      }
      if (bufferString.includes('/Font')) {
        extractedText += '\nContent: Contains embedded fonts\n';
      }

      // Try to extract any readable text patterns
      const readablePatterns = bufferString.match(/[A-Za-z]{4,}/g);
      if (readablePatterns && readablePatterns.length > 0) {
        extractedText += '\nReadable text patterns:\n';
        const uniquePatterns = [...new Set(readablePatterns)].slice(0, 10);
        uniquePatterns.forEach((pattern, i) => {
          extractedText += `${i + 1}. ${pattern}\n`;
        });
      }

      if (!extractedText.trim()) {
        extractedText = 'PDF document detected but no extractable content found.';
      }

      return {
        text: this.cleanTextEnhanced(extractedText),
        pages: 1,
        method: 'manual-decode',
        confidence: 0.4
      };
    } catch (error: any) {
      throw new Error(`Manual decode extraction failed: ${error.message}`);
    }
  }

  /**
   * Method 4: Extract only metadata and structure information
   */
  private async extractMetadataOnly(buffer: Buffer): Promise<PDFExtractionResult> {
    try {
      const bufferString = buffer.toString('utf8');
      
      let extractedText = 'PDF Document Analysis:\n';
      extractedText += '====================\n\n';

      // Basic PDF info
      const versionMatch = bufferString.match(/%PDF-(\d+\.\d+)/);
      if (versionMatch) {
        extractedText += `PDF Version: ${versionMatch[1]}\n`;
      }

      // File size info
      extractedText += `File Size: ${buffer.length} bytes\n`;

      // Count various PDF elements
      const streamCount = (bufferString.match(/stream/g) || []).length;
      const endstreamCount = (bufferString.match(/endstream/g) || []).length;
      const objectCount = (bufferString.match(/\d+\s+\d+\s+obj/g) || []).length;
      const endobjCount = (bufferString.match(/endobj/g) || []).length;

      extractedText += `\nPDF Structure:\n`;
      extractedText += `- Streams: ${streamCount}\n`;
      extractedText += `- Objects: ${objectCount}\n`;
      extractedText += `- End streams: ${endstreamCount}\n`;
      extractedText += `- End objects: ${endobjCount}\n`;

      // Check for compression
      const compressionTypes = [];
      if (bufferString.includes('FlateDecode')) compressionTypes.push('FlateDecode');
      if (bufferString.includes('DCTDecode')) compressionTypes.push('DCTDecode');
      if (bufferString.includes('JPXDecode')) compressionTypes.push('JPXDecode');
      if (bufferString.includes('ASCII85Decode')) compressionTypes.push('ASCII85Decode');
      if (bufferString.includes('ASCIIHexDecode')) compressionTypes.push('ASCIIHexDecode');

      if (compressionTypes.length > 0) {
        extractedText += `\nCompression: ${compressionTypes.join(', ')}\n`;
      }

      // Check for content types
      const contentTypes = [];
      if (bufferString.includes('/Image')) contentTypes.push('Images');
      if (bufferString.includes('/Font')) contentTypes.push('Fonts');
      if (bufferString.includes('/Text')) contentTypes.push('Text');
      if (bufferString.includes('/Form')) contentTypes.push('Forms');

      if (contentTypes.length > 0) {
        extractedText += `Content Types: ${contentTypes.join(', ')}\n`;
      }

      // Analysis conclusion
      extractedText += `\nAnalysis:\n`;
      if (streamCount > 0 && objectCount > 0) {
        extractedText += `This appears to be a structured PDF with ${objectCount} objects and ${streamCount} data streams.\n`;
      }
      if (compressionTypes.length > 0) {
        extractedText += `The document uses compression (${compressionTypes.join(', ')}) which may require special handling.\n`;
      }
      if (contentTypes.includes('Images')) {
        extractedText += `The document contains images which may require OCR for text extraction.\n`;
      }

      return {
        text: this.cleanTextEnhanced(extractedText),
        pages: 1,
        method: 'metadata-extraction',
        confidence: 0.6
      };
    } catch (error: any) {
      throw new Error(`Metadata extraction failed: ${error.message}`);
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
export const streamPDFProcessor = new StreamPDFProcessor();
