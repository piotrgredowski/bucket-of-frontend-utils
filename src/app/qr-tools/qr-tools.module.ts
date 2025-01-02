import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { QrToolsComponent } from './qr-tools.component';
import { WifiQrCodeService } from './wifi-qr-code.service';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([{ path: '', component: QrToolsComponent }]),
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatOptionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    QrToolsComponent,
  ],
  providers: [WifiQrCodeService],
  exports: [],
})
export class QrToolsModule {}
