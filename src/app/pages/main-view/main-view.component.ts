import { Component } from '@angular/core';
import { ToolCardComponent } from '../../components/tool-card/tool-card.component';

@Component({
  selector: 'app-main-view',
  standalone: true,
  imports: [ToolCardComponent],
  template: `
    <div class="tools-grid">
      <app-tool-card
        title="PDF Tools"
        subtitle="Split, merge, and manipulate PDFs"
        content="Various tools for working with PDF files including splitting multipage PDFs into single pages."
        icon="picture_as_pdf"
        link="/pdf-tools"
        buttonText="Open PDF Tools"
      ></app-tool-card>
      <app-tool-card
        title="QR Tools"
        subtitle="Generate and scan QR codes"
        content="Tools for generating and scanning QR codes."
        icon="qr_code"
        link="/qr-tools"
        buttonText="Open QR Tools"
      ></app-tool-card>
    </div>
  `,
  styles: [
    `
      .tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        padding: 20px;
      }

      mat-card-actions {
        padding: 16px;
      }
    `,
  ],
})
export class MainViewComponent {}
