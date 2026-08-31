import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-pdf-tools',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterOutlet,
  ],
  template: `
    <div class="pdf-tools-container">
      <!-- Home View - Tool Selection -->
      <div *ngIf="isHomeView" class="tools-home">
        <div class="header">
          <h1>PDF Tools</h1>
          <p>Choose a tool to work with your PDF files</p>
        </div>

        <div class="tools-grid">
          <mat-card class="tool-card" (click)="selectTool('merger')">
            <mat-card-header>
              <div mat-card-avatar class="tool-avatar merger-avatar">
                <mat-icon>merge</mat-icon>
              </div>
              <mat-card-title>PDF Merger</mat-card-title>
              <mat-card-subtitle>Combine multiple PDFs</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>
                Merge multiple PDF files into a single document. Select specific
                pages and arrange them in your desired order.
              </p>
              <ul class="features-list">
                <li>Combine multiple PDF files</li>
                <li>Select specific page ranges</li>
                <li>Drag and drop to reorder pages</li>
                <li>Preview before downloading</li>
              </ul>
            </mat-card-content>
            <mat-card-actions>
              <button
                mat-raised-button
                color="primary"
                (click)="selectTool('merger'); $event.stopPropagation()"
              >
                <mat-icon>merge</mat-icon>
                Start Merging
              </button>
            </mat-card-actions>
          </mat-card>

          <mat-card class="tool-card" (click)="selectTool('splitter')">
            <mat-card-header>
              <div mat-card-avatar class="tool-avatar splitter-avatar">
                <mat-icon>call_split</mat-icon>
              </div>
              <mat-card-title>PDF Splitter</mat-card-title>
              <mat-card-subtitle>Split PDF into pages</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>
                Split a PDF document into individual pages or ranges. Perfect
                for extracting specific content from larger documents.
              </p>
              <ul class="features-list">
                <li>Split PDF into single pages</li>
                <li>Custom filename for each page</li>
                <li>Preview pages before splitting</li>
                <li>Extract specific page ranges</li>
              </ul>
            </mat-card-content>
            <mat-card-actions>
              <button
                mat-raised-button
                color="primary"
                (click)="selectTool('splitter'); $event.stopPropagation()"
              >
                <mat-icon>call_split</mat-icon>
                Start Splitting
              </button>
            </mat-card-actions>
          </mat-card>

          <mat-card class="tool-card" (click)="selectTool('compressor')">
            <mat-card-header>
              <div mat-card-avatar class="tool-avatar compressor-avatar">
                <mat-icon>compress</mat-icon>
              </div>
              <mat-card-title>PDF Compressor</mat-card-title>
              <mat-card-subtitle>Reduce PDF size locally</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>
                Reduce the size of image-heavy PDFs directly in your browser.
                Your file never leaves your device.
              </p>
              <ul class="features-list">
                <li>100% browser-based processing</li>
                <li>Choose quality and DPI</li>
                <li>Optional maximum file size</li>
                <li>Download the optimized PDF</li>
              </ul>
            </mat-card-content>
            <mat-card-actions>
              <button
                mat-raised-button
                color="primary"
                (click)="selectTool('compressor'); $event.stopPropagation()"
              >
                <mat-icon>compress</mat-icon>
                Start Compressing
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>

      <!-- Router Outlet for Child Routes -->
      <router-outlet *ngIf="!isHomeView"></router-outlet>
    </div>
  `,
  styles: [
    `
      .pdf-tools-container {
        // padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
      }

      .tools-home {
        text-align: center;
      }

      .header {
        margin-bottom: 48px;
      }

      .header h1 {
        font-size: 2.5rem;
        margin: 0 0 16px 0;
        color: #333;
        font-weight: 300;
      }

      .header p {
        font-size: 1.2rem;
        color: #666;
        margin: 0;
      }

      .tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 32px;
        max-width: 900px;
        margin: 0 auto;
      }

      .tool-card {
        cursor: pointer;
        transition: all 0.3s ease;
        height: 100%;
        display: flex;
        flex-direction: column;
      }

      .tool-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }

      .tool-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        width: 40px;
        height: 40px;
      }

      .merger-avatar {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .splitter-avatar {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
      }

      .compressor-avatar {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        color: white;
      }

      .tool-card mat-card-content {
        flex: 1;
        text-align: left;
      }

      .tool-card p {
        margin-bottom: 16px;
        line-height: 1.6;
        color: #666;
      }

      .features-list {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .features-list li {
        padding: 4px 0;
        position: relative;
        padding-left: 20px;
        color: #555;
      }

      .features-list li:before {
        content: '✓';
        position: absolute;
        left: 0;
        color: #4caf50;
        font-weight: bold;
      }

      .tool-card mat-card-actions {
        padding: 16px;
        justify-content: center;
      }

      .tool-card button {
        width: 100%;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @media (max-width: 768px) {
        .pdf-tools-container {
          // padding: 16px;
        }

        .tools-grid {
          grid-template-columns: 1fr;
          gap: 24px;
        }

        .header h1 {
          font-size: 2rem;
        }
      }
    `,
  ],
})
export class PdfToolsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isHomeView = true;

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Listen to router navigation events
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Check if we're on a child route
        setTimeout(() => {
          this.isHomeView = !this.route.firstChild;
        });
      });

    // Check initial route
    setTimeout(() => {
      this.isHomeView = !this.route.firstChild;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectTool(tool: 'merger' | 'splitter' | 'compressor'): void {
    this.router.navigate([tool], { relativeTo: this.route });
  }
}
