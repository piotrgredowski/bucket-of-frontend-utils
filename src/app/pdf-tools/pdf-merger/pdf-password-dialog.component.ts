import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface PdfPasswordDialogData {
  fileName: string;
}

export interface PdfPasswordDialogResult {
  password: string;
  skipFile: boolean;
}

@Component({
  selector: 'app-pdf-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>lock</mat-icon>
      Password Required
    </h2>
    
    <mat-dialog-content class="dialog-content">
      <div class="password-info">
        <p>The PDF file requires a password to open:</p>
        <h3>{{ data.fileName }}</h3>
      </div>
      
      <mat-form-field class="password-field">
        <mat-label>Password</mat-label>
        <input
          matInput
          type="password"
          [(ngModel)]="password"
          (keyup.enter)="submit()"
          placeholder="Enter PDF password"
          #passwordInput
        />
        <mat-hint>Enter the password to unlock this PDF file</mat-hint>
      </mat-form-field>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="skip()">
        <mat-icon>skip_next</mat-icon>
        Skip This File
      </button>
      <button
        mat-raised-button
        color="primary"
        (click)="submit()"
        [disabled]="!password || !password.trim()"
      >
        <mat-icon>unlock</mat-icon>
        Unlock PDF
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 400px;
      max-width: 500px;
      padding: 16px;
    }
    
    .password-info {
      margin-bottom: 24px;
      text-align: center;
    }
    
    .password-info p {
      margin: 0 0 16px 0;
      color: #666;
    }
    
    .password-info h3 {
      margin: 0;
      color: #333;
      font-weight: 500;
      word-break: break-all;
    }
    
    .password-field {
      width: 100%;
    }
    
    mat-dialog-actions {
      gap: 8px;
    }
  `]
})
export class PdfPasswordDialogComponent {
  password = '';

  constructor(
    public dialogRef: MatDialogRef<PdfPasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PdfPasswordDialogData
  ) {}

  submit(): void {
    if (this.password && this.password.trim()) {
      const result: PdfPasswordDialogResult = {
        password: this.password.trim(),
        skipFile: false
      };
      this.dialogRef.close(result);
    }
  }

  skip(): void {
    const result: PdfPasswordDialogResult = {
      password: '',
      skipFile: true
    };
    this.dialogRef.close(result);
  }
}