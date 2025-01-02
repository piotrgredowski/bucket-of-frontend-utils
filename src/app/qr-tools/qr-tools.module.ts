import { NgModule } from '@angular/core';
import { QrToolsComponent } from './qr-tools.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild([{ path: '', component: QrToolsComponent }])],
  exports: [],
})
export class QrToolsModule {}
