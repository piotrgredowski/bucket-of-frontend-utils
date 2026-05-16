import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-main-view',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="main-container">
      
      <div class="tools-grid">
        <mat-card class="tool-card" [routerLink]="'/pdf-tools'">
          <mat-card-header>
            <div mat-card-avatar class="tool-avatar pdf-avatar">
              <mat-icon>picture_as_pdf</mat-icon>
            </div>
            <mat-card-title>PDF Tools</mat-card-title>
            <mat-card-subtitle>Work with PDF documents</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Comprehensive tools for PDF manipulation. Merge multiple documents, split large files, and organize pages with ease.</p>
            <ul class="features-list">
              <li>Merge multiple PDF files</li>
              <li>Split PDFs into pages</li>
              <li>Select specific page ranges</li>
              <li>Drag & drop page reordering</li>
            </ul>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary">
              <mat-icon>open_in_new</mat-icon>
              Open PDF Tools
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card class="tool-card" [routerLink]="'/qr-tools'">
          <mat-card-header>
            <div mat-card-avatar class="tool-avatar qr-avatar">
              <mat-icon>qr_code</mat-icon>
            </div>
            <mat-card-title>QR Tools</mat-card-title>
            <mat-card-subtitle>Generate QR codes</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Create QR codes for various purposes including WiFi connections, URLs, and text content.</p>
            <ul class="features-list">
              <li>WiFi QR code generator</li>
              <li>URL QR codes</li>
              <li>Text to QR conversion</li>
              <li>Customizable output</li>
            </ul>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary">
              <mat-icon>open_in_new</mat-icon>
              Open QR Tools
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card class="tool-card" [routerLink]="'/overtime-tools'">
          <mat-card-header>
            <div mat-card-avatar class="tool-avatar overtime-avatar">
              <mat-icon>access_time</mat-icon>
            </div>
            <mat-card-title>Overtime Tools</mat-card-title>
            <mat-card-subtitle>Excel overtime calculation</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Generate Excel files for overtime calculation specifically designed for Polish labor law and regulations.</p>
            <ul class="features-list">
              <li>Polish holidays integration</li>
              <li>Automated calculations</li>
              <li>Excel template generation</li>
              <li>Customizable parameters</li>
            </ul>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary">
              <mat-icon>open_in_new</mat-icon>
              Open Overtime Tools
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card class="tool-card" [routerLink]="'/customer-splitter'">
          <mat-card-header>
            <div mat-card-avatar class="tool-avatar splitter-avatar">
              <mat-icon>table_view</mat-icon>
            </div>
            <mat-card-title>Customer Excel Splitter</mat-card-title>
            <mat-card-subtitle>Split customer workbooks</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>Create separate Excel files for every customer from PR0N and ZX29 sheets, grouped by SG folders in a ZIP archive.</p>
            <ul class="features-list">
              <li>Browser-only Excel processing</li>
              <li>PR0N and ZX29 sheet split</li>
              <li>Customer names from customer sheets</li>
              <li>ZIP output grouped by SG</li>
            </ul>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary">
              <mat-icon>open_in_new</mat-icon>
              Open Splitter
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .main-container {
        padding: 0 24px 24px 24px;
        max-width: 1200px;
        margin: 0 auto;
        text-align: center;
      }


      .tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 32px;
        max-width: 1100px;
        margin: 0 auto;
      }

      .tool-card {
        cursor: pointer;
        transition: all 0.3s ease;
        height: 100%;
        display: flex;
        flex-direction: column;
        text-align: left;
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

      .pdf-avatar {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .qr-avatar {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
      }

      .overtime-avatar {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: white;
      }

      .splitter-avatar {
        background: linear-gradient(135deg, #16a085 0%, #f4d03f 100%);
        color: white;
      }

      .tool-card mat-card-content {
        flex: 1;
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
        content: "✓";
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

      @media (max-width: 768px) {
        .main-container {
          padding: 16px;
        }

        .tools-grid {
          grid-template-columns: 1fr;
          gap: 24px;
        }

        .header h1 {
          font-size: 2rem;
        }

        .header p {
          font-size: 1rem;
        }
      }
    `,
  ],
})
export class MainViewComponent {}
