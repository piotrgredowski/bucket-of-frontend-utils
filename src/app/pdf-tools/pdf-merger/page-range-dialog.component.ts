import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';

export interface PageRangeDialogData {
  documentName: string;
  totalPages: number;
  currentPageRange: string;
}

export interface PageRangeDialogResult {
  pageRange: string;
  selectedPages: number[];
}

@Component({
  selector: 'app-page-range-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>settings</mat-icon>
      Page Range Settings
    </h2>
    
    <mat-dialog-content>
      <div class="dialog-content">
        <h3>{{ data.documentName }}</h3>
        <p class="document-info">Total pages: {{ data.totalPages }}</p>
        
        <mat-form-field class="full-width">
          <mat-label>Page Range</mat-label>
          <input
            matInput
            [(ngModel)]="pageRange"
            (input)="parsePageRange()"
            placeholder="e.g., 1-3, 5, 7-10"
            [class.error]="hasError"
          />
          <mat-hint>
            Enter page numbers and ranges separated by commas
          </mat-hint>
          <mat-error *ngIf="hasError">{{ errorMessage }}</mat-error>
        </mat-form-field>
        
        <div class="quick-actions">
          <button mat-button (click)="selectAll()">Select All</button>
          <button mat-button (click)="selectOdd()">Odd Pages</button>
          <button mat-button (click)="selectEven()">Even Pages</button>
          <button mat-button (click)="clearSelection()">Clear</button>
        </div>
        
        <div class="preview-section" *ngIf="selectedPages.length > 0">
          <h4>Selected Pages ({{ selectedPages.length }})</h4>
          <div class="page-chips">
            <mat-chip-set>
              <mat-chip *ngFor="let page of selectedPages" [removable]="true" (removed)="removePage(page)">
                {{ page }}
                <mat-icon matChipRemove>cancel</mat-icon>
              </mat-chip>
            </mat-chip-set>
          </div>
        </div>
        
        <div class="individual-pages" *ngIf="data.totalPages <= 20">
          <h4>Or select individual pages:</h4>
          <div class="page-checkboxes">
            <mat-checkbox
              *ngFor="let page of allPages"
              [checked]="selectedPages.includes(page)"
              (change)="togglePage(page, $event.checked)"
            >
              {{ page }}
            </mat-checkbox>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="selectedPages.length === 0"
        (click)="save()"
      >
        Apply ({{ selectedPages.length }} pages)
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 500px;
      max-width: 700px;
      padding: 8px;
    }
    
    .document-info {
      color: #666;
      margin-bottom: 24px;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 24px;
    }
    
    .full-width .mat-mdc-form-field {
      width: 100%;
    }
    
    .full-width .mat-mdc-text-field-wrapper {
      width: 100%;
    }
    
    .quick-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    
    .preview-section {
      margin: 24px 0;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    
    .preview-section h4 {
      margin: 0 0 8px 0;
      color: #333;
    }
    
    .page-chips {
      max-height: 100px;
      overflow-y: auto;
    }
    
    .individual-pages {
      margin-top: 24px;
    }
    
    .individual-pages h4 {
      margin-bottom: 12px;
    }
    
    .page-checkboxes {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 8px;
      max-height: 200px;
      overflow-y: auto;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    
    .error {
      border-color: #f44336 !important;
    }
    
    mat-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
    }
  `]
})
export class PageRangeDialogComponent implements OnInit {
  pageRange: string = '';
  selectedPages: number[] = [];
  allPages: number[] = [];
  hasError = false;
  errorMessage = '';

  constructor(
    public dialogRef: MatDialogRef<PageRangeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PageRangeDialogData
  ) {}

  ngOnInit(): void {
    this.pageRange = this.data.currentPageRange || '';
    this.allPages = Array.from({ length: this.data.totalPages }, (_, i) => i + 1);
    
    if (this.pageRange) {
      this.parsePageRange();
    } else {
      this.selectAll();
    }
  }

  parsePageRange(): void {
    this.hasError = false;
    this.errorMessage = '';
    
    if (!this.pageRange.trim()) {
      this.selectedPages = [];
      return;
    }

    try {
      const pages = new Set<number>();
      const parts = this.pageRange.split(',').map(part => part.trim());
      
      for (const part of parts) {
        if (!part) continue;
        
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(num => parseInt(num.trim()));
          
          if (isNaN(start) || isNaN(end)) {
            throw new Error(`Invalid range: ${part}`);
          }
          
          if (start < 1 || end > this.data.totalPages || start > end) {
            throw new Error(`Range ${part} is outside valid page range (1-${this.data.totalPages})`);
          }
          
          for (let i = start; i <= end; i++) {
            pages.add(i);
          }
        } else {
          const pageNum = parseInt(part);
          
          if (isNaN(pageNum)) {
            throw new Error(`Invalid page number: ${part}`);
          }
          
          if (pageNum < 1 || pageNum > this.data.totalPages) {
            throw new Error(`Page ${pageNum} is outside valid range (1-${this.data.totalPages})`);
          }
          
          pages.add(pageNum);
        }
      }
      
      this.selectedPages = Array.from(pages).sort((a, b) => a - b);
    } catch (error) {
      this.hasError = true;
      this.errorMessage = error instanceof Error ? error.message : 'Invalid page range format';
      this.selectedPages = [];
    }
  }

  selectAll(): void {
    this.pageRange = `1-${this.data.totalPages}`;
    this.parsePageRange();
  }

  selectOdd(): void {
    const oddPages = this.allPages.filter(page => page % 2 === 1);
    this.pageRange = oddPages.join(', ');
    this.parsePageRange();
  }

  selectEven(): void {
    const evenPages = this.allPages.filter(page => page % 2 === 0);
    this.pageRange = evenPages.join(', ');
    this.parsePageRange();
  }

  clearSelection(): void {
    this.pageRange = '';
    this.selectedPages = [];
  }

  togglePage(page: number, checked: boolean): void {
    if (checked) {
      if (!this.selectedPages.includes(page)) {
        this.selectedPages.push(page);
        this.selectedPages.sort((a, b) => a - b);
      }
    } else {
      this.selectedPages = this.selectedPages.filter(p => p !== page);
    }
    
    this.updatePageRangeFromSelection();
  }

  removePage(page: number): void {
    this.selectedPages = this.selectedPages.filter(p => p !== page);
    this.updatePageRangeFromSelection();
  }

  private updatePageRangeFromSelection(): void {
    if (this.selectedPages.length === 0) {
      this.pageRange = '';
      return;
    }

    // Convert selected pages back to range string
    const ranges: string[] = [];
    let start = this.selectedPages[0];
    let end = start;

    for (let i = 1; i < this.selectedPages.length; i++) {
      if (this.selectedPages[i] === end + 1) {
        end = this.selectedPages[i];
      } else {
        if (start === end) {
          ranges.push(start.toString());
        } else {
          ranges.push(`${start}-${end}`);
        }
        start = this.selectedPages[i];
        end = start;
      }
    }

    if (start === end) {
      ranges.push(start.toString());
    } else {
      ranges.push(`${start}-${end}`);
    }

    this.pageRange = ranges.join(', ');
  }

  save(): void {
    if (this.hasError || this.selectedPages.length === 0) {
      return;
    }

    const result: PageRangeDialogResult = {
      pageRange: this.pageRange,
      selectedPages: this.selectedPages
    };

    this.dialogRef.close(result);
  }
}