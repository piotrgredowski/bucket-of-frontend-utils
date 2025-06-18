import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { pdfjsLib } from '../pdf-config';
import { PagePreviewDialogComponent } from './page-preview-dialog.component';

@Component({
  selector: 'app-pdf-preview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
  ],
  template: `
    <div class="preview-container">
      <div *ngIf="isLoading" class="loading-overlay">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <mat-list *ngIf="pages.length">
        <mat-list-item
          *ngFor="let page of pages; let i = index"
          class="page-item"
        >
          <img
            matListItemAvatar
            [src]="page"
            [alt]="'Page ' + (i + 1)"
            class="page-thumbnail"
          />
          <span matListItemTitle>Page {{ i + 1 }}</span>
          <button mat-icon-button matListItemMeta (click)="openPreview(i)">
            <mat-icon>zoom_in</mat-icon>
          </button>
        </mat-list-item>
      </mat-list>

      <div *ngIf="error" class="error-message">
        {{ error }}
      </div>
    </div>
  `,
  styles: [
    `
      .preview-container {
        position: relative;
        min-height: 200px;
      }

      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(255, 255, 255, 0.8);
        z-index: 1;
      }

      .page-item {
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      }

      .page-thumbnail {
        width: 40px;
        height: 40px;
        object-fit: cover;
        border-radius: 4px;
      }

      .error-message {
        color: var(--mat-warn-500);
        text-align: center;
        padding: 16px;
      }
    `,
  ],
})
export class PdfPreviewComponent implements OnChanges, OnDestroy {
  @Input() file: File | null = null;

  pages: string[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private dialog: MatDialog) {}

  ngOnDestroy(): void {
    // Clean up canvas data URLs to free memory
    this.pages.forEach(pageUrl => {
      if (pageUrl.startsWith('data:')) {
        // Canvas data URLs hold references to ArrayBuffers
        // Clear the array to help garbage collection
        try {
          URL.revokeObjectURL(pageUrl);
        } catch (error) {
          // Data URLs can't be revoked, but we clear the array anyway
        }
      }
    });
    this.pages = [];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['file'] && this.file) {
      this.loadPdfPreview();
    }
  }

  private async loadPdfPreview(): Promise<void> {
    if (!this.file) return;

    this.isLoading = true;
    this.error = null;
    this.pages = [];

    let arrayBuffer: ArrayBuffer | null = null;
    let pdf: pdfjsLib.PDFDocumentProxy | null = null;

    try {
      arrayBuffer = await this.file.arrayBuffer();
      pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

      // Clear ArrayBuffer immediately after loading
      arrayBuffer = null;

      const pagePromises = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        pagePromises.push(this.renderPage(pdf, i));
      }

      this.pages = await Promise.all(pagePromises);
    } catch (error) {
      console.error('Error loading PDF preview:', error);
      this.error = 'Failed to load PDF preview';
    } finally {
      // Clean up resources
      arrayBuffer = null;
      if (pdf) {
        try {
          pdf.destroy();
        } catch (cleanupError) {
          console.warn('Failed to destroy PDF:', cleanupError);
        }
      }
      pdf = null;
      this.isLoading = false;
    }
  }

  openPreview(pageIndex: number): void {
    this.dialog.open(PagePreviewDialogComponent, {
      data: {
        pageUrl: this.pages[pageIndex],
        pageNumber: pageIndex + 1,
      },
      maxWidth: '90vw',
      maxHeight: '90vh',
    });
  }

  private async renderPage(
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNumber: number
  ): Promise<string> {
    let page: pdfjsLib.PDFPageProxy | null = null;
    let canvas: HTMLCanvasElement | null = null;
    
    try {
      page = await pdf.getPage(pageNumber);

      // Much smaller scale for thumbnails to reduce memory usage
      const scale = 0.5; // Reduced from 1 to 0.5
      const viewport = page.getViewport({ scale });

      canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // Use JPEG with compression
      
      return dataUrl;
    } finally {
      // Clean up page resources
      if (page) {
        try {
          page.cleanup();
        } catch (error) {
          console.warn('Failed to cleanup page:', error);
        }
        page = null;
      }
      
      // Clear canvas
      if (canvas) {
        const context = canvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
        }
        canvas.width = 0;
        canvas.height = 0;
        canvas = null;
      }
    }
  }
}
