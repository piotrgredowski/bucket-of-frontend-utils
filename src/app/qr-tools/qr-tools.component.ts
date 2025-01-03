import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { WifiQrCodeService } from './wifi-qr-code.service';

@Component({
  selector: 'app-qr-tools',
  template: `
    <div class="qr-tools-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <h1>Wifi QR code generator</h1>
          </mat-card-title>
          <mat-card-subtitle>
            <p>I wanted to be able to generate a QR code for my guest WIFI network so my guests could connect to it without having to type in the SSID and password.</p>
            <p>None of existing QR code generators I found, were able to generate an image with the SSID, password and QR code all together.</p>
            <p>I want to have also SSID and password on the image so you can connect easily with the devices without camera.</p>
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form class="wifi-form" (ngSubmit)="generateQRCode()">
            <mat-form-field appearance="fill">
              <mat-label>SSID</mat-label>
              <input matInput [(ngModel)]="ssid" name="ssid" placeholder="Enter SSID" required />
            </mat-form-field>

            <mat-form-field appearance="fill">
              <mat-label>Password</mat-label>
              <input
                matInput
                [type]="passwordVisible ? 'text' : 'password'"
                [(ngModel)]="password"
                name="password"
                placeholder="Enter Password"
                required
              />

              <mat-icon matSuffix (click)="passwordVisible = !passwordVisible">{{passwordVisible ? 'visibility_off' : 'visibility'}}</mat-icon>

            </mat-form-field>

            <mat-form-field appearance="fill">
              <mat-label>Security Type</mat-label>
              <mat-select [(ngModel)]="security" name="security" required>
                <mat-option value="WPA">WPA/WPA2</mat-option>
                <mat-option value="WEP">WEP</mat-option>
              </mat-select>
            </mat-form-field>

            <div>
              <mat-checkbox [(ngModel)]="hidden" name="hidden">Hidden Network</mat-checkbox>
            </div>

            <div>
              <button mat-raised-button color="primary" type="submit">
                Generate QR Code
              </button>
            </div>
          </form>

        </mat-card-content>
      </mat-card>
      <mat-card >
        <mat-card-header>
          <mat-card-title>
            <h1>Generated QR code</h1>
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>

          <div class="qr-code-container"  *ngIf="qrCodeDataUrl">
            <img [src]="qrCodeDataUrl" alt="QR Code" style="width: 100%; height: auto;" />
          </div>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="accent" (click)="downloadImage()" [disabled]="!qrCodeDataUrl">
            Download as PNG
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .qr-tools-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
        justify-content: center;
      }

      @media (min-width: 1080px) {
        .qr-tools-container {
          margin: 2rem auto;
          flex-direction: row;
          width: 100%;
        }
        mat-card {
          max-width: 600px;
        }
      }


      h1 {
        text-align: center;
        margin-bottom: 2rem;
        color: #333;
      }

      .wifi-form {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }

      mat-form-field {
        width: 100%;
      }

      button {
        width: 100%;
        margin-top: 1rem;
      }

      mat-card {
        padding: 2rem;
        flex: 1;
        width: 100%;
        justify-content: space-between;
      }

      mat-card-header {
        justify-content: center;
        margin-bottom: 1rem;
      }



      mat-card-title h1 {
        margin: 1rem 0;
        text-align: left;

      }

      .qr-code-container {
        text-align: center;
        font-family: monospace;
        margin-top: 1rem;
        width: auto;
      }
    `,
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatOptionModule,
    MatSelectModule,
    MatCheckboxModule,
    MatCardModule,
    MatIconModule,
  ],
})
export class QrToolsComponent {
  ssid: string = 'my_ssid';
  password: string = 'my_password';
  security: string = 'WPA';
  hidden: boolean = false;
  qrCodeDataUrl: string | null = null;
  passwordVisible: boolean = true;

  constructor(private qrCodeService: WifiQrCodeService) {}

  generateQRCode() {
    this.qrCodeService
      .generateWifiQRCode(this.ssid, this.password, this.security, this.hidden)
      .then((dataUrl) => {
        this.qrCodeDataUrl = dataUrl;
      })
      .catch((error) => {
        console.error('Error generating QR code', error);
      });
  }

  downloadImage() {
    if (this.qrCodeDataUrl) {
      const link = document.createElement('a');
      link.href = this.qrCodeDataUrl;
      link.download = `${this.ssid}.png`;
      link.click();
    }
  }
}
