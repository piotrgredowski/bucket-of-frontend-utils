import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { CustomerSplitterComponent } from './customer-splitter.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: CustomerSplitterComponent }]),
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    CustomerSplitterComponent,
  ],
})
export class CustomerSplitterModule {}
