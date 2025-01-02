import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PdfPreviewComponent } from './pdf-preview/pdf-preview.component';
import { PdfSplitterComponent } from './pdf-splitter/pdf-splitter.component';
import { PdfToolsComponent } from './pdf-tools.component';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: PdfToolsComponent }]),
    PdfPreviewComponent,
    PdfSplitterComponent,
    PdfToolsComponent,
  ],
})
export class PdfToolsModule {}
