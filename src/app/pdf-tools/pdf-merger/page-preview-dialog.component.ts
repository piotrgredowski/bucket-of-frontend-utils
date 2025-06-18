import { Component, Inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { pdfjsLib } from '../pdf-config';

export interface PagePreviewDialogData {
  file: File;
  pageNumber: number;
  documentName: string;
  pdfDoc?: any; // pdfjsLib.PDFDocumentProxy
  allPages?: any[]; // All selected pages from the merger
  currentPageIndex?: number; // Index in the all pages array
}

@Component({
  selector: 'app-page-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>
      <div class="title-content">
        <div class="title-main">
          <mat-icon>preview</mat-icon>
          <span class="title-text">Page Preview</span>
          <span class="separator">•</span>
          <span class="document-info">{{ getTruncatedFileName() }} - Page {{ currentPageNumber }}</span>
        </div>
        <div class="page-controls" *ngIf="totalPages > 1">
          <button mat-icon-button (click)="previousPage()" [disabled]="currentPageIndex <= 0">
            <mat-icon>arrow_back_ios</mat-icon>
          </button>
          <span class="page-counter">{{ currentPageIndex + 1 }} / {{ totalPages }}</span>
          <button mat-icon-button (click)="nextPage()" [disabled]="currentPageIndex >= totalPages - 1">
            <mat-icon>arrow_forward_ios</mat-icon>
          </button>
        </div>
      </div>
    </h2>
    
    <mat-dialog-content class="dialog-content">
      
      <div class="preview-container">
        <div *ngIf="isLoading" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading page preview...</p>
        </div>
        
        <div *ngIf="error" class="error-container">
          <mat-icon color="warn">error</mat-icon>
          <p>{{ error }}</p>
        </div>
        
        <canvas 
          #previewCanvas 
          class="preview-canvas"
          [style.display]="!isLoading && !error ? 'block' : 'none'"
        ></canvas>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 600px;
      max-width: 1000px;
      max-height: 85vh;
      padding: 0;
      overflow: hidden;
    }
    
    .preview-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 500px;
      max-height: 80vh;
      padding: 24px;
      background: #fafafa;
      overflow: auto;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    
    .loading-container p {
      margin: 0;
      color: #666;
      font-size: 1rem;
    }
    
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: #f44336;
      text-align: center;
      max-width: 400px;
    }
    
    .error-container mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }
    
    .error-container p {
      margin: 0;
      font-size: 1rem;
      line-height: 1.5;
    }
    
    .preview-canvas {
      max-width: 100%;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      background: white;
      border: 1px solid #e0e0e0;
      display: block;
    }
    
    mat-dialog-content {
      overflow: visible;
    }
    
    mat-dialog-actions {
      padding: 16px 24px;
      background: #f8f9fa;
      border-top: 1px solid #e9ecef;
      justify-content: center;
    }
    
    mat-dialog-title {
      padding: 16px 24px;
      margin-bottom: 0;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }
    
    .title-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    
    .title-main {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      min-width: 0;
    }
    
    .title-main mat-icon {
      color: #2196f3;
      font-size: 24px;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }
    
    .title-text {
      font-size: 1.25rem;
      font-weight: 600;
      color: #333;
      flex-shrink: 0;
    }
    
    .separator {
      color: #999;
      font-weight: normal;
      flex-shrink: 0;
    }
    
    .document-info {
      font-size: 0.95rem;
      color: #666;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
      flex: 1;
    }
    
    .page-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }
    
    .page-counter {
      font-size: 0.85rem;
      color: #666;
      min-width: 50px;
      text-align: center;
    }
    
    .page-controls button {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.04);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .page-controls button:hover:not([disabled]) {
      background: rgba(33, 150, 243, 0.1);
      color: #2196f3;
    }
    
    .page-controls button[disabled] {
      opacity: 0.3;
    }
    
    .page-controls mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .page-controls button:hover:not([disabled]) mat-icon {
      color: #2196f3;
    }
  `]
})
export class PagePreviewDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('previewCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  isLoading = true;
  error: string | null = null;
  currentPageIndex: number;
  totalPages: number = 1;
  currentPage: any;
  pdfDocuments = new Map<number, any>(); // Cache for PDF documents

  constructor(
    public dialogRef: MatDialogRef<PagePreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PagePreviewDialogData
  ) {
    if (data.allPages && data.currentPageIndex !== undefined) {
      this.currentPageIndex = data.currentPageIndex;
      this.totalPages = data.allPages.length;
      this.currentPage = data.allPages[this.currentPageIndex];
    } else {
      this.currentPageIndex = 0;
      this.currentPage = {
        documentIndex: 0,
        documentName: data.documentName,
        pageNumber: data.pageNumber,
        file: data.file,
        pdfDoc: data.pdfDoc
      };
    }
  }

  get currentPageNumber(): number {
    return this.currentPage?.pageNumber || 1;
  }

  get currentDocumentName(): string {
    return this.currentPage?.documentName || this.data.documentName;
  }

  ngOnInit(): void {
    // Initialize component but don't load preview yet
  }

  ngAfterViewInit(): void {
    // Load preview after view is initialized
    setTimeout(() => {
      this.loadPagePreview();
    }, 50);
  }

  ngOnDestroy(): void {
    // Cleanup will be handled automatically by Angular
  }

  getTruncatedFileName(): string {
    const fileName = this.currentDocumentName;
    const maxLength = 40;
    if (fileName.length <= maxLength) return fileName;
    
    const extension = fileName.substring(fileName.lastIndexOf('.'));
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncatedLength = maxLength - extension.length - 3; // -3 for "..."
    
    return nameWithoutExt.substring(0, truncatedLength) + '...' + extension;
  }

  previousPage(): void {
    if (this.currentPageIndex > 0) {
      this.currentPageIndex--;
      if (this.data.allPages) {
        this.currentPage = this.data.allPages[this.currentPageIndex];
      }
      this.loadPagePreview();
    }
  }

  nextPage(): void {
    if (this.currentPageIndex < this.totalPages - 1) {
      this.currentPageIndex++;
      if (this.data.allPages) {
        this.currentPage = this.data.allPages[this.currentPageIndex];
      }
      this.loadPagePreview();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Only handle keyboard navigation if this dialog is open and focused
    if (!this.dialogRef) return;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        this.previousPage();
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        this.nextPage();
        break;
      case 'Home':
        event.preventDefault();
        this.goToFirstPage();
        break;
      case 'End':
        event.preventDefault();
        this.goToLastPage();
        break;
      case 'Escape':
        event.preventDefault();
        this.dialogRef.close();
        break;
    }
  }

  goToFirstPage(): void {
    if (this.currentPageIndex > 0) {
      this.currentPageIndex = 0;
      if (this.data.allPages) {
        this.currentPage = this.data.allPages[this.currentPageIndex];
      }
      this.loadPagePreview();
    }
  }

  goToLastPage(): void {
    if (this.currentPageIndex < this.totalPages - 1) {
      this.currentPageIndex = this.totalPages - 1;
      if (this.data.allPages) {
        this.currentPage = this.data.allPages[this.currentPageIndex];
      }
      this.loadPagePreview();
    }
  }

  private async loadPagePreview(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;

      // Check if canvas element is available
      const canvas = this.canvasRef?.nativeElement;
      if (!canvas) {
        throw new Error('Canvas element not available');
      }

      // Get or load PDF document for current page
      let pdfDocument;
      const documentIndex = this.currentPage.documentIndex || 0;
      
      if (this.pdfDocuments.has(documentIndex)) {
        pdfDocument = this.pdfDocuments.get(documentIndex);
      } else {
        // Try to use pre-loaded document first
        if (this.currentPage.pdfDoc) {
          pdfDocument = this.currentPage.pdfDoc;
        } else if (this.data.pdfDoc && documentIndex === 0) {
          pdfDocument = this.data.pdfDoc;
        } else {
          // Load from file
          const file = this.currentPage.file || this.data.file;
          const arrayBuffer = await file.arrayBuffer();
          
          try {
            pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          } catch (error: any) {
            if (error.name === 'PasswordException') {
              throw new Error('This PDF is password-protected and cannot be previewed');
            }
            throw error;
          }
        }
        
        // Cache the document
        this.pdfDocuments.set(documentIndex, pdfDocument);
      }
      
      // Get the specific page
      const page = await pdfDocument.getPage(this.currentPageNumber);
      
      // Set up canvas (use the canvas variable we already validated)
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not get canvas context');
      }
      
      // Calculate scale to fit the preview area with higher resolution
      const viewport = page.getViewport({ scale: 1 });
      const maxWidth = 800;
      const maxHeight = 700;
      
      let scale = Math.min(maxWidth / viewport.width, maxHeight / viewport.height);
      scale = Math.min(scale, 3); // Higher resolution cap for better quality
      
      // Use device pixel ratio for crisp rendering
      const devicePixelRatio = window.devicePixelRatio || 1;
      const outputScale = scale * devicePixelRatio;
      
      const scaledViewport = page.getViewport({ scale });
      const outputViewport = page.getViewport({ scale: outputScale });
      
      // Set canvas dimensions for high resolution
      canvas.width = outputViewport.width;
      canvas.height = outputViewport.height;
      
      // Set CSS size to display correctly
      canvas.style.width = scaledViewport.width + 'px';
      canvas.style.height = scaledViewport.height + 'px';
      
      // Scale the context for high DPI displays
      context.scale(devicePixelRatio, devicePixelRatio);
      
      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport
      };
      
      await page.render(renderContext).promise;
      
      this.isLoading = false;
    } catch (error: any) {
      console.error('Error loading page preview:', error);
      this.error = error.message || 'Failed to load page preview';
      this.isLoading = false;
    }
  }
}