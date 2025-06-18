import { Injectable } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import { BehaviorSubject } from 'rxjs';

export interface PageSelection {
  documentIndex: number;
  documentName: string;
  pageIndex: number;
  pageNumber: number;
}

export interface PdfDocument {
  name: string;
  file: File;
  pageCount: number;
  pages: any[];
  pdfDoc?: any;
  pageRange?: string;
  selectedPageNumbers?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class SimplePdfMergerService {
  
  /**
   * Simple PDF merge with chunking for better performance and progress reporting
   */
  async createMergedPdfSimple(
    selectedPages: PageSelection[], 
    documents: PdfDocument[],
    progressCallback?: (current: number, total: number, message: string) => void
  ): Promise<Uint8Array | null> {
    
    try {
      console.log('Starting chunked PDF merge...');
      
      // Create new PDF document
      const mergedPdf = await PDFDocument.create();
      const loadedDocuments = new Map<number, PDFDocument>();
      
      // Determine chunk size based on total pages
      const totalPages = selectedPages.length;
      const chunkSize = totalPages > 100 ? 5 : totalPages > 50 ? 10 : 20;
      console.log(`Processing ${totalPages} pages in chunks of ${chunkSize}`);
      
      // Process pages in chunks
      for (let chunkStart = 0; chunkStart < totalPages; chunkStart += chunkSize) {
        const chunkEnd = Math.min(chunkStart + chunkSize, totalPages);
        
        // Process chunk
        for (let i = chunkStart; i < chunkEnd; i++) {
          const pageSelection = selectedPages[i];
          const doc = documents[pageSelection.documentIndex];
          
          if (progressCallback) {
            progressCallback(
              i + 1, 
              totalPages + 1, 
              `Processing page ${i + 1} of ${totalPages} from ${doc.name}`
            );
          }
          
          try {
            // Load PDF document if not already loaded
            let pdf = loadedDocuments.get(pageSelection.documentIndex);
            if (!pdf) {
              const pdfBytes = await doc.file.arrayBuffer();
              pdf = await PDFDocument.load(pdfBytes);
              loadedDocuments.set(pageSelection.documentIndex, pdf);
            }
            
            // Copy page directly
            const [copiedPage] = await mergedPdf.copyPages(pdf, [pageSelection.pageIndex]);
            mergedPdf.addPage(copiedPage);
            
          } catch (error) {
            console.error(`Failed to process page ${i + 1}:`, error);
            throw new Error(`Failed to process page ${i + 1} from ${doc.name}`);
          }
        }
        
        // Yield to browser after each chunk
        await this.delay(50);
        
        // Force garbage collection if available
        if ((window as any).gc && chunkStart % (chunkSize * 3) === 0) {
          (window as any).gc();
        }
      }
      
      if (progressCallback) {
        progressCallback(totalPages + 1, totalPages + 1, 'Saving PDF...');
      }
      
      // Save with standard settings
      const pdfBytes = await mergedPdf.save();
      
      console.log(`Chunked merge complete: ${Math.round(pdfBytes.length / 1024 / 1024)}MB`);
      return pdfBytes;
      
    } catch (error) {
      console.error('Chunked PDF merge failed:', error);
      throw error;
    }
  }
  
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}