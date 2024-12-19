import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();
@Component({
  selector: 'app-pdf-preview',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    <div class="preview-container">
      <div *ngIf="isLoading" class="loading-overlay">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div class="pages-grid" *ngIf="pages.length">
        <mat-card
          *ngFor="let page of pages; let i = index"
          class="page-preview"
        >
          <mat-card-header>
            <mat-card-title>Page {{ i + 1 }}</mat-card-title>
          </mat-card-header>
          <img [src]="page" [alt]="'Page ' + (i + 1)" />
        </mat-card>
      </div>

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

      .pages-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
        padding: 16px;
      }

      .page-preview {
        img {
          width: 100%;
          height: auto;
          object-fit: contain;
        }
      }

      .error-message {
        color: var(--mat-warn-500);
        text-align: center;
        padding: 16px;
      }
    `,
  ],
})
export class PdfPreviewComponent implements OnChanges {
  @Input() file: File | null = null;

  pages: string[] = [];
  isLoading = false;
  error: string | null = null;

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

    try {
      const arrayBuffer = await this.file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

      const pagePromises = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        pagePromises.push(this.renderPage(pdf, i));
      }

      this.pages = await Promise.all(pagePromises);
    } catch (error) {
      console.error('Error loading PDF preview:', error);
      this.error = 'Failed to load PDF preview';
    } finally {
      this.isLoading = false;
    }
  }

  private async renderPage(
    pdf: pdfjsLib.PDFDocumentProxy,
    pageNumber: number
  ): Promise<string> {
    const page = await pdf.getPage(pageNumber);
    const scale = 0.5;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get canvas context');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    return canvas.toDataURL();
  }
}
