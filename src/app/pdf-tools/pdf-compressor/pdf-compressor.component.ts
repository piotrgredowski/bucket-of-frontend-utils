import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { Router } from '@angular/router';
import {
  PDF_COMPRESSION_PRESETS,
  PdfCompressionPreset,
  PdfCompressionProgress,
  PdfCompressorService,
} from './pdf-compressor.service';

@Component({
  selector: 'app-pdf-compressor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatRadioModule,
  ],
  template: `
    <div class="compressor-container">
      <div class="page-heading">
        <button mat-icon-button type="button" (click)="goBack()" aria-label="Back to PDF tools">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <div class="eyebrow"><mat-icon>lock</mat-icon> 100% local in your browser</div>
          <h2>Compress PDF</h2>
          <p>Optimize image-heavy PDFs without uploading your file to a server.</p>
        </div>
      </div>

      <mat-card *ngIf="!selectedFile" class="upload-card">
        <mat-card-content>
          <div
            class="dropzone"
            [class.drag-over]="isDragOver"
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            (click)="fileInput.click()"
            tabindex="0"
            role="button"
            aria-label="Choose a PDF file"
            (keydown.enter)="fileInput.click()"
            (keydown.space)="fileInput.click(); $event.preventDefault()"
          >
            <input #fileInput type="file" accept="application/pdf,.pdf" (change)="onFileSelected($event)" hidden />
            <div class="upload-icon"><mat-icon>compress</mat-icon></div>
            <h3>Drop your PDF here</h3>
            <p>or choose a file from your device</p>
            <button mat-raised-button color="primary" type="button" (click)="fileInput.click(); $event.stopPropagation()">
              <mat-icon>upload_file</mat-icon>
              Choose PDF
            </button>
            <span class="upload-hint">Your file stays on your device</span>
          </div>
        </mat-card-content>
      </mat-card>

      <div *ngIf="selectedFile" class="workspace">
        <mat-card class="file-card">
          <mat-card-content>
            <div class="file-heading">
              <div class="file-icon"><mat-icon>picture_as_pdf</mat-icon></div>
              <div class="file-name-wrap">
                <strong [title]="selectedFile.name">{{ selectedFile.name }}</strong>
                <span>{{ formatBytes(selectedFile.size) }}</span>
              </div>
              <button mat-icon-button type="button" (click)="reset()" [disabled]="isProcessing" aria-label="Remove selected file">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <mat-divider></mat-divider>
            <div class="privacy-note">
              <mat-icon>verified_user</mat-icon>
              <span>Your PDF never leaves the browser. Processing happens locally.</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="settings-card">
          <mat-card-header>
            <mat-card-title>Ustawienia kompresji</mat-card-title>
            <mat-card-subtitle>Pages will be rebuilt as optimized JPEG images.</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <label class="field-label">Quality</label>
            <mat-radio-group class="preset-list" [(ngModel)]="selectedPresetId" [disabled]="isProcessing">
              <mat-radio-button *ngFor="let preset of presets" [value]="preset.id">
                <span class="preset-copy">
                  <strong>{{ preset.label }}</strong>
                  <small>{{ preset.description }}</small>
                </span>
              </mat-radio-button>
            </mat-radio-group>

            <mat-divider></mat-divider>

            <div class="target-row">
              <div>
                <label class="field-label" for="target-size">Maximum size (optional)</label>
                <small class="field-hint">If the result is larger, we will try a lower quality.</small>
              </div>
              <mat-form-field appearance="outline" class="target-field">
                <mat-label>Size</mat-label>
                <input id="target-size" matInput type="number" min="0.1" step="0.1" [(ngModel)]="targetSizeMb" [disabled]="isProcessing" />
                <span matTextSuffix>MB</span>
              </mat-form-field>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-stroked-button type="button" (click)="reset()" [disabled]="isProcessing">Change file</button>
            <button mat-raised-button color="primary" type="button" (click)="compress()" [disabled]="isProcessing || !selectedFile">
              <mat-icon>compress</mat-icon>
              {{ isProcessing ? 'Compressing…' : 'Compress PDF' }}
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <mat-card *ngIf="isProcessing" class="progress-card">
        <mat-card-content>
          <div class="progress-heading">
            <span>{{ progress?.message || 'Preparing document…' }}</span>
            <strong>{{ progress?.percentage || 0 }}%</strong>
          </div>
          <mat-progress-bar mode="determinate" [value]="progress?.percentage || 0"></mat-progress-bar>
          <small *ngIf="progress && progress.attempts > 1">Attempt {{ progress.attempt }} of {{ progress.attempts }} · {{ progress.preset.label }}</small>
        </mat-card-content>
      </mat-card>

      <div *ngIf="error" class="error-message" role="alert">
        <mat-icon>error</mat-icon>
        <span>{{ error }}</span>
      </div>

      <mat-card *ngIf="result" class="result-card">
        <mat-card-content>
          <div class="result-icon"><mat-icon>check_circle</mat-icon></div>
          <div class="result-copy">
            <h3>Your PDF is ready</h3>
            <p>
              {{ formatBytes(originalSize) }} → <strong>{{ formatBytes(result.bytes.length) }}</strong>
              <span *ngIf="reductionPercent > 0" class="reduction">({{ reductionPercent }}% mniej)</span>
            </p>
            <p *ngIf="targetSizeMb && result.bytes.length > targetSizeMb * 1024 * 1024" class="result-warning">
              We could not get below {{ targetSizeMb }} MB while keeping the document readable.
            </p>
            <p *ngIf="selectedPresetId !== result.preset.id" class="result-note">Used {{ result.preset.label.toLowerCase() }} to get closer to the target.</p>
          </div>
          <button mat-raised-button color="primary" type="button" (click)="download()">
            <mat-icon>download</mat-icon>
            Download PDF
          </button>
        </mat-card-content>
      </mat-card>

      <p class="tradeoff-note"><mat-icon>info</mat-icon> Image compression can remove selectable text, links, and form fields from the original PDF.</p>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .compressor-container { max-width: 860px; margin: 0 auto; }
      .page-heading { display: flex; align-items: flex-start; gap: 12px; margin: 8px 0 24px; }
      .page-heading h2 { margin: 4px 0 6px; font-size: 2rem; font-weight: 500; color: #263238; }
      .page-heading p { margin: 0; color: #607d8b; line-height: 1.5; }
      .eyebrow { display: flex; align-items: center; gap: 5px; color: #2e7d32; font-size: .82rem; font-weight: 500; }
      .eyebrow mat-icon { font-size: 16px; width: 16px; height: 16px; }
      .upload-card, .progress-card, .result-card { overflow: hidden; }
      .dropzone { min-height: 300px; border: 2px dashed #b0bec5; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 28px; text-align: center; cursor: pointer; transition: border-color 180ms ease, background-color 180ms ease; }
      .dropzone:hover, .dropzone:focus-visible, .dropzone.drag-over { border-color: #5e35b1; background: #f7f4fc; outline: none; }
      .upload-icon, .file-icon { display: flex; align-items: center; justify-content: center; }
      .upload-icon { width: 64px; height: 64px; margin-bottom: 18px; border-radius: 20px; color: #5e35b1; background: #ede7f6; }
      .upload-icon mat-icon { font-size: 34px; width: 34px; height: 34px; }
      .dropzone h3 { margin: 0 0 6px; font-size: 1.25rem; color: #263238; }
      .dropzone p { margin: 0 0 18px; color: #607d8b; }
      .upload-hint { margin-top: 16px; color: #78909c; font-size: .82rem; }
      .workspace { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.35fr); gap: 18px; align-items: start; }
      .file-card, .settings-card { height: 100%; }
      .file-heading { display: flex; align-items: center; gap: 12px; min-height: 56px; }
      .file-icon { flex: 0 0 42px; height: 42px; border-radius: 10px; background: #ffebee; color: #c62828; }
      .file-name-wrap { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 4px; }
      .file-name-wrap strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #263238; }
      .file-name-wrap span, .field-hint, .preset-copy small { color: #78909c; font-size: .82rem; }
      .privacy-note { display: flex; gap: 8px; align-items: flex-start; padding-top: 16px; color: #2e7d32; font-size: .84rem; line-height: 1.45; }
      .privacy-note mat-icon { flex: 0 0 auto; font-size: 19px; width: 19px; height: 19px; }
      .settings-card mat-card-header { padding-bottom: 16px; }
      .settings-card mat-card-content { padding-top: 0; }
      .field-label { display: block; margin-bottom: 10px; color: #455a64; font-size: .9rem; font-weight: 500; }
      .preset-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
      .preset-list mat-radio-button { min-height: 44px; }
      .preset-copy { display: flex; flex-direction: column; gap: 2px; margin-left: 4px; }
      .target-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding-top: 18px; }
      .target-row .field-label { margin-bottom: 4px; }
      .target-field { width: 124px; flex: 0 0 124px; }
      .settings-card mat-card-actions { justify-content: flex-end; gap: 8px; padding: 8px 16px 16px; }
      .progress-card { margin-top: 18px; }
      .progress-heading { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 10px; color: #455a64; }
      .progress-card small { display: block; margin-top: 9px; color: #78909c; }
      .error-message { display: flex; align-items: flex-start; gap: 8px; margin: 18px 0; padding: 14px 16px; border-radius: 8px; color: #b71c1c; background: #ffebee; line-height: 1.45; }
      .error-message mat-icon { flex: 0 0 auto; }
      .result-card { margin-top: 18px; border-left: 4px solid #2e7d32; }
      .result-card mat-card-content { display: flex; align-items: center; gap: 14px; }
      .result-icon { color: #2e7d32; }
      .result-icon mat-icon { font-size: 34px; width: 34px; height: 34px; }
      .result-copy { flex: 1; min-width: 0; }
      .result-copy h3 { margin: 0 0 4px; color: #263238; }
      .result-copy p { margin: 0; color: #607d8b; }
      .reduction { color: #2e7d32; font-weight: 500; }
      .result-warning { margin-top: 8px !important; color: #e65100 !important; font-size: .86rem; }
      .result-note { margin-top: 5px !important; font-size: .86rem; }
      .tradeoff-note { display: flex; gap: 7px; align-items: flex-start; margin: 18px 2px 0; color: #78909c; font-size: .82rem; line-height: 1.45; }
      .tradeoff-note mat-icon { flex: 0 0 auto; font-size: 17px; width: 17px; height: 17px; }
      @media (max-width: 700px) {
        .page-heading h2 { font-size: 1.65rem; }
        .workspace { grid-template-columns: 1fr; }
        .result-card mat-card-content { align-items: flex-start; flex-wrap: wrap; }
        .result-card button { width: 100%; }
      }
      @media (prefers-reduced-motion: reduce) { .dropzone { transition: none; } }
    `,
  ],
})
export class PdfCompressorComponent implements OnInit, OnDestroy {
  readonly presets = PDF_COMPRESSION_PRESETS;
  selectedPresetId = 'standard';
  targetSizeMb: number | null = 5;
  selectedFile: File | null = null;
  result: { bytes: Uint8Array; preset: PdfCompressionPreset } | null = null;
  progress: PdfCompressionProgress | null = null;
  originalSize = 0;
  error: string | null = null;
  isProcessing = false;
  isDragOver = false;
  private resultUrl: string | null = null;

  constructor(private compressor: PdfCompressorService, private router: Router) {}

  ngOnInit(): void { this.reset(); }

  ngOnDestroy(): void {
    if (this.resultUrl) URL.revokeObjectURL(this.resultUrl);
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); this.isDragOver = true; }
  onDragLeave(event: DragEvent): void { event.preventDefault(); this.isDragOver = false; }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.selectFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.selectFile(file);
    input.value = '';
  }

  async compress(): Promise<void> {
    if (!this.selectedFile) return;
    this.isProcessing = true;
    this.error = null;
    this.result = null;
    const selectedPreset = this.getSelectedPreset();
    const candidates = this.getCandidatePresets(selectedPreset);
    const targetBytes = this.getTargetBytes();

    try {
      for (let index = 0; index < candidates.length; index++) {
        const candidate = candidates[index];
        const compressed = await this.compressor.compressPdf(
          this.selectedFile,
          candidate,
          (progress) => (this.progress = progress),
          index + 1,
          candidates.length
        );
        this.result = compressed;
        if (!targetBytes || compressed.bytes.length <= targetBytes || index === candidates.length - 1) break;
      }
    } catch (error) {
      console.error('PDF compression failed:', error);
      this.error = this.getErrorMessage(error);
      this.result = null;
    } finally {
      this.isProcessing = false;
      this.progress = null;
    }
  }

  download(): void {
    if (!this.result || !this.selectedFile) return;
    const baseName = this.selectedFile.name.replace(/\.pdf$/i, '');
    const blob = new Blob([this.result.bytes], { type: 'application/pdf' });
    if (this.resultUrl) URL.revokeObjectURL(this.resultUrl);
    this.resultUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = this.resultUrl;
    link.download = `${baseName}-compressed.pdf`;
    link.click();
  }

  reset(): void {
    if (this.resultUrl) {
      URL.revokeObjectURL(this.resultUrl);
      this.resultUrl = null;
    }
    this.selectedFile = null;
    this.result = null;
    this.progress = null;
    this.error = null;
    this.originalSize = 0;
    this.isProcessing = false;
  }

  goBack(): void { this.router.navigate(['/pdf-tools']); }

  formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
  }

  get reductionPercent(): number {
    if (!this.result || !this.originalSize) return 0;
    return Math.max(0, Math.round((1 - this.result.bytes.length / this.originalSize) * 100));
  }

  private selectFile(file: File): void {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.error = 'Please choose a PDF file.';
      return;
    }
    this.selectedFile = file;
    this.originalSize = file.size;
    this.result = null;
    this.error = null;
  }

  private getSelectedPreset(): PdfCompressionPreset {
    return this.presets.find((preset) => preset.id === this.selectedPresetId) ?? this.presets[1];
  }

  private getCandidatePresets(selected: PdfCompressionPreset): PdfCompressionPreset[] {
    const selectedIndex = this.presets.findIndex((preset) => preset.id === selected.id);
    return this.presets.slice(selectedIndex);
  }

  private getTargetBytes(): number | null {
    return this.targetSizeMb && this.targetSizeMb > 0 ? this.targetSizeMb * 1024 * 1024 : null;
  }

  private getErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : '';
    if (/memory|allocation|heap/i.test(message)) {
      return 'The browser ran out of memory. Try a lower quality or close other tabs.';
    }
    return message || 'Could not compress the PDF. Check whether the file is damaged.';
  }
}
