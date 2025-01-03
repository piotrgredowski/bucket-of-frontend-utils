import { RouterLink, RouterOutlet } from '@angular/router';

import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatTooltipModule,
  ],
  standalone: true,
  template: `
    <mat-toolbar class="top-toolbar" color="primary">
      <button mat-button routerLink="/">
        <span style="font-size: 24px">🪣</span>
      </button>
      <span class="current-view">Bucket of utils - {{ title.getTitle() }}</span>
      <span class="spacer"></span>
    </mat-toolbar>

    <main class="content">
      <router-outlet></router-outlet>
    </main>

    <mat-toolbar class="footer" color="secondary">
      <span><a mat-button href="https://github.com/piotrgredowski">by piotrgredowski</a></span>
      <span><a mat-button href="https://github.com/piotrgredowski/bucket-of-frontend-utils/issues">report issues / request features here</a></span>
    </mat-toolbar>
  `,
  styles: [
    `
      $footer-height: 40px;

      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        position: relative;
      }

      main.content {
        flex: 1;
        padding: 0 20px 20px 20px;
        max-width: 1200px;
        margin: 0 auto;
        margin-bottom: $footer-height;
      }

      mat-toolbar.top-toolbar {
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

      mat-toolbar.footer {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        justify-content: center;
        text-align: left;
        background-color: #f1f1f1;
        z-index: 1000;
        height: $footer-height;
      }
    `,
  ],
})
export class AppComponent {
  constructor(public title: Title) {}
}
