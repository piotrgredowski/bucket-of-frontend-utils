import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PdfSplitterComponent } from '../components/pdf-splitter/pdf-splitter.component';
import { PdfUploaderComponent } from '../components/pdf-uploader/pdf-uploader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatIconModule,
    PdfUploaderComponent,
    PdfSplitterComponent,
  ],
  template: `
    <mat-toolbar color="primary">
      <mat-icon>picture_as_pdf</mat-icon>
      <span style="margin-left: 8px">PDF Tools</span>
    </mat-toolbar>

    <main class="content">
      <app-pdf-splitter></app-pdf-splitter>
    </main>
  `,
  styles: [
    `
      .content {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
      }

      mat-toolbar {
        margin-bottom: 16px;
      }
    `,
  ],
})
export class AppComponent {}
