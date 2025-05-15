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
        subtitle=""
        content="Various tools for working with PDF files including splitting multipage PDFs into single pages."
        icon="picture_as_pdf"
        link="/pdf-tools"
        buttonText="Open PDF Tools"
        [disabled]="true"
        tooltip="Coming soon"
      ></app-tool-card>
      <app-tool-card
        title="QR Tools"
        subtitle=""
        content="Tools related to QR codes."
        icon="qr_code"
        link="/qr-tools"
        buttonText="Open QR Tools"
      ></app-tool-card>
      <app-tool-card
        title="Overtime tools"
        subtitle=""
        content="Tool to create Excel files for overtime calculation."
        icon="access_time"
        link="/overtime-tools"
        buttonText="Open Overtime Tools"
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
