import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import {
  MovePageDialogComponent,
  MovePageDialogData,
} from './move-page-dialog.component';
import {
  PagePreviewDialogComponent,
  PagePreviewDialogData,
} from './page-preview-dialog.component';
import {
  PageRangeDialogComponent,
  PageRangeDialogData,
} from './page-range-dialog.component';
import { PageSelection, PdfMergerService } from './pdf-merger.service';

@Component({
  selector: 'app-pdf-merger',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatListModule,
    MatChipsModule,
    MatCheckboxModule,
    MatTooltipModule,
    DragDropModule,
  ],
  template: `
    <div class="merger-container">
      <!-- Empty State -->
      <div *ngIf="!(documents$ | async)?.length" class="empty-state">
        <div class="empty-state-content">
          <!-- Browser Recommendation Notice -->
          <div class="browser-notice">
            <mat-icon>info</mat-icon>
            <div class="notice-content">
              <span class="notice-title">Recommended:</span>
              <span class="notice-text"
                >Use Firefox for large PDFs (&gt;20MB). Chrome may have memory
                limits.</span
              >
            </div>
          </div>
          <div class="empty-state-header">
            <div class="empty-state-icon">
              <mat-icon>merge</mat-icon>
            </div>
            <h2>Start Merging PDFs</h2>
          </div>

          <div
            class="upload-area"
            [class.drag-over]="isDragOver"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            (click)="fileInput.click()"
          >
            <input
              #fileInput
              type="file"
              accept=".pdf"
              multiple
              (change)="onFilesSelected($event)"
              style="display: none"
            />

            <div class="upload-content">
              <mat-icon class="upload-icon">cloud_upload</mat-icon>
              <h3>Drop PDF files here</h3>
              <p>or click to browse and select files</p>
              <button mat-raised-button color="primary" class="upload-btn">
                <mat-icon>upload_file</mat-icon>
                Choose PDF Files
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Working State -->
      <div *ngIf="(documents$ | async)?.length" class="working-state">
        <!-- Browser Recommendation Notice -->
        <div class="browser-notice">
          <mat-icon>info</mat-icon>
          <div class="notice-content">
            <span class="notice-title">Recommended:</span>
            <span class="notice-text"
              >Use Firefox for large PDFs (&gt;20MB). Chrome may have memory
              limits.</span
            >
          </div>
        </div>

        <div class="combined-header">
          <div class="header-left">
            <button mat-icon-button (click)="goBack()" class="back-btn">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="header-info">
              <mat-icon class="header-icon">merge</mat-icon>
              <div class="header-text">
                <h2>PDF Merger</h2>
                <p>Combine multiple PDF files into one document</p>
              </div>
            </div>
          </div>
          <button
            mat-raised-button
            color="primary"
            (click)="fileInputWorking.click()"
            [disabled]="isProcessing$ | async"
            class="add-more-btn"
          >
            <mat-icon>add</mat-icon>
            Add More Files
          </button>
          <input
            #fileInputWorking
            type="file"
            accept=".pdf"
            multiple
            (change)="onFilesSelected($event)"
            style="display: none"
          />
        </div>

        <div class="documents-section" *ngIf="(documents$ | async)?.length">
          <h3>Selected PDFs</h3>

          <div class="document-list">
            <div
              *ngFor="let doc of documents$ | async; let i = index"
              class="document-item"
            >
              <div class="document-icon">
                <mat-icon>picture_as_pdf</mat-icon>
              </div>
              <div class="document-info">
                <div class="document-name" [title]="doc.name">
                  {{ getTruncatedFileName(doc.name) }}
                </div>
                <div class="document-pages">
                  {{ doc.selectedPageNumbers?.length || doc.pageCount }} of
                  {{ doc.pageCount }} pages
                  <span
                    *ngIf="
                      doc.pageRange && doc.pageRange !== '1-' + doc.pageCount
                    "
                    class="page-range"
                  >
                    ({{ doc.pageRange }})
                  </span>
                </div>
              </div>
              <div class="document-actions">
                <button
                  mat-icon-button
                  (click)="openPageRangeDialog(i)"
                  class="action-btn settings-btn"
                  matTooltip="Page range settings"
                >
                  <mat-icon>settings</mat-icon>
                </button>
                <button
                  mat-icon-button
                  (click)="removeDocument(i)"
                  class="action-btn remove-btn"
                  matTooltip="Remove document"
                >
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          class="selected-pages-section"
          *ngIf="(selectedPages$ | async)?.length"
        >
          <h3>Page Order</h3>
          <p class="hint">Drag pages to reorder them</p>

          <div
            cdkDropList
            (cdkDropListDropped)="dropPage($event)"
            class="pages-list"
          >
            <div
              *ngFor="let page of selectedPages$ | async; let i = index"
              cdkDrag
              class="page-item"
            >
              <mat-icon cdkDragHandle>drag_indicator</mat-icon>
              <span
                class="page-info"
                [title]="page.documentName + ' - Page ' + page.pageNumber"
                >{{ getTruncatedFileName(page.documentName) }} - Page
                {{ page.pageNumber }}</span
              >
              <div class="page-actions">
                <button
                  mat-icon-button
                  (click)="openPagePreview(i)"
                  matTooltip="Preview page"
                  class="preview-btn"
                >
                  <mat-icon>preview</mat-icon>
                </button>
                <button
                  mat-icon-button
                  (click)="openMovePageDialog(i)"
                  matTooltip="Move to specific position"
                  class="move-btn"
                >
                  <mat-icon>open_with</mat-icon>
                </button>
                <button
                  mat-icon-button
                  (click)="removePageFromOrder(i)"
                  matTooltip="Remove from order"
                  class="remove-btn"
                >
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          *ngIf="isMerging && (progress$ | async) as progress"
          class="progress-section"
        >
          <div class="progress-info">
            <span class="progress-message">{{ progress.message }}</span>
            <span class="progress-stats"
              >{{ progress.current }} / {{ progress.total }} ({{
                progress.percentage
              }}%)</span
            >
          </div>
          <mat-progress-bar
            mode="determinate"
            [value]="progress.percentage"
          ></mat-progress-bar>
        </div>

        <mat-progress-bar
          *ngIf="isMerging && (isProcessing$ | async) && !(progress$ | async)"
          mode="indeterminate"
        ></mat-progress-bar>

        <div class="error-message" *ngIf="error$ | async as error">
          <mat-icon>error</mat-icon>
          {{ error }}
        </div>

        <div class="action-buttons" *ngIf="(selectedPages$ | async)?.length">
          <button
            mat-raised-button
            color="accent"
            (click)="previewMerged()"
            [disabled]="isProcessing$ | async"
          >
            <mat-icon>preview</mat-icon>
            Preview Merged PDF
          </button>

          <button
            mat-raised-button
            color="primary"
            (click)="downloadMerged()"
            [disabled]="isProcessing$ | async"
          >
            <mat-icon>download</mat-icon>
            Download Merged PDF
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .merger-container {
        min-height: 70vh;
        display: flex;
        flex-direction: column;
      }

      /* Browser Notice Styles */
      .browser-notice {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px 20px;
        margin-bottom: 24px;
        background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
        border: 1px solid #2196f3;
        border-radius: 8px;
        color: #1565c0;
        box-shadow: 0 2px 8px rgba(33, 150, 243, 0.1);
      }

      .browser-notice mat-icon {
        color: #2196f3;
        margin-top: 2px;
        flex-shrink: 0;
      }

      .notice-content {
        flex: 1;
        font-size: 14px;
        line-height: 1.5;
      }

      .notice-title {
        color: #0d47a1;
        font-weight: 600;
        margin-right: 6px;
      }

      .notice-text {
        color: #1565c0;
      }

      /* Empty State Styles */
      .empty-state {
        display: flex;
        align-items: flex-start;
        justify-content: center;
        min-height: 50vh;
        padding: 10px 20px 20px 20px;
      }

      .empty-state-content {
        text-align: center;
        max-width: 800px;
        width: 100%;
      }

      .empty-state-header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 24px;
      }

      .empty-state-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        color: white;
        flex-shrink: 0;
      }

      .empty-state-icon mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .empty-state h2 {
        font-size: 1.5rem;
        margin: 0;
        color: #333;
        font-weight: 400;
      }

      .upload-area {
        border: 2px dashed #ddd;
        border-radius: 12px;
        padding: 20px 20px;
        margin: 0 auto 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        background: #fafafa;
        width: auto;
        max-width: 600px;
      }

      .upload-area:hover {
        border-color: #2196f3;
        background: #f3f8ff;
      }

      .upload-area.drag-over {
        border-color: #2196f3;
        background: #e3f2fd;
        transform: scale(1.02);
      }

      .upload-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .upload-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #2196f3;
      }

      .upload-content h3 {
        margin: 0;
        font-size: 1.4rem;
        color: #333;
        font-weight: 500;
      }

      .upload-content p {
        margin: 0;
        color: #666;
        font-size: 1rem;
      }

      .upload-btn {
        margin-top: 8px;
      }

      /* Working State Styles */
      .working-state {
        flex: 1;
      }

      .combined-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 32px;
        padding: 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        color: white;
        gap: 20px;
        min-height: 80px;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
        min-width: 0;
      }

      .back-btn {
        color: white;
        background: rgba(255, 255, 255, 0.1);
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .back-btn:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .back-btn mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .header-info {
        display: flex;
        align-items: center;
        gap: 16px;
        flex: 1;
        min-width: 0;
      }

      .header-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        flex-shrink: 0;
      }

      .header-text {
        flex: 1;
        min-width: 0;
      }

      .header-text h2 {
        margin: 0 0 4px 0;
        font-weight: 400;
        font-size: 1.5rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .header-text p {
        margin: 0;
        opacity: 0.9;
        font-size: 0.9rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .add-more-btn {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.3);
        flex-shrink: 0;
        white-space: nowrap;
      }

      .add-more-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .documents-section {
        margin-bottom: 32px;
      }

      .documents-section h3 {
        margin-bottom: 20px;
        color: #333;
        font-weight: 600;
        font-size: 1.25rem;
      }

      .document-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .document-item {
        display: flex;
        align-items: center;
        padding: 16px 20px;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        transition: all 0.2s ease;
        gap: 16px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }

      .document-item:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border-color: #ccc;
      }

      .document-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: #f44336;
        border-radius: 6px;
        color: white;
        flex-shrink: 0;
      }

      .document-icon mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .document-info {
        flex: 1;
        min-width: 0;
      }

      .document-name {
        font-weight: 500;
        color: #333;
        font-size: 1rem;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        line-height: 1.3;
      }

      .document-pages {
        font-size: 13px;
        color: #666;
        white-space: nowrap;
      }

      .page-range {
        font-size: 12px;
        color: #888;
        margin-left: 4px;
      }

      .document-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
      }

      .action-btn {
        width: 36px;
        height: 36px;
        min-width: 36px;
        min-height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        margin: 0;
      }

      .action-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        line-height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .settings-btn:hover {
        background-color: rgba(0, 0, 0, 0.04);
      }

      .remove-btn:hover {
        background-color: rgba(244, 67, 54, 0.04);
        color: #f44336;
      }

      .selected-pages-section {
        margin-bottom: 32px;
      }

      .selected-pages-section h3 {
        margin-bottom: 16px;
        color: #333;
        font-weight: 600;
        font-size: 1.25rem;
      }

      .hint {
        color: #666;
        font-size: 14px;
        margin-bottom: 16px;
      }

      .pages-list {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 16px;
        min-height: 400px;
        max-height: 600px;
        overflow-y: auto;
        background: #fafafa;
      }

      .page-item {
        display: flex;
        align-items: center;
        padding: 12px;
        margin-bottom: 8px;
        background: white;
        border-radius: 6px;
        cursor: move;
        border: 1px solid #e8e8e8;
        transition: all 0.2s ease;
      }

      .page-item:hover {
        background: #f5f5f5;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .page-item mat-icon:first-child {
        margin-right: 12px;
        cursor: move;
        color: #999;
      }

      .page-info {
        flex: 1;
        margin-right: 12px;
        font-weight: 500;
        color: #333;
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .page-actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .preview-btn,
      .move-btn,
      .page-actions .remove-btn {
        opacity: 0.7;
        transition: opacity 0.2s;
      }

      .page-item:hover .preview-btn,
      .page-item:hover .move-btn,
      .page-item:hover .page-actions .remove-btn {
        opacity: 1;
      }

      .preview-btn:hover {
        background-color: rgba(33, 150, 243, 0.04);
        color: #2196f3;
      }

      .progress-section {
        margin: 16px 0;
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 4px solid #2196f3;
      }

      .progress-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        gap: 16px;
      }

      .progress-message {
        font-weight: 500;
        color: #333;
        flex: 1;
      }

      .progress-stats {
        font-size: 0.9rem;
        color: #666;
        font-weight: 400;
        flex-shrink: 0;
      }

      .error-message {
        color: #f44336;
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 16px 0;
        padding: 12px;
        background: #ffebee;
        border-radius: 6px;
        border-left: 4px solid #f44336;
      }

      .action-buttons {
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-top: 32px;
        padding: 24px;
        background: #f8f9fa;
        border-radius: 8px;
      }

      .action-buttons button {
        min-width: 160px;
      }

      /* Drag and Drop Styles */
      .cdk-drag-preview {
        box-sizing: border-box;
        border-radius: 6px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        background: white;
      }

      .cdk-drag-placeholder {
        opacity: 0.4;
        background: #e3f2fd;
        border: 2px dashed #2196f3;
      }

      .cdk-drag-animating {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .merger-container {
          padding: 0;
          margin: 0;
        }

        .browser-notice {
          padding: 8px 12px;
          margin: 0 0 12px 0;
          gap: 8px;
          flex-direction: row;
          align-items: flex-start;
          border-radius: 6px;
          font-size: 11px;
        }

        .browser-notice mat-icon {
          margin-top: 1px;
          font-size: 16px;
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .notice-content {
          font-size: 11px;
          line-height: 1.3;
          flex: 1;
          min-width: 0;
        }

        .notice-title {
          display: inline;
          margin-right: 4px;
        }

        .notice-text {
          display: inline;
        }

        .empty-state {
          min-height: auto;
          padding: 10px;
        }

        .empty-state-content {
          padding: 0;
          max-width: 100%;
          width: 100%;
        }

        .upload-area {
          padding: 30px 15px;
          margin: 0 0 15px 0;
          min-height: auto;
        }

        .upload-content {
          gap: 12px;
        }

        .upload-content h3 {
          font-size: 1.2rem;
          margin: 0;
        }

        .upload-content p {
          font-size: 0.9rem;
          margin: 0;
        }

        .upload-icon {
          font-size: 36px !important;
          width: 36px !important;
          height: 36px !important;
        }

        .working-state {
        }

        .working-state .browser-notice {
          margin: 0 0 12px 0;
        }

        .empty-state-header {
          gap: 8px;
          margin-bottom: 15px;
        }

        .empty-state-icon {
          width: 36px;
          height: 36px;
        }

        .empty-state-icon mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        .empty-state h2 {
          font-size: 1.2rem;
          margin: 0;
        }

        .combined-header {
          flex-direction: column;
          gap: 16px;
          text-align: center;
          padding: 16px;
          min-height: auto;
          margin: 0 -10px 20px -10px;
        }

        .header-left {
          flex-direction: row;
          justify-content: center;
          width: 100%;
        }

        .header-text h2 {
          font-size: 1.3rem;
          white-space: normal;
        }

        .header-text p {
          font-size: 0.85rem;
          white-space: normal;
        }

        .add-more-btn {
          width: 100%;
          max-width: 200px;
        }

        .document-item {
          padding: 12px 16px;
          gap: 12px;
        }

        .document-info {
          min-width: 0;
          flex: 1;
        }

        .document-name {
          font-size: 0.9rem;
        }

        .document-pages {
          font-size: 12px;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          min-width: 32px;
          min-height: 32px;
        }

        .action-btn mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }

        .action-buttons {
          flex-direction: column;
        }

        .action-buttons button {
          width: 100%;
        }

        .progress-info {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .progress-stats {
          align-self: flex-end;
        }
      }
    `,
  ],
})
export class PdfMergerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  documents$;
  selectedPages$;
  isProcessing$;
  progress$;
  error$;
  isDragOver = false;
  isMerging = false;

  constructor(
    private pdfMergerService: PdfMergerService,
    private dialog: MatDialog,
    private router: Router
  ) {
    this.documents$ = this.pdfMergerService.documents$;
    this.selectedPages$ = this.pdfMergerService.selectedPages$;
    this.isProcessing$ = this.pdfMergerService.isProcessing$;
    this.progress$ = this.pdfMergerService.progress$;
    this.error$ = this.pdfMergerService.error$;
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Clean up PDF merger service resources
    this.pdfMergerService.clearAllResources();
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const files = Array.from(input.files);
    await this.pdfMergerService.addFiles(files);

    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = Array.from(event.dataTransfer?.files || []).filter(
      (file) => file.type === 'application/pdf'
    );

    if (files.length > 0) {
      await this.pdfMergerService.addFiles(files);
    }
  }

  removeDocument(index: number): void {
    this.pdfMergerService.removeDocument(index);
  }

  dropPage(event: CdkDragDrop<PageSelection[]>): void {
    this.pdfMergerService.reorderPages(event.previousIndex, event.currentIndex);
  }

  removePageFromOrder(index: number): void {
    this.pdfMergerService.removePageFromOrder(index);
  }

  async previewMerged(): Promise<void> {
    this.isMerging = true;
    try {
      await this.pdfMergerService.previewMerged();
    } finally {
      this.isMerging = false;
    }
  }

  async downloadMerged(): Promise<void> {
    this.isMerging = true;
    try {
      await this.pdfMergerService.downloadMerged();
    } finally {
      this.isMerging = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/pdf-tools']);
  }

  openPageRangeDialog(docIndex: number): void {
    const documents = this.pdfMergerService.getCurrentDocuments();
    const doc = documents[docIndex];

    if (!doc) return;

    const dialogData: PageRangeDialogData = {
      documentName: doc.name,
      totalPages: doc.pageCount,
      currentPageRange: doc.pageRange || `1-${doc.pageCount}`,
    };

    const dialogRef = this.dialog.open(PageRangeDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.pdfMergerService.updateDocumentPageRange(
          docIndex,
          result.pageRange,
          result.selectedPages
        );
      }
    });
  }

  openPagePreview(pageIndex: number): void {
    let selectedPages: PageSelection[] = [];
    this.pdfMergerService.selectedPages$
      .subscribe((pages) => {
        selectedPages = pages;
      })
      .unsubscribe();

    const page = selectedPages[pageIndex];
    if (!page) return;

    const documents = this.pdfMergerService.getCurrentDocuments();
    const document = documents[page.documentIndex];
    if (!document) return;

    // Prepare all pages with their document info for navigation
    const allPages = selectedPages.map((p) => {
      const doc = documents[p.documentIndex];
      return {
        documentIndex: p.documentIndex,
        documentName: p.documentName,
        pageNumber: p.pageNumber,
        pageIndex: p.pageIndex,
        file: doc.file,
        pdfDoc: doc.pdfDoc,
      };
    });

    const dialogData: PagePreviewDialogData = {
      file: document.file,
      pageNumber: page.pageNumber,
      documentName: page.documentName,
      pdfDoc: document.pdfDoc,
      allPages: allPages,
      currentPageIndex: pageIndex,
    };

    this.dialog.open(PagePreviewDialogComponent, {
      width: '90%',
      maxWidth: '1200px',
      maxHeight: '90vh',
      data: dialogData,
    });
  }

  openMovePageDialog(pageIndex: number): void {
    let selectedPages: PageSelection[] = [];
    this.pdfMergerService.selectedPages$
      .subscribe((pages) => {
        selectedPages = pages;
      })
      .unsubscribe();

    const page = selectedPages[pageIndex];
    if (!page) return;

    const dialogData: MovePageDialogData = {
      currentPosition: pageIndex + 1, // Convert to 1-based
      totalPages: selectedPages.length,
      pageName: `${this.getTruncatedFileName(page.documentName)} - Page ${
        page.pageNumber
      }`,
    };

    const dialogRef = this.dialog.open(MovePageDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.pdfMergerService.movePageToPosition(
          pageIndex,
          result.newPosition - 1
        ); // Convert back to 0-based
      }
    });
  }

  getTruncatedFileName(fileName: string): string {
    // Check if we're on mobile
    const isMobile = window.innerWidth <= 768;
    const maxLength = isMobile ? 25 : 50;
    const maxNameLength = isMobile ? 20 : 40;

    if (fileName.length <= maxLength) return fileName;

    const extension = fileName.substring(fileName.lastIndexOf('.'));
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));

    if (nameWithoutExt.length <= maxNameLength) return fileName;

    return nameWithoutExt.substring(0, maxNameLength) + '...' + extension;
  }
}
