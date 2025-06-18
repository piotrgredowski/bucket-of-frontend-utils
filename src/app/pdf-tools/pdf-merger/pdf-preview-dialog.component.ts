import { Component, Inject, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { pdfjsLib } from '../pdf-config';

export interface PdfPreviewDialogData {
  pdfData: Uint8Array;
  title: string;
}

@Component({
  selector: 'app-pdf-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    
    <mat-dialog-content>
      <div class="preview-container">
        <div class="loading" *ngIf="loading">
          <mat-spinner></mat-spinner>
          <p>Loading PDF...</p>
        </div>
        
        <div class="error" *ngIf="error">
          <mat-icon>error</mat-icon>
          <p>{{ error }}</p>
        </div>
        
        <div class="canvas-container" [style.display]="loading || error ? 'none' : 'flex'">
          <canvas #canvasRef></canvas>
        </div>
        
        <div class="page-navigation" *ngIf="!loading && !error && totalPages > 0">
          <button
            mat-icon-button
            (click)="previousPage()"
            [disabled]="currentPage <= 1"
          >
            <mat-icon>chevron_left</mat-icon>
          </button>
          
          <span class="page-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          
          <button
            mat-icon-button
            (click)="nextPage()"
            [disabled]="currentPage >= totalPages"
          >
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="download()">
        <mat-icon>download</mat-icon>
        Download
      </button>
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .preview-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 400px;
      max-height: 70vh;
      overflow: auto;
    }

    .loading, .error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 400px;
      gap: 16px;
    }

    .error {
      color: #f44336;
    }

    .canvas-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
      max-height: 60vh;
      overflow: auto;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    canvas {
      max-width: 100%;
      max-height: 100%;
      height: auto;
      border: 1px solid #ddd;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      background: white;
      border-radius: 4px;
      display: block;
    }

    .page-navigation {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 16px;
      padding: 8px;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .page-info {
      min-width: 120px;
      text-align: center;
    }

    mat-dialog-content {
      padding: 24px;
    }

    mat-dialog-actions {
      padding: 16px;
    }
  `]
})
export class PdfPreviewDialogComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('canvasRef') canvasRef!: ElementRef<HTMLCanvasElement>;
  
  loading = true;
  error: string | null = null;
  currentPage = 1;
  totalPages = 0;
  
  private pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
  private pageRendering = false;
  private pageNumPending: number | null = null;

  constructor(
    public dialogRef: MatDialogRef<PdfPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PdfPreviewDialogData
  ) {}

  ngOnInit(): void {
    // Don't load PDF immediately, wait for AfterViewInit
  }

  ngAfterViewInit(): void {
    // Ensure the canvas is available before loading PDF
    this.ensureCanvasAndLoadPdf();
  }

  private ensureCanvasAndLoadPdf(): void {
    const checkCanvas = () => {
      if (this.canvasRef?.nativeElement) {
        console.log('Canvas reference found, loading PDF...');
        this.loadPdf();
      } else {
        console.log('Canvas not ready, retrying...');
        setTimeout(checkCanvas, 100);
      }
    };
    checkCanvas();
  }

  ngOnDestroy(): void {
    if (this.pdfDoc) {
      this.pdfDoc.destroy();
    }
  }

  private async loadPdf(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      
      console.log('Loading PDF with data length:', this.data.pdfData.length);
      
      // Validate PDF data
      if (!this.data.pdfData || this.data.pdfData.length === 0) {
        throw new Error('PDF data is empty or invalid');
      }
      
      // Check if it looks like a PDF (should start with %PDF)
      const pdfHeader = new TextDecoder().decode(this.data.pdfData.slice(0, 4));
      console.log('PDF header:', pdfHeader);
      if (!pdfHeader.startsWith('%PDF')) {
        console.warn('PDF data does not start with %PDF header');
      }
      
      const loadingTask = pdfjsLib.getDocument({ 
        data: this.data.pdfData,
        verbosity: 1, // Enable some logging
        isEvalSupported: false // Security measure
      });
      
      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      
      console.log('PDF loaded successfully, pages:', this.totalPages);
      
      // Wait a bit for the view to be ready and render first page
      setTimeout(() => {
        this.renderPage(1).then(() => {
          this.loading = false;
        }).catch((err) => {
          console.error('Initial page render failed:', err);
          this.error = 'Failed to render PDF page: ' + (err as Error).message;
          this.loading = false;
        });
      }, 300);
    } catch (err) {
      this.error = 'Failed to load PDF: ' + (err as Error).message;
      this.loading = false;
      console.error('PDF loading error:', err);
    }
  }

  private async renderPage(pageNum: number): Promise<void> {
    if (!this.pdfDoc) {
      console.error('PDF doc not available');
      throw new Error('PDF document not loaded');
    }
    
    if (this.pageRendering) {
      this.pageNumPending = pageNum;
      return;
    }
    
    // Ensure we have a canvas element
    let canvas: HTMLCanvasElement | null = null;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts && !canvas) {
      if (this.canvasRef?.nativeElement) {
        canvas = this.canvasRef.nativeElement;
        console.log('Canvas found via ViewChild reference');
        break;
      } else {
        // Fallback: try to find canvas in the dialog
        const dialogElement = document.querySelector('mat-dialog-container');
        if (dialogElement) {
          canvas = dialogElement.querySelector('canvas') as HTMLCanvasElement;
          if (canvas) {
            console.log('Canvas found via dialog query selector');
            break;
          }
        }
      }
      
      attempts++;
      console.log(`Canvas search attempt ${attempts}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    if (!canvas) {
      console.error('Canvas element not found after multiple attempts');
      throw new Error('Canvas element not accessible');
    }
    
    this.pageRendering = true;
    
    try {
      console.log('Rendering page:', pageNum);
      
      const page = await this.pdfDoc.getPage(pageNum);
      
      // Use a more reasonable scale for better performance and display
      const containerWidth = Math.min(800, window.innerWidth * 0.8);
      const scale = Math.min(1.5, containerWidth / page.getViewport({ scale: 1 }).width);
      const viewport = page.getViewport({ scale });
      
      const context = canvas.getContext('2d');
      if (!context) {
        console.error('Canvas context not available');
        throw new Error('Cannot get 2D rendering context');
      }
      
      // Set canvas dimensions before clearing
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // Clear the canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Fill with white background
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      console.log('Canvas dimensions set:', canvas.width, 'x', canvas.height);
      console.log('Viewport dimensions:', viewport.width, 'x', viewport.height);
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      const renderTask = page.render(renderContext);
      await renderTask.promise;
      
      console.log('Page rendered successfully');
      
      // Verify something was actually drawn beyond the white background
      const imageData = context.getImageData(0, 0, Math.min(100, canvas.width), Math.min(100, canvas.height));
      const nonWhitePixels = [];
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        if (r !== 255 || g !== 255 || b !== 255) {
          nonWhitePixels.push({ r, g, b });
        }
      }
      
      console.log('Non-white pixels found:', nonWhitePixels.length);
      
      if (nonWhitePixels.length === 0) {
        console.warn('Canvas appears to be empty (all white) after rendering');
      }
      
      this.pageRendering = false;
      
      if (this.pageNumPending !== null) {
        const pendingPage = this.pageNumPending;
        this.pageNumPending = null;
        await this.renderPage(pendingPage);
      }
    } catch (err) {
      console.error('Error rendering page:', err);
      this.pageRendering = false;
      throw err;
    }
  }

  previousPage(): void {
    if (this.currentPage <= 1) return;
    
    this.currentPage--;
    this.queueRenderPage(this.currentPage);
  }

  nextPage(): void {
    if (this.currentPage >= this.totalPages) return;
    
    this.currentPage++;
    this.queueRenderPage(this.currentPage);
  }

  private queueRenderPage(pageNum: number): void {
    if (this.pageRendering) {
      this.pageNumPending = pageNum;
    } else {
      this.renderPage(pageNum);
    }
  }

  download(): void {
    const blob = new Blob([this.data.pdfData], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }
}