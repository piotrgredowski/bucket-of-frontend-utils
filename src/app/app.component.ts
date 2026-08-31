import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    RouterOutlet,
    RouterLink,
    MatButtonModule,
    MatTooltipModule,
  ],
  standalone: true,
  template: `
    <header class="top-header">
      <div class="header-content">
        <button
          mat-icon-button
          routerLink="/"
          class="home-btn"
          matTooltip="Go to main page"
        >
          <div class="bucket-icon">
            <span>🪣</span>
          </div>
        </button>
        <div class="header-info">
          <div class="title-section">
            <h1 class="app-title">Bucket of Utils</h1>
            <span class="current-page">{{ title.getTitle() }}</span>
          </div>
          <div class="description-section" *ngIf="getPageDescription()">
            <span class="page-description">{{ getPageDescription() }}</span>
          </div>
        </div>
        <div class="header-actions">
          <a
            href="https://github.com/piotrgredowski/bucket-of-frontend-utils"
            target="_blank"
            matTooltip="GitHub Repository"
            class="action-btn"
          >
            <svg class="github-logo" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
              />
            </svg>
          </a>
        </div>
      </div>
    </header>

    <main class="content">
      <router-outlet></router-outlet>
    </main>

    <mat-toolbar class="footer" color="secondary">
      <span
        ><a mat-button href="https://github.com/piotrgredowski"
          >by piotrgredowski</a
        ></span
      >
      <span
        ><button mat-button (click)="reportIssue()" class="report-btn">
          <mat-icon>bug_report</mat-icon>
          <span class="btn-text">report issue</span>
        </button></span
      >
      <span
        ><button mat-button (click)="requestFeature()" class="feature-btn">
          <mat-icon>lightbulb</mat-icon>
          <span class="btn-text">request feature</span>
        </button></span
      >
    </mat-toolbar>
  `,
  styles: [
    `
      $footer-height: 50px;

      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        position: relative;
      }

      .top-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        position: sticky;
        top: 0;
        z-index: 1000;
      }

      .header-content {
        display: flex;
        align-items: center;
        padding: 16px 24px;
        max-width: 100%;
        margin: 0 auto;
        gap: 16px;
        width: 100%;
      }

      .home-btn {
        background: rgba(255, 255, 255, 0.15);
        border-radius: 50%;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
      }

      .home-btn:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: scale(1.05);
      }

      .bucket-icon {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .bucket-icon span {
        font-size: 24px;
        line-height: 1;
      }

      .header-info {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 24px;
      }

      .title-section {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex-shrink: 0;
      }

      .app-title {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 500;
        color: white;
        letter-spacing: -0.5px;
      }

      .current-page {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.8);
        font-weight: 400;
      }

      .description-section {
        flex: 1;
        display: flex;
        align-items: center;
      }

      .page-description {
        font-size: 0.95rem;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 300;
        line-height: 1.4;
        font-style: italic;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .action-btn {
        color: rgba(255, 255, 255, 0.9);
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }

      .action-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        transform: scale(1.05);
      }

      .github-logo {
        width: 20px;
        height: 20px;
        fill: currentColor;
      }

      main.content {
        flex: 1;
        padding: 24px 20px 20px 20px;
        max-width: min(1200px, calc(100vh * 1.6));
        width: 100%;
        margin: 0 auto;
        margin-bottom: $footer-height;
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
        min-height: $footer-height;
        gap: 16px;
      }

      .report-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #f44336;
        transition: all 0.2s ease;
      }

      .report-btn:hover {
        background-color: rgba(244, 67, 54, 0.04);
        color: #d32f2f;
      }

      .feature-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #ff9800;
        transition: all 0.2s ease;
      }

      .feature-btn:hover {
        background-color: rgba(255, 152, 0, 0.04);
        color: #f57c00;
      }

      .report-btn mat-icon,
      .feature-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      /* Medium screens */
      @media (max-width: 1024px) {
        main.content {
          max-width: min(900px, calc(100vh * 1.4));
        }

        .header-content {
          padding: 16px 20px;
        }
      }

      /* Tablet screens */
      @media (max-width: 768px) {
        main.content {
          max-width: 100%;
          padding: 16px;
        }

        .header-content {
          max-width: 100%;
          padding: 12px 16px;
          gap: 12px;
        }

        .header-info {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }

        .app-title {
          font-size: 1.2rem;
        }

        .current-page {
          font-size: 0.8rem;
        }

        .page-description {
          font-size: 0.85rem;
        }

        .home-btn {
          width: 40px;
          height: 40px;
        }

        .bucket-icon span {
          font-size: 20px;
        }

        mat-toolbar.footer {
          padding: 8px;
          gap: 12px;
        }
      }

      /* Mobile screens */
      @media (max-width: 480px) {
        main.content {
          padding: 12px;
        }

        .header-actions {
          display: none;
        }

        .app-title {
          font-size: 1.1rem;
        }

        .description-section {
          display: none;
        }

        mat-toolbar.footer {
          flex-direction: row;
          height: auto;
          padding: 6px;
          gap: 4px;
          font-size: 0.7rem;
        }

        .btn-text {
          display: none;
        }

        .report-btn,
        .feature-btn {
          min-width: auto;
          padding: 8px;
          border-radius: 50%;
        }

        .report-btn mat-icon,
        .feature-btn mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    `,
  ],
})
export class AppComponent {
  private pageDescriptions: { [key: string]: string } = {
    'Main page':
      'A collection of useful browser-based tools for developers and everyday tasks',
    'PDF Tools':
      'Tools for working with PDF files including merging multiple PDFs and splitting multipage PDFs. All processing happens in your browser - no data is uploaded to servers. Works offline once loaded.',
    'PDF Merger':
      'Upload multiple PDF files and combine them into a single document. You can select specific pages and arrange them in any order. All processing happens locally in your browser.',
    'PDF Compressor':
      'Reduce image-heavy PDF files in your browser. Files stay on your device and are never uploaded to a server.',
    'QR Tools':
      'Generate QR codes for WiFi connections, URLs, and text content',
    'Overtime Tools':
      'Create Excel files for overtime calculation in Poland with holidays integration',
  };

  constructor(public title: Title, private router: Router) {}

  getPageDescription(): string {
    const currentTitle = this.title.getTitle();
    return this.pageDescriptions[currentTitle] || '';
  }

  reportIssue(): void {
    const currentPage = this.title.getTitle();
    const currentUrl = window.location.href;
    const userAgent = navigator.userAgent;

    const issueTitle = encodeURIComponent(
      `[BUG]: Issue on ${currentPage} page`
    );

    const issueBody = encodeURIComponent(`## Bug Description
Please describe the issue you encountered:

## Steps to Reproduce
1.
2.
3.

## Expected Behavior
What did you expect to happen?

## Actual Behavior
What actually happened?

## Environment
- **Page**: ${currentPage}
- **URL**: ${currentUrl}
- **Browser**: ${userAgent}
- **Date**: ${new Date().toISOString()}

## Additional Information
Please add any screenshots, error messages, or additional context that would help us understand and fix the issue.`);

    const githubUrl = `https://github.com/piotrgredowski/bucket-of-frontend-utils/issues/new?title=${issueTitle}&body=${issueBody}&labels=bug`;
    window.open(githubUrl, '_blank');
  }

  requestFeature(): void {
    const featureTitle = encodeURIComponent('[FEATURE]: ');

    const featureBody = encodeURIComponent(`## Feature Description
Please describe the feature you would like to see:

## Use Case
Why would this feature be useful? What problem does it solve?

## Proposed Solution
If you have ideas about how this could be implemented, please share them:

## Additional Context
Add any other context, screenshots, or examples about the feature request.`);

    const githubUrl = `https://github.com/piotrgredowski/bucket-of-frontend-utils/issues/new?title=${featureTitle}&body=${featureBody}&labels=enhancement`;
    window.open(githubUrl, '_blank');
  }
}
