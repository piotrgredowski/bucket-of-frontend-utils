import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';

import { PdfPreviewComponent } from './pdf-preview/pdf-preview.component';
import { PdfSplitterComponent } from './pdf-splitter/pdf-splitter.component';
import { PdfToolsComponent } from './pdf-tools.component';
@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: PdfToolsComponent }]),

    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    PdfPreviewComponent,
    PdfSplitterComponent,
    PdfToolsComponent,
  ],
})
export class PdfToolsModule {}
