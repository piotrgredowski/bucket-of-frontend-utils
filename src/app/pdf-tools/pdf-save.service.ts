import { Injectable } from '@angular/core';
import { PDFDocument } from 'pdf-lib';

export interface PdfSaveOptions {
  useObjectStreams?: boolean;
  addDefaultPage?: boolean;
  objectsPerTick?: number;
  updateFieldAppearances?: boolean;
  compress?: boolean;
}

export interface PdfSaveResult {
  bytes: Uint8Array;
  size: number;
  isValid: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PdfSaveService {
  /**
   * Save PDF document to bytes with optimized settings
   * Similar to PDFDocumentWriter.saveToBytes(pdfDoc, { useObjectStreams: false })
   */
  async saveToBytes(
    pdfDocument: PDFDocument,
    options: PdfSaveOptions = {}
  ): Promise<PdfSaveResult> {
    const defaultOptions: PdfSaveOptions = {
      useObjectStreams: false,
      addDefaultPage: false,
      objectsPerTick: 10,
      updateFieldAppearances: false,
      compress: true,
      ...options,
    };

    try {
      console.log('Saving PDF with options:', defaultOptions);
      
      const pdfBytes = await pdfDocument.save(defaultOptions);
      
      const result: PdfSaveResult = {
        bytes: pdfBytes,
        size: pdfBytes.length,
        isValid: this.validatePdfBytes(pdfBytes),
      };

      if (!result.isValid) {
        result.error = 'Generated PDF appears to be corrupted - invalid header';
      }

      console.log(`PDF saved successfully: ${result.size} bytes, valid: ${result.isValid}`);
      
      return result;
    } catch (error: any) {
      console.error('PDF save error:', error);
      
      return {
        bytes: new Uint8Array(0),
        size: 0,
        isValid: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Save PDF with fallback strategies for large files
   */
  async saveWithFallback(
    pdfDocument: PDFDocument,
    isLargeFile: boolean = false
  ): Promise<PdfSaveResult> {
    // Primary save attempt with optimized settings
    const primaryOptions: PdfSaveOptions = isLargeFile
      ? {
          useObjectStreams: false,
          addDefaultPage: false,
          objectsPerTick: 5,
          updateFieldAppearances: false,
          compress: false, // Disable compression for large files to save memory
        }
      : {
          useObjectStreams: false,
          addDefaultPage: false,
          objectsPerTick: 10,
          updateFieldAppearances: false,
          compress: true,
        };

    let result = await this.saveToBytes(pdfDocument, primaryOptions);

    // If primary save failed with memory error, try fallback
    if (!result.isValid && this.isMemoryError(result.error)) {
      console.warn('Primary save failed, attempting fallback save...');
      
      // Force garbage collection if available
      await this.forceGarbageCollection();
      await this.delay(500);

      // Minimal fallback options
      const fallbackOptions: PdfSaveOptions = {
        useObjectStreams: false,
        compress: false,
      };

      result = await this.saveToBytes(pdfDocument, fallbackOptions);
    }

    return result;
  }

  /**
   * Create a file blob from PDF bytes for download
   */
  createDownloadBlob(pdfBytes: Uint8Array): Blob {
    return new Blob([pdfBytes], { type: 'application/pdf' });
  }

  /**
   * Create a file object from PDF bytes for preview
   */
  createPreviewFile(pdfBytes: Uint8Array, filename: string = 'preview.pdf'): File {
    const blob = this.createDownloadBlob(pdfBytes);
    return new File([blob], filename, { type: 'application/pdf' });
  }

  /**
   * Trigger download of PDF bytes
   */
  downloadPdfBytes(pdfBytes: Uint8Array, filename: string = 'document.pdf'): void {
    const blob = this.createDownloadBlob(pdfBytes);
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Clean up the object URL
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * Save PDF bytes to file using File System Access API (if available)
   */
  async savePdfBytesToFile(
    pdfBytes: Uint8Array,
    suggestedName: string = 'document.pdf'
  ): Promise<boolean> {
    if (!('showSaveFilePicker' in window)) {
      // Fall back to regular download
      this.downloadPdfBytes(pdfBytes, suggestedName);
      return true;
    }

    try {
      const fileHandle = await (window as any).showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'PDF files',
            accept: { 'application/pdf': ['.pdf'] },
          },
        ],
      });

      const writable = await fileHandle.createWritable();

      // Write in chunks for large files
      const chunkSize = 1024 * 1024; // 1MB chunks
      for (let i = 0; i < pdfBytes.length; i += chunkSize) {
        const chunk = pdfBytes.slice(i, i + chunkSize);
        await writable.write(chunk);

        // Give browser time to process for large files
        if (i % (chunkSize * 5) === 0) {
          await this.delay(10);
        }
      }

      await writable.close();
      return true;
    } catch (error) {
      console.warn('File System Access API failed, falling back to download:', error);
      this.downloadPdfBytes(pdfBytes, suggestedName);
      return false;
    }
  }

  private validatePdfBytes(pdfBytes: Uint8Array): boolean {
    if (!pdfBytes || pdfBytes.length === 0) {
      return false;
    }

    // Check PDF header
    const header = new TextDecoder().decode(pdfBytes.slice(0, 4));
    return header.startsWith('%PDF');
  }

  private getErrorMessage(error: any): string {
    if (this.isMemoryError(error)) {
      return 'Memory limit exceeded while saving PDF. Try reducing file size or closing other browser tabs.';
    }

    return error.message || 'Unknown error occurred while saving PDF';
  }

  private isMemoryError(error: any): boolean {
    if (!error) return false;
    
    const errorText = typeof error === 'string' ? error : error.message || '';
    const memoryKeywords = [
      'Array buffer allocation failed',
      'out of memory',
      'Maximum call stack size exceeded',
      'Cannot allocate memory',
      'memory allocation',
      'heap out of memory',
    ];

    return (
      memoryKeywords.some((keyword) =>
        errorText.toLowerCase().includes(keyword.toLowerCase())
      ) ||
      error.name === 'RangeError' ||
      error.name === 'MemoryError'
    );
  }

  private async forceGarbageCollection(): Promise<void> {
    if ((window as any).gc) {
      (window as any).gc();
    }

    // Create memory pressure to trigger GC
    try {
      const trigger = new Array(1000).fill(new Array(1000).fill(0));
      trigger.length = 0;
    } catch {}

    await this.delay(10);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}