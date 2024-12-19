import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-pdf-uploader',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <mat-card class="uploader-card">
      <mat-card-content>
        <input
          type="file"
          #fileInput
          accept=".pdf"
          multiple
          (change)="handleFileSelect($event)"
          style="display: none"
        />

        <button
          mat-raised-button
          color="primary"
          (click)="fileInput.click()"
        >
          <mat-icon>upload_file</mat-icon>
          Choose PDF files
        </button>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .uploader-card {
      max-width: 400px;
      margin: 20px auto;
    }

    mat-card-content {
      display: flex;
      justify-content: center;
      padding: 20px;
    }
  `]
})
export class PdfUploaderComponent {
  handleFileSelect(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const files: File[] = Array.from(fileInput.files || []);

    files.forEach((file: File) => {
      if (file.type !== 'application/pdf') {
        console.error('Please upload only PDF files');
        return;
      }
      // Here you can add logic to handle the PDF files
      console.log(`File selected: ${file.name}`);
    });
  }
}
