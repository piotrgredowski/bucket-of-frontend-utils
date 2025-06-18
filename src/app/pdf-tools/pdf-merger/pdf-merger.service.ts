import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PDFDocument } from 'pdf-lib';
import { BehaviorSubject } from 'rxjs';
import { MemoryMonitorService } from '../memory-monitor.service';
import { PdfCompressionService } from '../pdf-compression.service';
import { SimplePdfMergerService } from './pdf-merger-simple.service';
import { OptimizedPdfMergerService } from './pdf-merger-optimized.service';
import { pdfjsLib } from '../pdf-config';
import { PagePreviewDialogComponent } from './page-preview-dialog.component';
import {
  PdfPasswordDialogComponent,
  PdfPasswordDialogData,
  PdfPasswordDialogResult,
} from './pdf-password-dialog.component';

export interface Page {
  number: number;
  selected: boolean;
}

export interface PdfDocument {
  name: string;
  file: File;
  pageCount: number;
  pages: Page[];
  pdfDoc?: pdfjsLib.PDFDocumentProxy;
  pageRange?: string;
  selectedPageNumbers?: number[];
}

export interface PageSelection {
  documentIndex: number;
  documentName: string;
  pageIndex: number;
  pageNumber: number;
}

export interface MergeProgress {
  current: number;
  total: number;
  percentage: number;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class PdfMergerService {
  private documentsSubject = new BehaviorSubject<PdfDocument[]>([]);
  private selectedPagesSubject = new BehaviorSubject<PageSelection[]>([]);
  private isProcessingSubject = new BehaviorSubject<boolean>(false);
  private progressSubject = new BehaviorSubject<MergeProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    message: ''
  });
  private errorSubject = new BehaviorSubject<string | null>(null);

  documents$ = this.documentsSubject.asObservable();
  selectedPages$ = this.selectedPagesSubject.asObservable();
  isProcessing$ = this.isProcessingSubject.asObservable();
  progress$ = this.progressSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  constructor(
    private dialog: MatDialog,
    private memoryMonitor: MemoryMonitorService,
    private compressionService: PdfCompressionService,
    private simpleMerger: SimplePdfMergerService,
    private optimizedMerger: OptimizedPdfMergerService
  ) {}

  async addFiles(files: File[]): Promise<void> {
    this.setProcessing(true);
    this.clearError();

    try {
      const currentDocs = this.documentsSubject.value;
      const newDocs: PdfDocument[] = [];

      for (const file of files) {
        if (file.type !== 'application/pdf') {
          continue;
        }

        try {
          const doc = await this.loadPdfDocument(file);
          newDocs.push(doc);
        } catch (fileError) {
          console.error(`Failed to process PDF file ${file.name}:`, fileError);
          this.setError(
            `Failed to process ${file.name}. The file may be corrupted or too large.`
          );
          return;
        }
      }

      if (newDocs.length === 0) {
        this.setError('No valid PDF files found');
        return;
      }

      const allDocs = [...currentDocs, ...newDocs];
      this.documentsSubject.next(allDocs);

      // Auto-select all pages from new documents
      const currentSelectedPages = this.selectedPagesSubject.value;
      const newSelectedPages: PageSelection[] = [];

      newDocs.forEach((doc, docIndex) => {
        const actualDocIndex = currentDocs.length + docIndex;
        for (let pageIndex = 0; pageIndex < doc.pageCount; pageIndex++) {
          newSelectedPages.push({
            documentIndex: actualDocIndex,
            documentName: doc.name,
            pageIndex,
            pageNumber: pageIndex + 1
          });
        }
      });

      this.selectedPagesSubject.next([...currentSelectedPages, ...newSelectedPages]);

    } catch (error) {
      this.setError('Failed to load PDF files');
      console.error(error);
    } finally {
      this.setProcessing(false);
    }
  }

  private async loadPdfDocument(file: File, password?: string): Promise<PdfDocument> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        password: password
      });
      
      const pdfDoc = await loadingTask.promise;
      
      return {
        name: file.name,
        file: file,
        pageCount: pdfDoc.numPages,
        pages: Array.from({ length: pdfDoc.numPages }, (_, i) => ({
          number: i + 1,
          selected: true
        })),
        pdfDoc: pdfDoc
      };
    } catch (error: any) {
      if (error.name === 'PasswordException') {
        return await this.handlePasswordProtectedPdf(file, password);
      }
      throw error;
    }
  }

  private async handlePasswordProtectedPdf(file: File, previousPassword?: string): Promise<PdfDocument> {
    const dialogRef = this.dialog.open(PdfPasswordDialogComponent, {
      width: '400px',
      data: {
        fileName: file.name,
        previousPassword: previousPassword
      } as PdfPasswordDialogData,
      disableClose: true
    });

    const result = await dialogRef.afterClosed().toPromise() as PdfPasswordDialogResult;
    
    if (!result || result.skipFile) {
      throw new Error('Password required to open PDF');
    }

    try {
      return await this.loadPdfDocument(file, result.password);
    } catch (error: any) {
      if (error.name === 'PasswordException') {
        return await this.handlePasswordProtectedPdf(file, result.password);
      }
      throw error;
    }
  }

  removeDocument(index: number): void {
    const docs = this.documentsSubject.value;
    const doc = docs[index];
    
    if (doc?.pdfDoc) {
      try {
        doc.pdfDoc.destroy();
      } catch (error) {
        console.warn('Failed to destroy PDF document:', error);
      }
    }

    docs.splice(index, 1);
    this.documentsSubject.next(docs);

    // Remove all selected pages from this document and adjust indices
    const selectedPages = this.selectedPagesSubject.value;
    const updatedSelectedPages = selectedPages
      .filter(page => page.documentIndex !== index)
      .map(page => ({
        ...page,
        documentIndex: page.documentIndex > index ? page.documentIndex - 1 : page.documentIndex
      }));

    this.selectedPagesSubject.next(updatedSelectedPages);
  }

  clearDocuments(): void {
    const docs = this.documentsSubject.value;
    docs.forEach(doc => {
      if (doc.pdfDoc) {
        try {
          doc.pdfDoc.destroy();
        } catch (error) {
          console.warn('Failed to destroy PDF document:', error);
        }
      }
    });

    this.documentsSubject.next([]);
    this.selectedPagesSubject.next([]);
  }

  updateSelectedPages(pages: PageSelection[]): void {
    this.selectedPagesSubject.next(pages);
  }

  selectAllPages(): void {
    const documents = this.documentsSubject.value;
    const allPages: PageSelection[] = [];

    documents.forEach((doc, docIndex) => {
      for (let pageIndex = 0; pageIndex < doc.pageCount; pageIndex++) {
        allPages.push({
          documentIndex: docIndex,
          documentName: doc.name,
          pageIndex,
          pageNumber: pageIndex + 1
        });
      }
    });

    this.selectedPagesSubject.next(allPages);
  }

  clearSelection(): void {
    this.selectedPagesSubject.next([]);
  }

  async mergePdfs(): Promise<void> {
    const selectedPages = this.selectedPagesSubject.value;
    if (selectedPages.length === 0) {
      this.setError('No pages selected for merging');
      return;
    }

    try {
      const mergedPdfBytes = await this.createMergedPdf();
      if (mergedPdfBytes) {
        await this.downloadPdf(mergedPdfBytes, 'merged.pdf');
      }
    } catch (error: any) {
      console.error('PDF merge error:', error);
      this.setError(error.message || 'Failed to merge PDFs');
    }
  }

  async previewMergedPdf(): Promise<void> {
    const selectedPages = this.selectedPagesSubject.value;
    if (selectedPages.length === 0) {
      this.setError('No pages selected for preview');
      return;
    }

    try {
      const mergedPdfBytes = await this.createMergedPdf();
      if (mergedPdfBytes) {
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        this.dialog.open(PagePreviewDialogComponent, {
          width: '90vw',
          height: '90vh',
          maxWidth: '1200px',
          data: { url }
        });
      }
    } catch (error) {
      console.error('Failed to load merged PDF for preview:', error);
      this.setError('Failed to open PDF preview');
    }
  }

  private async downloadPdf(pdfBytes: Uint8Array, filename: string): Promise<void> {
    try {
      // Try File System Access API first (if supported)
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'PDF files',
              accept: { 'application/pdf': ['.pdf'] }
            }]
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(pdfBytes);
          await writable.close();
          return;
        } catch (error) {
          console.warn(
            'File System Access API failed, falling back to blob download:',
            error
          );
        }
      }

      // Fallback to blob download
      await this.downloadUsingBlob(pdfBytes, filename);
    } catch (error: any) {
      console.error('Download failed:', error);

      if (this.isMemoryError(error)) {
        this.setError(
          'Download failed due to memory limitations. Try:\\n\\n• Closing other browser tabs\\n• Creating a smaller merged PDF (fewer pages)\\n• Using a desktop PDF tool for very large files'
        );
      } else {
        this.setError('Failed to download PDF');
      }
    }
  }

  private async downloadUsingBlob(data: Uint8Array, filename: string): Promise<void> {
    try {
      // Create blob in chunks for large files
      const chunkSize = 64 * 1024 * 1024; // 64MB chunks
      const chunks: Blob[] = [];

      for (let i = 0; i < data.length; i += chunkSize) {
        chunks.push(new Blob([data.slice(i, i + chunkSize)]));

        if (chunks.length % 3 === 0) {
          await this.delay(50);
          if ((window as any).gc) {
            (window as any).gc();
          }
        }
      }

      const blob = new Blob(chunks, { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      throw new Error(
        'Failed to create download. The file may be too large for your browser.'
      );
    }
  }

  private async createMergedPdf(): Promise<Uint8Array | null> {
    this.setProcessing(true);
    this.clearError();
    this.clearProgress();

    try {
      const selectedPages = this.selectedPagesSubject.value;
      const documents = this.documentsSubject.value;

      // Subscribe to optimized merger's progress
      const progressSubscription = this.optimizedMerger.progress$.subscribe(progress => {
        this.updateProgress(progress.current, progress.total, progress.message);
      });

      try {
        // Use the optimized merger for much smaller file sizes
        const mergedPdfBytes = await this.optimizedMerger.createOptimizedMergedPdf(selectedPages, documents);

        if (!mergedPdfBytes || mergedPdfBytes.length === 0) {
          throw new Error('PDF generation failed - no data produced');
        }

        console.log(`Optimized merge complete: ${Math.round(mergedPdfBytes.length / 1024 / 1024)}MB`);
        return mergedPdfBytes;
      } finally {
        progressSubscription.unsubscribe();
      }

    } catch (error: any) {
      console.error('PDF merge error:', error);
      this.setError(error.message || 'Failed to merge PDFs');
      return null;
    } finally {
      this.setProcessing(false);
      this.clearProgress();
    }
  }

  private setProcessing(processing: boolean): void {
    this.isProcessingSubject.next(processing);
  }

  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }

  private clearProgress(): void {
    this.progressSubject.next({
      current: 0,
      total: 0,
      percentage: 0,
      message: ''
    });
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

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private isMemoryError(error: any): boolean {
    const message = error?.message?.toLowerCase() || '';
    return (
      message.includes('memory') ||
      message.includes('out of memory') ||
      message.includes('quota') ||
      message.includes('allocation') ||
      error?.name === 'QuotaExceededError'
    );
  }

  private async forceGarbageCollection(): Promise<void> {
    if ((window as any).gc) {
      (window as any).gc();
    }
    await this.delay(100);
  }

  // Additional methods for component compatibility
  clearAllResources(): void {
    this.cleanup();
    this.clearDocuments();
  }

  reorderPages(previousIndex: number, currentIndex: number): void {
    const pages = this.selectedPagesSubject.value;
    const page = pages.splice(previousIndex, 1)[0];
    pages.splice(currentIndex, 0, page);
    this.selectedPagesSubject.next(pages);
  }

  removePageFromOrder(index: number): void {
    const pages = this.selectedPagesSubject.value;
    pages.splice(index, 1);
    this.selectedPagesSubject.next(pages);
  }

  async previewMerged(): Promise<void> {
    return this.previewMergedPdf();
  }

  async downloadMerged(): Promise<void> {
    return this.mergePdfs();
  }

  getCurrentDocuments(): PdfDocument[] {
    return this.documentsSubject.value;
  }

  updateDocumentPageRange(docIndex: number, pageRange: string, selectedPages?: PageSelection[]): void {
    const docs = this.documentsSubject.value;
    if (docs[docIndex]) {
      docs[docIndex].pageRange = pageRange;
      this.documentsSubject.next([...docs]);
      
      // Update selected pages based on range or use provided selectedPages
      if (selectedPages) {
        this.selectedPagesSubject.next(selectedPages);
      } else {
        this.updateSelectedPagesFromRange(docIndex, pageRange);
      }
    }
  }

  movePageToPosition(pageIndex: number, newPosition: number): PageSelection[] {
    const pages = this.selectedPagesSubject.value;
    const page = pages.splice(pageIndex, 1)[0];
    pages.splice(newPosition, 0, page);
    this.selectedPagesSubject.next(pages);
    return pages;
  }

  private updateSelectedPagesFromRange(docIndex: number, pageRange: string): void {
    const documents = this.documentsSubject.value;
    const doc = documents[docIndex];
    if (!doc) return;

    // Remove existing pages for this document
    const currentPages = this.selectedPagesSubject.value.filter(
      page => page.documentIndex !== docIndex
    );

    // Parse page range and add new pages
    const newPages: PageSelection[] = [];
    if (pageRange && pageRange.trim()) {
      const pageNumbers = this.parsePageRange(pageRange, doc.pageCount);
      pageNumbers.forEach(pageNumber => {
        newPages.push({
          documentIndex: docIndex,
          documentName: doc.name,
          pageIndex: pageNumber - 1,
          pageNumber: pageNumber
        });
      });
    }

    this.selectedPagesSubject.next([...currentPages, ...newPages]);
  }

  private parsePageRange(range: string, maxPages: number): number[] {
    const pages: number[] = [];
    const parts = range.split(',');

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.max(1, Math.min(start, maxPages));
          const to = Math.max(1, Math.min(end, maxPages));
          for (let i = from; i <= to; i++) {
            pages.push(i);
          }
        }
      } else {
        const pageNum = parseInt(trimmed);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
          pages.push(pageNum);
        }
      }
    }

    return Array.from(new Set(pages)).sort((a, b) => a - b);
  }

  cleanup(): void {
    const docs = this.documentsSubject.value;
    docs.forEach(doc => {
      if (doc.pdfDoc) {
        try {
          doc.pdfDoc.destroy();
        } catch (error) {
          console.warn('Failed to destroy PDF document:', error);
        }
      }
    });
  }
}