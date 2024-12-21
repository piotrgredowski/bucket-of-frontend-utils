import { Component } from '@angular/core';
import { PdfSplitterComponent } from './pdf-splitter/pdf-splitter.component';

@Component({
  selector: 'app-pdf-tools',
  imports: [PdfSplitterComponent],
  template: ` <app-pdf-splitter></app-pdf-splitter> `,
})
export class PdfToolsComponent {}
