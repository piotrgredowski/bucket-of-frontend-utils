import { Routes } from '@angular/router';
import { MainViewComponent } from './pages/main-view/main-view.component';

export const routes: Routes = [
  {
    path: '',
    component: MainViewComponent,
    title: 'Main page',
  },
  {
    path: 'pdf-tools',
    loadChildren: () =>
      import('./pdf-tools/pdf-tools.module').then((m) => m.PdfToolsModule),
    title: 'PDF Tools',
  },
  {
    path: 'qr-tools',
    loadChildren: () =>
      import('./qr-tools/qr-tools.module').then((m) => m.QrToolsModule),
    title: 'QR Tools',
  },
  {
    path: 'overtime-tools',
    loadChildren: () =>
      import('./overtime-tools/overtime-tools.module').then(
        (m) => m.OvertimeToolsModule
      ),
    title: 'Overtime Tools',
  },
];
