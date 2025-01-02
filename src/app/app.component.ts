import { RouterLink, RouterOutlet } from '@angular/router';

import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  imports: [
    MatToolbarModule,
    MatIconModule,
    RouterOutlet,
    RouterLink,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
  ],
  standalone: true,
  template: `
    <mat-toolbar color="primary">
      <button mat-button routerLink="/">
        <span style="font-size: 24px">🪣</span>
      </button>
      <span class="current-view">Bucket of utils - {{ title.getTitle() }}</span>
      <span class="spacer"></span>
    </mat-toolbar>

    <main class="content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
      .content {
        padding: 20px;
        max-width: 1200px;
        margin: 0 auto;
      }

      mat-toolbar {
        margin-bottom: 16px;
      }

      .spacer {
        flex: 1 1 auto;
      }

      .divider {
        margin: 0 8px;
        opacity: 0.5;
      }

      .current-view {
        opacity: 0.9;
      }
    `,
  ],
})
export class AppComponent {
  constructor(public title: Title) {}
}
