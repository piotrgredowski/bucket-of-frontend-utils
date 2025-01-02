import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-qr-tools',
  template: `
    <div class="qr-tools-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <h1>QR Tools</h1>
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form class="wifi-form">
            <mat-form-field appearance="fill">
              <mat-label>SSID</mat-label>
              <input matInput placeholder="Enter SSID" required />
            </mat-form-field>

            <mat-form-field appearance="fill">
              <mat-label>Password</mat-label>
              <input
                matInput
                type="password"
                placeholder="Enter Password"
                required
              />
            </mat-form-field>

            <mat-form-field appearance="fill">
              <mat-label>Security Type</mat-label>
              <mat-select required>
                <mat-option value="WPA">WPA/WPA2</mat-option>
                <mat-option value="WEP">WEP</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="form-row">
              <mat-checkbox>Hidden Network</mat-checkbox>
            </div>

            <div class="form-row">
              <button mat-raised-button color="primary" type="submit">
                Generate QR Code
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .qr-tools-container {
        max-width: 400px;
        margin: 2rem auto;
      }

      h1 {
        text-align: center;
        margin-bottom: 2rem;
        color: #333;
      }

      .wifi-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      mat-form-field {
        width: 100%;
      }

      .form-row {
        margin: 0.5rem 0;
      }

      button {
        width: 100%;
        margin-top: 1rem;
      }

      mat-card {
        padding: 2rem;
      }

      mat-card-header {
        justify-content: center;
        margin-bottom: 1rem;
      }

      mat-card-title h1 {
        margin: 0;
      }
    `,
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    MatCheckboxModule,
    MatCardModule,
  ],
})
export class QrToolsComponent {
  // Component logic goes here
}
