import { Injectable } from '@angular/core';
import { toDataURL } from 'qrcode';

@Injectable({
  providedIn: 'root',
})
export class WifiQrCodeService {


  formatTextsForImage(ssid: string, password: string): { ssid: string; password: string } {
    const ssidPrefix = "SSID";
    const passwordPrefix = "Password";

    const maxPrefixLength = Math.max(ssidPrefix.length, passwordPrefix.length);

    const ssidPrefixPadded = ssidPrefix.padStart(maxPrefixLength, ' ');
    const passwordPrefixPadded = passwordPrefix.padStart(maxPrefixLength, ' ');


    return {
      "ssid": `${ssidPrefixPadded}: ${ssid}`,
      "password": `${passwordPrefixPadded}: ${password}`
    }
  }

  async generateWifiQRCode(ssid: string, password: string, security: string, hidden: boolean): Promise<string> {
    const hiddenFlag = hidden ? 'H:true;' : '';
    const wifiString = `WIFI:T:${security};S:${ssid};P:${password};${hiddenFlag};`;
    const qrCodeDataUrl = await toDataURL(wifiString, { width: 560, margin: 1 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to get canvas context');

    const img = new Image();
    img.src = qrCodeDataUrl;

    return new Promise((resolve) => {
      img.onload = () => {
        let fontHeight = 48;
        const padding = 10;
        let canvasWidth = 600;
        let canvasHeight = 770;

        const monospaceWidthRatio = 0.6;
        let fontWidth = fontHeight * monospaceWidthRatio;

        const { ssid: ssidFormatted, password: passwordFormatted } = this.formatTextsForImage(ssid, password);

        if (Math.max(ssidFormatted.length, passwordFormatted.length) * fontWidth > canvasWidth) {
          fontWidth = canvasWidth / Math.max(ssidFormatted.length, passwordFormatted.length);
          fontHeight = Math.floor(fontWidth / monospaceWidthRatio);
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.font = `${fontHeight}px monospace`;
        context.fillStyle = '#000';
        context.textAlign = 'left';


        context.fillText(ssidFormatted, padding, fontHeight);
        context.fillText(passwordFormatted, padding, 2 * fontHeight + padding);

        const imageX = padding;
        const imageY = 2 * (fontHeight + padding) + padding;
        const imageWidth = canvasWidth - padding * 2;
        const imageHeight = canvasWidth - padding * 2;
        context.drawImage(img, imageX, imageY, imageWidth, imageHeight);

        resolve(canvas.toDataURL('image/png'));
      };
    });
  }
}
