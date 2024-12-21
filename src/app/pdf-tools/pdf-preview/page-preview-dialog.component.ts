import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-page-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  template: `
    <div class="preview-dialog">
      <img [src]="data.pageUrl" [alt]="'Page ' + data.pageNumber" />
    </div>
  `,
  styles: [
    `
      .preview-dialog {
        padding: 16px;
        img {
          max-width: 100%;
          max-height: 80vh;
          object-fit: contain;
        }
      }
    `,
  ],
})
export class PagePreviewDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { pageUrl: string; pageNumber: number }
  ) {}
}
