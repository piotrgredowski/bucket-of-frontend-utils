import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tool-card',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, RouterLink],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-icon mat-card-avatar>{{ icon }}</mat-icon>
        <mat-card-title>{{ title }}</mat-card-title>
        <mat-card-subtitle>{{ subtitle }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content class="content">
        {{ content }}
      </mat-card-content>
      <mat-card-actions>
        <button mat-raised-button color="primary" [routerLink]="link" [disabled]="disabled">
          <mat-icon>open_in_new</mat-icon>
          {{ buttonText }}
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [
    `
      mat-card {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      mat-card-content.content {
        overflow: auto;
      }

      mat-card-actions {
        padding: 16px;
      }
    `,
  ],
})
export class ToolCardComponent {
  @Input() title!: string;
  @Input() subtitle!: string;
  @Input() content!: string;
  @Input() icon!: string;
  @Input() link!: string;
  @Input() buttonText: string = 'Open';
  @Input() disabled: boolean = false;
}
