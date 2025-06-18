import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SimplePdfMergerService, PageSelection, PdfDocument } from './pdf-merger-simple.service';
import { PdfCompressionService } from '../pdf-compression.service';

export interface MergeProgress {
  current: number;
  total: number;
  percentage: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class OptimizedPdfMergerService {
  
  private progressSubject = new BehaviorSubject<MergeProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    message: ''
  });
  
  progress$ = this.progressSubject.asObservable();

  constructor(
    private simpleMerger: SimplePdfMergerService,
    private compressionService: PdfCompressionService
  ) {}

  /**
   * Optimized PDF merger that produces smaller file sizes
   */
  async createOptimizedMergedPdf(
    selectedPages: PageSelection[], 
    documents: PdfDocument[]
  ): Promise<Uint8Array | null> {
    
    try {
      console.log(`Starting optimized PDF merge with ${selectedPages.length} pages from ${documents.length} documents`);
      
      const totalFileSize = documents.reduce((sum, doc) => sum + doc.file.size, 0);
      console.log(`Total input file size: ${Math.round(totalFileSize / 1024 / 1024)}MB`);

      // Convert documents to the format expected by SimplePdfMergerService
      const simpleDocs = documents.map(doc => ({
        name: doc.name,
        file: doc.file,
        pageCount: doc.pageCount,
        pages: [],
        selectedPageNumbers: []
      }));

      // Use the simple merger with progress callback for better compression
      const mergedPdfBytes = await this.simpleMerger.createMergedPdfSimple(
        selectedPages,
        simpleDocs,
        (current: number, total: number, message: string) => {
          this.updateProgress(current, total, message);
        }
      );

      if (!mergedPdfBytes) {
        throw new Error('PDF merge failed - no data produced');
      }

      console.log(`Merged PDF size: ${Math.round(mergedPdfBytes.length / 1024 / 1024)}MB`);
      this.updateProgress(selectedPages.length + 1, selectedPages.length + 1, 'Merge complete');
      return mergedPdfBytes;

    } catch (error: any) {
      console.error('Optimized PDF merge error:', error);
      throw error;
    }
  }

  private updateProgress(current: number, total: number, message: string): void {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    this.progressSubject.next({
      current,
      total,
      percentage,
      message
    });
  }
}