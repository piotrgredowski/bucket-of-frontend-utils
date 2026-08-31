import { Injectable } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import { pdfjsLib } from '../pdf-config';

export interface PdfCompressionPreset {
  id: string;
  label: string;
  description: string;
  dpi: number;
  quality: number;
}

export interface PdfCompressionProgress {
  currentPage: number;
  totalPages: number;
  percentage: number;
  attempt: number;
  attempts: number;
  preset: PdfCompressionPreset;
  message: string;
}

export interface PdfCompressionResult {
  bytes: Uint8Array;
  pageCount: number;
  preset: PdfCompressionPreset;
}

export const PDF_COMPRESSION_PRESETS: PdfCompressionPreset[] = [
  {
    id: 'high',
    label: 'High quality',
    description: '150 DPI · JPEG 85% — best image clarity',
    dpi: 150,
    quality: 0.85,
  },
  {
    id: 'standard',
    label: 'Standard',
    description: '120 DPI · JPEG 75% — good balance of quality and size',
    dpi: 120,
    quality: 0.75,
  },
  {
    id: 'small',
    label: 'Small file',
    description: '90 DPI · JPEG 65% — when file size matters most',
    dpi: 90,
    quality: 0.65,
  },
];

export type PdfCompressionProgressCallback = (
  progress: PdfCompressionProgress
) => void;

@Injectable({
  providedIn: 'root',
})
export class PdfCompressorService {
  async compressPdf(
    file: File,
    preset: PdfCompressionPreset,
    onProgress?: PdfCompressionProgressCallback,
    attempt = 1,
    attempts = 1
  ): Promise<PdfCompressionResult> {
    const sourceBytes = new Uint8Array(await file.arrayBuffer());
    let pdf: pdfjsLib.PDFDocumentProxy | null = null;

    try {
      pdf = await pdfjsLib.getDocument({ data: sourceBytes }).promise;
      const output = await PDFDocument.create();

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        let page: pdfjsLib.PDFPageProxy | null = null;
        let canvas: HTMLCanvasElement | null = null;

        try {
          page = await pdf.getPage(pageNumber);
          const pageImage = await this.renderPageToJpeg(page, preset);
          canvas = pageImage.canvas;

          const image = await output.embedJpg(pageImage.bytes);
          const pageSize = page.getViewport({ scale: 1 });
          const outputPage = output.addPage([pageSize.width, pageSize.height]);
          outputPage.drawImage(image, {
            x: 0,
            y: 0,
            width: pageSize.width,
            height: pageSize.height,
          });

          onProgress?.({
            currentPage: pageNumber,
            totalPages: pdf.numPages,
            percentage: Math.round((pageNumber / pdf.numPages) * 100),
            attempt,
            attempts,
            preset,
            message: `Compressing page ${pageNumber} of ${pdf.numPages}`,
          });
        } finally {
          page?.cleanup();
          if (canvas) {
            canvas.width = 0;
            canvas.height = 0;
          }
        }
      }

      const bytes = await output.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 20,
        updateFieldAppearances: false,
      });

      return {
        bytes,
        pageCount: pdf.numPages,
        preset,
      };
    } finally {
      pdf?.destroy();
    }
  }

  private async renderPageToJpeg(
    page: pdfjsLib.PDFPageProxy,
    preset: PdfCompressionPreset
  ): Promise<{ bytes: Uint8Array; canvas: HTMLCanvasElement }> {
    const baseViewport = page.getViewport({ scale: 1 });
    const requestedScale = preset.dpi / 72;
    const maxCanvasPixels = 6_000_000;
    const requestedPixels = baseViewport.width * requestedScale * baseViewport.height * requestedScale;
    const scale = requestedPixels > maxCanvasPixels
      ? requestedScale * Math.sqrt(maxCanvasPixels / requestedPixels)
      : requestedScale;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(viewport.width));
    canvas.height = Math.max(1, Math.ceil(viewport.height));

    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Unable to create a canvas context.');
    }

    try {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport }).promise;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (value) => (value ? resolve(value) : reject(new Error('Unable to encode the PDF page.'))),
          'image/jpeg',
          preset.quality
        );
      });

      return {
        bytes: new Uint8Array(await blob.arrayBuffer()),
        canvas,
      };
    } catch (error) {
      canvas.width = 0;
      canvas.height = 0;
      throw error;
    }
  }
}
