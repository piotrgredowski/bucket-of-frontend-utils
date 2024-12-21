import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Title } from '@angular/platform-browser';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatIconModule,
    RouterOutlet,
    RouterLink,
    MatButtonModule,
  ],
  template: `
    <mat-toolbar color="primary">
      <mat-icon>build</mat-icon>
      <button mat-button style="margin-left: 8px" routerLink="/">
        Bucket of utils
      </button>
      <span class="divider">|</span>
      <span class="current-view">{{ title.getTitle() }}</span>
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
