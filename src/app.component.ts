import { Component } from '@angular/core';
import { PdfUploaderComponent } from './app/pdf-tools/pdf-uploader/pdf-uploader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PdfUploaderComponent],
  template: ` <app-pdf-uploader></app-pdf-uploader> `,
})
export class AppComponent {}
