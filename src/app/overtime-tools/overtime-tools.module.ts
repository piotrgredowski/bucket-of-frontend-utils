import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http'; // Import HttpClientModule
import { NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';
import { OvertimeToolsComponent } from './overtime-tools.component';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule, // Add HttpClientModule here
    RouterModule.forChild([{ path: '', component: OvertimeToolsComponent }]),
    MatCardModule,
    MatChipsModule, // Add MatChipsModule here
    OvertimeToolsComponent, // Import the standalone component
  ],
})
export class OvertimeToolsModule {}
