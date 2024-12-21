import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-main-view',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="tools-grid">
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>picture_as_pdf</mat-icon>
          <mat-card-title>PDF Tools</mat-card-title>
          <mat-card-subtitle
            >Split, merge, and manipulate PDFs</mat-card-subtitle
          >
        </mat-card-header>
        <mat-card-content>
          Various tools for working with PDF files including splitting multipage
          PDFs into single pages.
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" routerLink="/pdf-tools">
            <mat-icon>open_in_new</mat-icon>
            Open PDF Tools
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .tools-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
        padding: 20px;
      }

      mat-card-actions {
        padding: 16px;
      }
    `,
  ],
})
export class MainViewComponent {}
