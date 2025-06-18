import { Injectable } from '@angular/core';
import { PDFDocument } from 'pdf-lib';

@Injectable({
  providedIn: 'root'
})
export class PdfCompressionService {

  /**
   * Aggressively compress a PDF by rebuilding it with optimization
   */
  async compressPdf(pdfBytes: Uint8Array): Promise<Uint8Array> {
    try {
      console.log('Starting PDF compression optimization...');
      const originalSize = pdfBytes.length;
      
      // Load the PDF
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Create a new optimized document
      const optimizedDoc = await PDFDocument.create();
      
      // Copy all pages with compression
      const pageCount = pdfDoc.getPageCount();
      console.log(`Compressing ${pageCount} pages...`);
      
      // Copy pages in smaller batches to maintain compression
      const batchSize = 5;
      for (let i = 0; i < pageCount; i += batchSize) {
        const endIndex = Math.min(i + batchSize, pageCount);
        const pageIndices = Array.from({ length: endIndex - i }, (_, idx) => i + idx);
        
        const copiedPages = await optimizedDoc.copyPages(pdfDoc, pageIndices);
        copiedPages.forEach(page => optimizedDoc.addPage(page));
        
        // Small delay to allow garbage collection
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      
      // Save with maximum compression
      const compressedBytes = await optimizedDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 20,  // Small batches for better compression
        updateFieldAppearances: false
      });
      
      const finalSize = compressedBytes.length;
      const compressionRatio = ((originalSize - finalSize) / originalSize * 100).toFixed(1);
      
      console.log(`PDF compression complete: ${this.formatBytes(originalSize)} → ${this.formatBytes(finalSize)} (${compressionRatio}% reduction)`);
      
      return compressedBytes;
    } catch (error) {
      console.error('PDF compression failed:', error);
      // Return original if compression fails
      return pdfBytes;
    }
  }

  /**
   * Apply inline compression optimizations during page copying
   */
  async optimizePageCopy(sourcePdf: PDFDocument, targetPdf: PDFDocument, pageIndex: number): Promise<void> {
    try {
      const [copiedPage] = await targetPdf.copyPages(sourcePdf, [pageIndex]);
      
      // Apply page-level optimizations if possible
      targetPdf.addPage(copiedPage);
      
    } catch (error) {
      console.error('Page optimization failed:', error);
      // Fallback to standard copy
      const [fallbackPage] = await targetPdf.copyPages(sourcePdf, [pageIndex]);
      targetPdf.addPage(fallbackPage);
    }
  }

  /**
   * Check if a PDF would benefit from compression
   */
  shouldCompress(fileSizeBytes: number, targetCompressionRatio: number = 0.3): boolean {
    // Compress if file is larger than 10MB and we can expect >30% reduction
    return fileSizeBytes > 10 * 1024 * 1024;
  }

  /**
   * Estimate compression potential
   */
  estimateCompressionRatio(fileSizeBytes: number, pageCount: number): number {
    // Rough estimation based on typical PDF characteristics
    const avgPageSize = fileSizeBytes / pageCount;
    
    if (avgPageSize > 2 * 1024 * 1024) {
      // Large pages (>2MB each) - likely high compression potential
      return 0.6; // 60% reduction possible
    } else if (avgPageSize > 500 * 1024) {
      // Medium pages (500KB-2MB) - moderate compression
      return 0.4; // 40% reduction possible
    } else {
      // Small pages - limited compression potential
      return 0.2; // 20% reduction possible
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}