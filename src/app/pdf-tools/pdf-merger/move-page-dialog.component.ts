import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

export interface MovePageDialogData {
  currentPosition: number; // 1-based position
  totalPages: number;
  pageName: string; // e.g., "Document1.pdf - Page 5"
}

export interface MovePageDialogResult {
  newPosition: number; // 1-based position
}

@Component({
  selector: 'app-move-page-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>open_with</mat-icon>
      Move Page to Position
    </h2>
    
    <mat-dialog-content>
      <div class="dialog-content">
        <div class="page-info">
          <h3>{{ data.pageName }}</h3>
          <p>Currently at position {{ data.currentPosition }} of {{ data.totalPages }}</p>
        </div>
        
        <mat-form-field class="position-input">
          <mat-label>New position</mat-label>
          <input
            matInput
            type="number"
            [(ngModel)]="newPosition"
            [min]="1"
            [max]="data.totalPages"
            (input)="validatePosition()"
            placeholder="Enter position (1-{{ data.totalPages }})"
            [class.error]="hasError"
          />
          <mat-hint *ngIf="!hasError && newPosition && newPosition !== data.currentPosition">
            This will place the page {{ getPositionDescription() }}
          </mat-hint>
          <mat-error *ngIf="hasError">{{ errorMessage }}</mat-error>
        </mat-form-field>
        
        <div class="quick-positions" *ngIf="data.totalPages > 5">
          <h4>Quick positions:</h4>
          <div class="position-buttons">
            <button 
              mat-button 
              (click)="setPosition(1)"
              [disabled]="data.currentPosition === 1"
            >
              Move to start
            </button>
            <button 
              mat-button 
              (click)="setPosition(data.totalPages)"
              [disabled]="data.currentPosition === data.totalPages"
            >
              Move to end
            </button>
            <button 
              mat-button 
              (click)="setPosition(getMiddlePosition())"
              [disabled]="data.currentPosition === getMiddlePosition()"
            >
              Move to middle
            </button>
          </div>
        </div>
        
        <div class="position-preview" *ngIf="newPosition && !hasError && newPosition !== data.currentPosition">
          <h4>Preview:</h4>
          <div class="preview-list">
            <div 
              *ngFor="let pos of getPreviewPositions(); let i = index" 
              class="preview-item"
              [class.current-page]="pos.isCurrent"
              [class.new-position]="pos.isNewPosition"
            >
              <span class="position-number">{{ pos.position }}.</span>
              <span class="page-description">{{ pos.description }}</span>
              <div class="move-indicator" *ngIf="pos.moveIcon">
                <mat-icon [class.move-up]="pos.moveIcon === 'arrow_upward'" 
                          [class.move-down]="pos.moveIcon === 'arrow_downward'">
                  {{ pos.moveIcon }}
                </mat-icon>
                <span class="move-count">{{ pos.moveCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!newPosition || hasError || newPosition === data.currentPosition"
        (click)="move()"
      >
        Move Page
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-content {
      min-width: 600px;
      max-width: 800px;
      padding: 16px;
    }
    
    .page-info {
      margin-bottom: 32px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    
    .page-info h3 {
      margin: 0 0 8px 0;
      color: #333;
    }
    
    .page-info p {
      margin: 0;
      color: #666;
    }
    
    .position-input {
      width: 100%;
      margin-bottom: 32px;
    }
    
    .position-input .mat-mdc-form-field {
      width: 100%;
    }
    
    .position-input .mat-mdc-text-field-wrapper {
      width: 100%;
    }
    
    .quick-positions {
      margin-bottom: 32px;
    }
    
    .quick-positions h4 {
      margin: 0 0 16px 0;
      color: #333;
    }
    
    .position-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    
    .position-preview {
      margin-top: 24px;
      padding: 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
      max-height: 300px;
      overflow-y: auto;
    }
    
    .position-preview h4 {
      margin: 0 0 12px 0;
      color: #333;
    }
    
    .preview-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .preview-item {
      display: flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 14px;
      gap: 8px;
    }
    
    .move-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: auto;
      flex-shrink: 0;
    }
    
    .move-indicator mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    
    .move-indicator mat-icon.move-up {
      color: #2196f3;
    }
    
    .move-indicator mat-icon.move-down {
      color: #ff9800;
    }
    
    .move-count {
      font-size: 12px;
      font-weight: 600;
      color: #666;
    }
    
    .preview-item.current-page {
      background: #e3f2fd;
      border: 1px solid #2196f3;
    }
    
    .preview-item.new-position {
      background: #e8f5e8;
      border: 1px solid #4caf50;
      font-weight: bold;
    }
    
    .position-number {
      min-width: 40px;
      font-weight: 500;
    }
    
    .page-description {
      flex: 1;
    }
    
    .error {
      border-color: #f44336 !important;
    }
    
    mat-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
    }
  `]
})
export class MovePageDialogComponent implements OnInit {
  newPosition: number = 0;
  hasError = false;
  errorMessage = '';

  constructor(
    public dialogRef: MatDialogRef<MovePageDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MovePageDialogData
  ) {}

  ngOnInit(): void {
    this.newPosition = this.data.currentPosition;
  }

  validatePosition(): void {
    this.hasError = false;
    this.errorMessage = '';
    
    if (!this.newPosition) {
      return;
    }
    
    if (this.newPosition < 1) {
      this.hasError = true;
      this.errorMessage = 'Position must be at least 1';
      return;
    }
    
    if (this.newPosition > this.data.totalPages) {
      this.hasError = true;
      this.errorMessage = `Position cannot exceed ${this.data.totalPages}`;
      return;
    }
    
    if (!Number.isInteger(this.newPosition)) {
      this.hasError = true;
      this.errorMessage = 'Position must be a whole number';
      return;
    }
  }

  setPosition(position: number): void {
    this.newPosition = position;
    this.validatePosition();
  }

  getMiddlePosition(): number {
    return Math.ceil(this.data.totalPages / 2);
  }

  getPositionDescription(): string {
    if (!this.newPosition || this.hasError) return '';
    
    if (this.newPosition === 1) {
      return 'at the beginning';
    } else if (this.newPosition === this.data.totalPages) {
      return 'at the end';
    } else {
      return `after position ${this.newPosition - 1}`;
    }
  }

  getPreviewPositions(): Array<{position: number, description: string, isCurrent: boolean, isNewPosition: boolean, moveIcon?: string, moveCount?: number}> {
    if (!this.newPosition || this.hasError || this.newPosition === this.data.currentPosition) {
      return [];
    }
    
    const preview: Array<{position: number, description: string, isCurrent: boolean, isNewPosition: boolean, moveIcon?: string, moveCount?: number}> = [];
    const currentPos = this.data.currentPosition;
    const newPos = this.newPosition;
    const totalPages = this.data.totalPages;
    
    // Show a range around the affected positions
    const start = Math.max(1, Math.min(currentPos, newPos) - 2);
    const end = Math.min(totalPages, Math.max(currentPos, newPos) + 2);
    
    // Create mapping of new positions to old positions
    const positionMap = new Map<number, number>();
    
    // Fill initial mapping (everything stays in place)
    for (let i = 1; i <= totalPages; i++) {
      positionMap.set(i, i);
    }
    
    // Adjust mapping based on the move
    if (currentPos < newPos) {
      // Moving forward: currentPos goes to newPos, everything between shifts left
      for (let i = currentPos + 1; i <= newPos; i++) {
        positionMap.set(i - 1, i);
      }
      positionMap.set(newPos, currentPos);
    } else {
      // Moving backward: currentPos goes to newPos, everything between shifts right
      for (let i = newPos; i < currentPos; i++) {
        positionMap.set(i + 1, i);
      }
      positionMap.set(newPos, currentPos);
    }
    
    // Generate preview items
    for (let newPosition = start; newPosition <= end; newPosition++) {
      const oldPosition = positionMap.get(newPosition);
      if (oldPosition === undefined) continue;
      
      let description: string;
      let isNewPosition = false;
      let moveIcon: string | undefined;
      let moveCount: number | undefined;
      
      if (oldPosition === currentPos) {
        // This is the moved page
        isNewPosition = true;
        description = this.data.pageName;
        const moveDiff = newPosition - currentPos;
        if (moveDiff > 0) {
          moveIcon = 'arrow_downward';
          moveCount = moveDiff;
        } else if (moveDiff < 0) {
          moveIcon = 'arrow_upward';
          moveCount = Math.abs(moveDiff);
        }
      } else if (newPosition !== oldPosition) {
        // This page has moved due to the shift
        description = `Page ${oldPosition}`;
        const moveDiff = newPosition - oldPosition;
        if (moveDiff > 0) {
          moveIcon = 'arrow_downward';
          moveCount = moveDiff;
        } else if (moveDiff < 0) {
          moveIcon = 'arrow_upward';
          moveCount = Math.abs(moveDiff);
        }
      } else {
        // This page hasn't moved
        description = `Page ${oldPosition}`;
      }
      
      preview.push({
        position: newPosition,
        description: description,
        isCurrent: false,
        isNewPosition: isNewPosition,
        moveIcon: moveIcon,
        moveCount: moveCount
      });
    }
    
    return preview;
  }

  move(): void {
    if (this.hasError || !this.newPosition || this.newPosition === this.data.currentPosition) {
      return;
    }

    const result: MovePageDialogResult = {
      newPosition: this.newPosition
    };

    this.dialogRef.close(result);
  }
}