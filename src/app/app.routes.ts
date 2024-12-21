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
];
