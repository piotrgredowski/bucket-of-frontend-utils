import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PdfPreviewComponent } from './pdf-preview/pdf-preview.component';
import { PdfSplitterComponent } from './pdf-splitter/pdf-splitter.component';
import { PdfMergerComponent } from './pdf-merger/pdf-merger.component';
import { PdfToolsComponent } from './pdf-tools.component';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      { 
        path: '', 
        component: PdfToolsComponent,
        children: [
          { path: 'merger', component: PdfMergerComponent, title: 'PDF Merger' },
          { path: 'splitter', component: PdfSplitterComponent, title: 'PDF Splitter' }
        ]
      }
    ]),
    PdfPreviewComponent,
    PdfSplitterComponent,
    PdfMergerComponent,
    PdfToolsComponent,
  ],
})
export class PdfToolsModule {}
