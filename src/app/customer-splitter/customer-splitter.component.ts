import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import * as ExcelJS from 'exceljs';
import JSZip from 'jszip';

type DataSheetName = 'PR0N' | 'ZX29';

interface CustomerInfo {
  customerNumber: string;
  shortName: string;
  salesGroup: string;
}

interface SheetCopy {
  name: DataSheetName;
  source: ExcelJS.Worksheet;
  rows: ExcelJS.Row[];
}

@Component({
  selector: 'app-customer-splitter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="splitter-container">
      <mat-card class="splitter-card">
        <mat-card-header>
          <div mat-card-avatar class="splitter-avatar">
            <mat-icon>table_view</mat-icon>
          </div>
          <mat-card-title>
            <h1>Customer Excel Splitter</h1>
          </mat-card-title>
          <mat-card-subtitle>
            Split one workbook into customer Excel files grouped by SG.
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <section class="drop-zone" [class.has-file]="selectedFile">
            <mat-icon>upload_file</mat-icon>
            <div>
              <strong>{{ selectedFile?.name || 'Choose source Excel file' }}</strong>
              <span>Required sheets: PR0N, ZX29, customers PR0N, customers ZX29.</span>
            </div>
            <input
              #fileInput
              type="file"
              accept=".xlsx"
              (change)="onFileSelected($event)"
            />
            <button mat-raised-button color="primary" (click)="fileInput.click()">
              <mat-icon>folder_open</mat-icon>
              Select file
            </button>
          </section>

          <div class="actions-row">
            <button
              mat-raised-button
              color="accent"
              (click)="splitWorkbook()"
              [disabled]="!selectedFile || isProcessing"
            >
              <mat-icon>archive</mat-icon>
              Generate ZIP
            </button>
            <button
              mat-button
              type="button"
              (click)="reset()"
              [disabled]="isProcessing || !selectedFile"
            >
              Clear
            </button>
          </div>

          <mat-progress-bar *ngIf="isProcessing" mode="indeterminate"></mat-progress-bar>

          <div class="status" *ngIf="statusMessage">{{ statusMessage }}</div>
          <div class="error" *ngIf="errorMessage">{{ errorMessage }}</div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .splitter-container {
        width: min(960px, calc(100vw - 32px));
        margin: 24px auto;
      }

      .splitter-card {
        width: 100%;
      }

      .splitter-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #16a085 0%, #f4d03f 100%);
        color: white;
      }

      h1 {
        margin: 0;
        font-size: 1.5rem;
        line-height: 1.25;
      }

      .drop-zone {
        position: relative;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: 16px;
        align-items: center;
        padding: 20px;
        margin: 20px 0;
        border: 1px dashed rgba(0, 0, 0, 0.35);
        border-radius: 8px;
        background: #fafafa;
      }

      .drop-zone.has-file {
        border-style: solid;
        background: #f4fbf8;
      }

      .drop-zone > mat-icon {
        color: #08765d;
      }

      .drop-zone div {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      .drop-zone strong,
      .drop-zone span {
        overflow-wrap: anywhere;
      }

      .drop-zone span {
        color: rgba(0, 0, 0, 0.64);
      }

      input[type='file'] {
        display: none;
      }

      .actions-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .status,
      .error {
        margin-top: 16px;
        padding: 12px 14px;
        border-radius: 6px;
      }

      .status {
        background: #eef8f0;
        color: #1b5e20;
      }

      .error {
        background: #fdecea;
        color: #b71c1c;
      }

      @media (max-width: 720px) {
        .drop-zone {
          grid-template-columns: 1fr;
        }

        .drop-zone button,
        .actions-row button {
          width: 100%;
        }

        .actions-row {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
})
export class CustomerSplitterComponent {
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  selectedFile: File | null = null;
  isProcessing = false;
  statusMessage = '';
  errorMessage = '';

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
    this.statusMessage = this.selectedFile
      ? `Ready to split ${this.selectedFile.name}.`
      : '';
    this.errorMessage = '';
  }

  reset(): void {
    this.selectedFile = null;
    this.statusMessage = '';
    this.errorMessage = '';
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  async splitWorkbook(): Promise<void> {
    if (!this.selectedFile) {
      return;
    }

    this.isProcessing = true;
    this.statusMessage = 'Reading workbook...';
    this.errorMessage = '';

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await this.selectedFile.arrayBuffer());

      const pr0nSheet = this.requireWorksheet(workbook, 'PR0N');
      const zx29Sheet = this.requireWorksheet(workbook, 'ZX29');
      const customers = this.readCustomers(workbook);
      const zip = new JSZip();
      let generatedFiles = 0;

      for (const customer of customers.values()) {
        const possibleSheetCopies: SheetCopy[] = [
          {
            name: 'PR0N',
            source: pr0nSheet,
            rows: this.findCustomerRows(pr0nSheet, customer.customerNumber),
          },
          {
            name: 'ZX29',
            source: zx29Sheet,
            rows: this.findCustomerRows(zx29Sheet, customer.customerNumber),
          },
        ];
        const sheetCopies = possibleSheetCopies.filter(
          (sheetCopy) => sheetCopy.rows.length > 0
        );

        if (sheetCopies.length === 0) {
          continue;
        }

        const outputWorkbook = new ExcelJS.Workbook();
        outputWorkbook.creator = 'Bucket of Utils';
        outputWorkbook.created = new Date();

        for (const sheetCopy of sheetCopies) {
          this.copySheetForCustomer(outputWorkbook, sheetCopy);
        }

        const fileName = `${this.safeFileName(customer.customerNumber)} ${this.safeFileName(customer.shortName)}.xlsx`;
        const folderName = this.safeFileName(customer.salesGroup || 'Unknown');
        const buffer = await outputWorkbook.xlsx.writeBuffer();
        zip.folder(folderName)?.file(fileName, buffer);
        generatedFiles++;
      }

      if (generatedFiles === 0) {
        throw new Error('No customer rows were found in PR0N or ZX29.');
      }

      this.statusMessage = `Creating ZIP with ${generatedFiles} files...`;
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      this.downloadBlob(zipBlob, 'customer-excel-files.zip');
      this.statusMessage = `Generated ${generatedFiles} customer files.`;
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'Could not split workbook.';
      this.statusMessage = '';
    } finally {
      this.isProcessing = false;
    }
  }

  private readCustomers(workbook: ExcelJS.Workbook): Map<string, CustomerInfo> {
    const customers = new Map<string, CustomerInfo>();

    for (const sheetName of ['customers PR0N', 'customers ZX29']) {
      const worksheet = this.requireWorksheet(workbook, sheetName);
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          return;
        }

        const customerNumber = this.normalizeCellValue(row.getCell(1).value);
        if (!customerNumber) {
          return;
        }

        const existing = customers.get(customerNumber);
        customers.set(customerNumber, {
          customerNumber,
          salesGroup:
            this.normalizeCellValue(row.getCell(3).value) ||
            existing?.salesGroup ||
            '',
          shortName:
            this.normalizeCellValue(row.getCell(4).value) ||
            existing?.shortName ||
            customerNumber,
        });
      });
    }

    return customers;
  }

  private findCustomerRows(
    worksheet: ExcelJS.Worksheet,
    customerNumber: string
  ): ExcelJS.Row[] {
    const rows: ExcelJS.Row[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && this.normalizeCellValue(row.getCell(2).value) === customerNumber) {
        rows.push(row);
      }
    });
    return rows;
  }

  private copySheetForCustomer(
    targetWorkbook: ExcelJS.Workbook,
    sheetCopy: SheetCopy
  ): void {
    const targetSheet = targetWorkbook.addWorksheet(sheetCopy.name, {
      properties: { ...sheetCopy.source.properties },
      pageSetup: { ...sheetCopy.source.pageSetup },
      views: sheetCopy.source.views,
    });

    targetSheet.columns = sheetCopy.source.columns.map((column) => ({
      key: column.key,
      width: column.width,
      hidden: column.hidden,
      outlineLevel: column.outlineLevel,
      style: this.cloneStyle(column.style),
    }));

    this.copyRow(sheetCopy.source.getRow(1), targetSheet.getRow(1));
    sheetCopy.rows.forEach((sourceRow, index) => {
      this.copyRow(sourceRow, targetSheet.getRow(index + 2));
    });
  }

  private copyRow(sourceRow: ExcelJS.Row, targetRow: ExcelJS.Row): void {
    targetRow.height = sourceRow.height;
    sourceRow.eachCell({ includeEmpty: true }, (sourceCell, columnNumber) => {
      const targetCell = targetRow.getCell(columnNumber);
      targetCell.value = this.cloneCellValue(sourceCell.value);
      targetCell.style = this.cloneStyle(sourceCell.style);
      targetCell.numFmt = sourceCell.numFmt;
    });
    targetRow.commit();
  }

  private requireWorksheet(
    workbook: ExcelJS.Workbook,
    sheetName: string
  ): ExcelJS.Worksheet {
    const worksheet = workbook.getWorksheet(sheetName);
    if (!worksheet) {
      throw new Error(`Missing required sheet: ${sheetName}.`);
    }
    return worksheet;
  }

  private normalizeCellValue(value: ExcelJS.CellValue): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'object' && 'text' in value) {
      return String(value.text).trim();
    }
    if (typeof value === 'object' && 'result' in value) {
      return this.normalizeCellValue(value.result as ExcelJS.CellValue);
    }
    return String(value).trim();
  }

  private cloneCellValue(value: ExcelJS.CellValue): ExcelJS.CellValue {
    if (value === null || value === undefined || value instanceof Date) {
      return value;
    }
    if (typeof value === 'object') {
      return JSON.parse(JSON.stringify(value));
    }
    return value;
  }

  private cloneStyle<T>(style: T): T {
    if (!style) {
      return style;
    }
    return JSON.parse(JSON.stringify(style));
  }

  private safeFileName(value: string): string {
    return value.replace(/[\\/:*?"<>|]/g, '-').trim();
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  }
}
