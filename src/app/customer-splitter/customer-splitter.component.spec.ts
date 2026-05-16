import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import * as ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { CustomerSplitterComponent } from './customer-splitter.component';

describe('CustomerSplitterComponent', () => {
  let fixture: ComponentFixture<CustomerSplitterComponent>;
  let component: CustomerSplitterComponent;
  let capturedZipBlob: Blob | null;
  let createObjectUrlSpy: jasmine.Spy;
  let revokeObjectUrlSpy: jasmine.Spy;
  let anchorClickSpy: jasmine.Spy;

  beforeEach(async () => {
    capturedZipBlob = null;

    createObjectUrlSpy = spyOn(window.URL, 'createObjectURL').and.callFake(
      (blob: Blob | MediaSource) => {
        capturedZipBlob = blob as Blob;
        return 'blob:customer-splitter-test';
      }
    );
    revokeObjectUrlSpy = spyOn(window.URL, 'revokeObjectURL').and.stub();
    anchorClickSpy = spyOn(HTMLAnchorElement.prototype, 'click').and.stub();

    await TestBed.configureTestingModule({
      imports: [CustomerSplitterComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerSplitterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('given selected file when file changes then stores file and clears errors', async () => {
    const file = await createWorkbookFile(createHappyPathWorkbook(), 'source.xlsx');
    const input = document.createElement('input');
    const fileList = createFileList(file);
    Object.defineProperty(input, 'files', { value: fileList });

    component.errorMessage = 'Previous error';
    component.onFileSelected({ target: input } as unknown as Event);

    expect(component.selectedFile).toBe(file);
    expect(component.statusMessage).toBe('Ready to split source.xlsx.');
    expect(component.errorMessage).toBe('');
  });

  it('given current state when reset then clears file and messages', async () => {
    component.selectedFile = await createWorkbookFile(
      createHappyPathWorkbook(),
      'source.xlsx'
    );
    component.statusMessage = 'Ready';
    component.errorMessage = 'Error';

    component.reset();

    expect(component.selectedFile).toBeNull();
    expect(component.statusMessage).toBe('');
    expect(component.errorMessage).toBe('');
  });

  it('given mixed customer rows when splitting then creates files grouped by sales group', async () => {
    component.selectedFile = await createWorkbookFile(createHappyPathWorkbook());

    await component.splitWorkbook();

    const zip = await loadCapturedZip();
    expect(zip.file('SG-A/1001 Acme.xlsx')).toBeTruthy();
    expect(zip.file('SG-B/2002 Beta.xlsx')).toBeTruthy();
    expect(zip.file('SG-C/3003 Gamma.xlsx')).toBeNull();
    expect(anchorClickSpy).toHaveBeenCalled();
    expect(createObjectUrlSpy).toHaveBeenCalled();
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith(
      'blob:customer-splitter-test'
    );
    expect(component.statusMessage).toBe('Generated 2 customer files.');
    expect(component.errorMessage).toBe('');

    const acmeWorkbook = await loadWorkbookFromZip(zip, 'SG-A/1001 Acme.xlsx');
    expect(readWorksheetRows(acmeWorkbook, 'PR0N')).toEqual([
      ['Type', 'Customer', 'Amount'],
      ['P-1', '1001', 10],
      ['P-2', '1001', 15],
    ]);
    expect(readWorksheetRows(acmeWorkbook, 'ZX29')).toEqual([
      ['Type', 'Customer', 'Amount'],
      ['Z-1', '1001', 20],
    ]);

    const betaWorkbook = await loadWorkbookFromZip(zip, 'SG-B/2002 Beta.xlsx');
    expect(readWorksheetRows(betaWorkbook, 'PR0N')).toEqual([
      ['Type', 'Customer', 'Amount'],
      ['P-3', '2002', 30],
    ]);
    expect(betaWorkbook.getWorksheet('ZX29')).toBeUndefined();
  });

  it('given invalid filename characters when splitting then sanitizes folders and files', async () => {
    component.selectedFile = await createWorkbookFile(
      createSanitizationWorkbook()
    );

    await component.splitWorkbook();

    const zip = await loadCapturedZip();
    expect(zip.file('SG-A-B/10-01 Acme- North-.xlsx')).toBeTruthy();
  });

  it('given a missing required sheet when splitting then reports the missing sheet', async () => {
    const workbook = createHappyPathWorkbook();
    workbook.removeWorksheet(workbook.getWorksheet('ZX29')!.id);
    component.selectedFile = await createWorkbookFile(workbook);

    await component.splitWorkbook();

    expect(component.errorMessage).toBe('Missing required sheet: ZX29.');
    expect(component.statusMessage).toBe('');
    expect(capturedZipBlob).toBeNull();
    expect(anchorClickSpy).not.toHaveBeenCalled();
  });

  it('given customers without matching rows when splitting then reports no generated files', async () => {
    component.selectedFile = await createWorkbookFile(createNoMatchWorkbook());

    await component.splitWorkbook();

    expect(component.errorMessage).toBe(
      'No customer rows were found in PR0N or ZX29.'
    );
    expect(component.statusMessage).toBe('');
    expect(capturedZipBlob).toBeNull();
    expect(anchorClickSpy).not.toHaveBeenCalled();
  });

  async function loadCapturedZip(): Promise<JSZip> {
    expect(capturedZipBlob).toBeTruthy();
    return JSZip.loadAsync(capturedZipBlob as Blob);
  }
});

function createHappyPathWorkbook(): ExcelJS.Workbook {
  const workbook = createRequiredWorkbook();

  workbook.getWorksheet('customers PR0N')!.addRows([
    ['1001', '', 'SG-A', 'Acme'],
    ['2002', '', 'SG-B', 'Beta'],
  ]);
  workbook.getWorksheet('customers ZX29')!.addRows([
    ['1001', '', 'SG-A', 'Acme'],
    ['3003', '', 'SG-C', 'Gamma'],
  ]);
  workbook.getWorksheet('PR0N')!.addRows([
    ['P-1', '1001', 10],
    ['P-2', '1001', 15],
    ['P-3', '2002', 30],
  ]);
  workbook.getWorksheet('ZX29')!.addRows([['Z-1', '1001', 20]]);

  return workbook;
}

function createSanitizationWorkbook(): ExcelJS.Workbook {
  const workbook = createRequiredWorkbook();

  workbook.getWorksheet('customers PR0N')!.addRow([
    '10/01',
    '',
    'SG:A/B',
    'Acme? North|',
  ]);
  workbook.getWorksheet('PR0N')!.addRow(['P-1', '10/01', 10]);

  return workbook;
}

function createNoMatchWorkbook(): ExcelJS.Workbook {
  const workbook = createRequiredWorkbook();

  workbook.getWorksheet('customers PR0N')!.addRow(['1001', '', 'SG-A', 'Acme']);
  workbook.getWorksheet('PR0N')!.addRow(['P-1', '9999', 10]);
  workbook.getWorksheet('ZX29')!.addRow(['Z-1', '8888', 20]);

  return workbook;
}

function createRequiredWorkbook(): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  addDataSheet(workbook, 'PR0N');
  addDataSheet(workbook, 'ZX29');
  addCustomerSheet(workbook, 'customers PR0N');
  addCustomerSheet(workbook, 'customers ZX29');
  return workbook;
}

function addDataSheet(workbook: ExcelJS.Workbook, name: string): void {
  workbook.addWorksheet(name).addRow(['Type', 'Customer', 'Amount']);
}

function addCustomerSheet(workbook: ExcelJS.Workbook, name: string): void {
  workbook
    .addWorksheet(name)
    .addRow(['Customer', 'Unused', 'Sales Group', 'Short Name']);
}

async function createWorkbookFile(
  workbook: ExcelJS.Workbook,
  name = 'customers.xlsx'
): Promise<File> {
  const buffer = await workbook.xlsx.writeBuffer();
  return new File([buffer], name, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function createFileList(file: File): FileList {
  return {
    0: file,
    length: 1,
    item: (index: number) => (index === 0 ? file : null),
  } as unknown as FileList;
}

async function loadWorkbookFromZip(
  zip: JSZip,
  path: string
): Promise<ExcelJS.Workbook> {
  const file = zip.file(path);
  expect(file).toBeTruthy();
  const buffer = await file!.async('arraybuffer');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
}

function readWorksheetRows(
  workbook: ExcelJS.Workbook,
  sheetName: string
): unknown[][] {
  const worksheet = workbook.getWorksheet(sheetName);
  expect(worksheet).toBeTruthy();

  const rows: unknown[][] = [];
  worksheet!.eachRow((row) => {
    rows.push([row.getCell(1).value, row.getCell(2).value, row.getCell(3).value]);
  });
  return rows;
}
