import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Observable } from 'rxjs';
import { PdfPreviewComponent } from '../pdf-preview/pdf-preview.component';
import { PdfSplitterService, PdfSplitterState } from './pdf-splitter.service';

@Component({
  selector: 'app-pdf-splitter',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    PdfPreviewComponent,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-icon mat-card-avatar>file_copy</mat-icon>
        <mat-card-title>PDF Splitter</mat-card-title>
        <mat-card-subtitle>Split PDF into single pages</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div
          *ngIf="(state$ | async)?.selectedFile as selectedFile"
          class="file-info"
        >
          <p>Selected file: {{ selectedFile.name }}</p>
          <mat-progress-bar
            *ngIf="(state$ | async)?.isProcessing"
            mode="indeterminate"
            color="primary"
          ></mat-progress-bar>

          <app-pdf-preview [file]="selectedFile"></app-pdf-preview>
        </div>
        <p *ngIf="(state$ | async)?.error" class="error-message">
          {{ (state$ | async)?.error }}
        </p>
      </mat-card-content>

      <mat-card-actions>
        <input
          #fileInput
          type="file"
          accept=".pdf"
          (change)="onFileSelected($event)"
          style="display: none"
        />
        <button mat-raised-button color="primary" (click)="fileInput.click()">
          <mat-icon>upload_file</mat-icon>
          Select PDF
        </button>
        <button
          mat-raised-button
          color="primary"
          [disabled]="
            !(state$ | async)?.selectedFile || (state$ | async)?.isProcessing
          "
          (click)="splitPdf()"
        >
          <mat-icon>call_split</mat-icon>
          Split PDF
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [
    `
      mat-card {
        max-width: 600px;
        margin: 20px auto;
      }

      mat-card-actions {
        display: flex;
        gap: 8px;
        padding: 16px;
      }

      .file-info {
        padding: 16px;
      }

      .error-message {
        color: var(--mat-warn-500);
        padding: 8px 16px;
      }
    `,
  ],
})
export class PdfSplitterComponent implements OnInit {
  state$: Observable<PdfSplitterState>;

  constructor(private pdfSplitterService: PdfSplitterService) {
    this.state$ = this.pdfSplitterService.state$;
  }

  ngOnInit(): void {
    this.pdfSplitterService.reset();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.pdfSplitterService.setSelectedFile(input.files[0]);
    }
  }

  async splitPdf(): Promise<void> {
    this.pdfSplitterService.setProcessing(true);
    try {
      // TODO: Implement PDF splitting logic
      console.log(
        'Splitting PDF:',
        (await this.state$.toPromise())?.selectedFile?.name
      );
    } catch (error) {
      this.pdfSplitterService.setError('Failed to split PDF');
      console.error('Error splitting PDF:', error);
    } finally {
      this.pdfSplitterService.setProcessing(false);
    }
  }
}
