import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http'; // Import HttpClient
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'; // Added ReactiveFormsModule and FormBuilder
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox'; // Added MatCheckboxModule
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import dayjs from 'dayjs';
import * as ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { Observable, forkJoin } from 'rxjs'; // Import Observable and forkJoin
import { map } from 'rxjs/operators'; // Import operators

@Component({
  selector: 'app-overtime-tools',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule, // Added ReactiveFormsModule
    MatCheckboxModule, // Added MatCheckboxModule
    MatProgressSpinnerModule, // Added spinner module
  ],
  template: `
    <div class="overtime-tools-container">
      <mat-card class="overtime-tools-card">
        <mat-card-header>
          <mat-card-title>
            <h1>Overtime Tools</h1>
          </mat-card-title>
          <mat-card-subtitle>
            <p>
              Tool to create Excel files for overtime calculation in Poland.
            </p>
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="column" [formGroup]="overtimeForm">
            <mat-form-field appearance="fill">
              <mat-label
                >Employees (one per line: name, job, full-time
                equivalent)</mat-label
              >
              <textarea
                matInput
                formControlName="employees"
                cdkTextareaAutosize
                #autosize="cdkTextareaAutosize"
                cdkAutosizeMinRows="3"
              ></textarea>
            </mat-form-field>

            <mat-form-field appearance="fill">
              <mat-label>Years to create (one per line, e.g., 2023)</mat-label>
              <textarea
                matInput
                formControlName="years"
                cdkTextareaAutosize
                #autosizeYears="cdkTextareaAutosize"
                cdkAutosizeMinRows="2"
              ></textarea>
            </mat-form-field>

            <h3>Months to create</h3>
            <div style="margin-bottom: 0.5rem; display: flex; gap: 0.5rem;">
              <button
                mat-stroked-button
                type="button"
                (click)="selectAllMonths()"
              >
                Select All
              </button>
              <button
                mat-stroked-button
                type="button"
                (click)="deselectAllMonths()"
              >
                Deselect All
              </button>
            </div>
            <div class="months-checkboxes">
              <mat-checkbox formControlName="january">January</mat-checkbox>
              <mat-checkbox formControlName="february">February</mat-checkbox>
              <mat-checkbox formControlName="march">March</mat-checkbox>
              <mat-checkbox formControlName="april">April</mat-checkbox>
              <mat-checkbox formControlName="may">May</mat-checkbox>
              <mat-checkbox formControlName="june">June</mat-checkbox>
              <mat-checkbox formControlName="july">July</mat-checkbox>
              <mat-checkbox formControlName="august">August</mat-checkbox>
              <mat-checkbox formControlName="september">September</mat-checkbox>
              <mat-checkbox formControlName="october">October</mat-checkbox>
              <mat-checkbox formControlName="november">November</mat-checkbox>
              <mat-checkbox formControlName="december">December</mat-checkbox>
            </div>

            <mat-form-field appearance="fill">
              <mat-label
                >Additional Days Off (one per line, e.g., YYYY-MM-DD)</mat-label
              >
              <textarea
                matInput
                formControlName="additionalDaysOff"
                cdkTextareaAutosize
                #autosizeDaysOff="cdkTextareaAutosize"
                cdkAutosizeMinRows="2"
              ></textarea>
            </mat-form-field>
            <button
              mat-raised-button
              color="primary"
              (click)="onGenerateFiles()"
              [disabled]="isGenerating"
            >
              <mat-progress-spinner
                *ngIf="isGenerating"
                diameter="20"
                mode="indeterminate"
                color="accent"
                style="vertical-align: middle; margin-right: 8px;"
              ></mat-progress-spinner>
              <span *ngIf="!isGenerating">Generate Excel Files</span>
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .overtime-tools-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
        justify-content: center;
        width: 100%; /* Takes full screen width by default */
      }

      .overtime-tools-card {
        width: 100%; /* Full width of the container */
        // max-width: 600px; /* Limit max width for larger screens */
        margin: 0 auto; /* Center the card */
      }
      .two-columns {
        display: flex;
        flex-direction: row;
        gap: 1.5rem; /* Increased gap for better separation */
      }

      .column {
        flex: 1; /* Each column takes equal width */
        display: flex;
        flex-direction: column;
        gap: 1rem; /* Gap between form elements in a column */
      }

      .months-checkboxes {
        display: grid;
        grid-template-columns: repeat(
          auto-fill,
          minmax(120px, 1fr)
        ); /* Responsive checkboxes */
        gap: 0.5rem;
      }

      mat-form-field {
        width: 100%; /* Make form fields take full width of their column */
      }

      @media (min-width: 1080px) {
        .overtime-tools-container {
          margin: 2rem auto;
          flex-direction: row;
          /* width: 100%; Removed as it's now in the base style */
        }
        mat-card {
          max-width: 600px;
        }
      }
    `,
  ],
})
export class OvertimeToolsComponent {
  overtimeForm: FormGroup;
  months = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];
  holidays: any[] = []; // To store fetched holidays

  templateWorkbook: ExcelJS.Workbook | null = null; // To store the template workbook
  templateFilePath = 'assets/overtime_template.xlsx'; // Template file name

  // Add mapping for Polish month names
  polishMonths: { [key: string]: string } = {
    january: 'Styczeń',
    february: 'Luty',
    march: 'Marzec',
    april: 'Kwiecień',
    may: 'Maj',
    june: 'Czerwiec',
    july: 'Lipiec',
    august: 'Sierpień',
    september: 'Wrzesień',
    october: 'Październik',
    november: 'Listopad',
    december: 'Grudzień',
  };

  isGenerating = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    // Inject HttpClient
    this.overtimeForm = this.fb.group({
      employees: ['Jan Kowalski, Prezes, 1\nJoanna Senyszyn, Prezydent, 0.5'],
      additionalDaysOff: [''],
      // Initialize months checkboxes
      january: [true],
      february: [true],
      march: [true],
      april: [true],
      may: [true],
      june: [true],
      july: [true],
      august: [true],
      september: [true],
      october: [true],
      november: [true],
      december: [true],
      years: ['2025'], // Add years form control
    });
  }

  getHolidaysForYears(years: number[]): Observable<any[]> {
    const holidayRequests = years.map((year) => {
      const url = `https://openholidaysapi.org/PublicHolidays?countryIsoCode=PL&languageIsoCode=PL&validFrom=${year}-01-01&validTo=${year}-12-31`;
      return this.http.get<any[]>(url);
    });
    return forkJoin(holidayRequests).pipe(
      map((responses) => responses.reduce((acc, val) => acc.concat(val), [])) // Flatten the array of arrays
    );
  }

  parseEmployeesInput(
    input: string
  ): { name: string; job: string; fte: number }[] {
    return input.split('\n').map((line) => {
      const [name, job, fte] = line.split(',').map((item) => item.trim());
      return { name, job, fte: Number(fte) };
    });
  }

  calculateWorkingHoursInMonth(
    daysOff: string[],
    month: number,
    year: number
  ): number {
    const monthStart = dayjs(
      `${year}-${String(month + 1).padStart(2, '0')}-01`
    );
    const totalDaysInMonth = monthStart.daysInMonth();
    let workingDays = 0;

    // Ensure daysOff is always an array
    const daysOffArr = Array.isArray(daysOff) ? daysOff : [];

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const currentDate = monthStart.date(day);
      const isWeekend = currentDate.day() === 0 || currentDate.day() === 6; // Sunday or Saturday
      const isHoliday = daysOffArr.some((holiday) =>
        dayjs(holiday).isSame(currentDate, 'day')
      );
      if (!isWeekend && !isHoliday) {
        workingDays++;
      }
    }
    return workingDays * 8; // Assuming 8 hours per working day
  }

  // Example usage in ngOnInit or another method
  ngOnInit() {
    this.getTemplateFile();
  }

  getTemplateFile() {
    this.http
      .get(this.templateFilePath, { responseType: 'arraybuffer' })
      .subscribe({
        next: (data) => {
          const workbook = new ExcelJS.Workbook();
          workbook.xlsx.load(data).then(() => {
            this.templateWorkbook = workbook;
          });
        },
        error: (error) => {
          console.error('Error loading template file:', error);
        },
      });
  }

  async generateExcelFiles(
    employees: { name: string; job: string; fte: number }[],
    years: number[],
    months: string[],
    allDaysOff: string[]
  ) {
    this.isGenerating = true;
    try {
      console.log('Generate Excel Files:', {
        employees,
        years,
        months,
        allDaysOff,
      });
      const workbooks = [];
      for (const employee of employees) {
        for (const year of years) {
          for (const month of months) {
            const monthIndex = this.months.indexOf(month);
            const workingHours =
              this.calculateWorkingHoursInMonth(allDaysOff, monthIndex, year) *
              employee.fte; // Calculate working hours based on FTE
            const name = employee.name;
            const job = employee.job;
            const fte = employee.fte;
            // Use Polish month name
            const monthName =
              this.polishMonths[month] ||
              month.charAt(0).toUpperCase() + month.slice(1);

            const nameCell = 'O1';
            const jobCell = 'O2';
            const fteCell = 'X2';
            const yearCell = 'C3';
            const monthCell = 'C4';
            const workingHoursCell = 'O4';
            const daysCellStartColumnIndex = 'D';
            const daysCellsStartRowIndex = 6;
            const daysCellsEndRowIndex = 20;

            console.log(
              `Employee: ${name}, Year: ${year}, Month: ${monthName}, Working Hours: ${workingHours}`
            );

            if (this.templateWorkbook) {
              const newWorkbook = new ExcelJS.Workbook();
              const templateBuffer =
                await this.templateWorkbook.xlsx.writeBuffer();
              await newWorkbook.xlsx.load(templateBuffer);
              // Now newWorkbook is a deep copy of the template
              const worksheet = newWorkbook.getWorksheet(1);
              if (worksheet) {
                worksheet.getCell(nameCell).value = name;
                worksheet.getCell(jobCell).value = job;
                worksheet.getCell(fteCell).value = fte;
                worksheet.getCell(yearCell).value = year;
                worksheet.getCell(monthCell).value = monthName;
                worksheet.getCell(workingHoursCell).value = workingHours;

                // For every day which is not working (including weekends and holidays)
                // set the cell to "X"
                const totalDaysInMonth = dayjs(
                  `${year}-${String(month + 1).padStart(2, '0')}-01`
                ).daysInMonth();
                for (let day = 1; day <= 31; day++) {
                  const currentDate = dayjs(Date.UTC(year, monthIndex, day));
                  const isWeekend =
                    currentDate.day() === 0 || currentDate.day() === 6; // Sunday or Saturday
                  const isHoliday = allDaysOff.some((holiday) =>
                    dayjs(holiday).isSame(currentDate, 'day')
                  );
                  const isOutOfRange =
                    day > totalDaysInMonth ||
                    currentDate.month() !== monthIndex;

                  // Calculate the column index for the day (Excel columns are letters)
                  // daysCellStartColumnIndex is 'D', so day 1 is column D, day 2 is E, etc.
                  // Calculate Excel column letter (supports columns beyond Z, e.g., AA, AB, etc.)
                  function getExcelColumnLetter(colNum: number): string {
                    let letter = '';
                    while (colNum > 0) {
                      const mod = (colNum - 1) % 26;
                      letter = String.fromCharCode(65 + mod) + letter;
                      colNum = Math.floor((colNum - 1) / 26);
                    }
                    return letter;
                  }
                  // daysCellStartColumnIndex is 'D' (column 4), so day 1 is column 4, day 2 is 5, etc.
                  const startColNum =
                    daysCellStartColumnIndex.charCodeAt(0) - 64; // 'A' is 1
                  const columnIndex = getExcelColumnLetter(
                    startColNum + (day - 1)
                  );
                  if (isWeekend || isHoliday || isOutOfRange) {
                    for (const rowIndex of Array.from(
                      {
                        length:
                          daysCellsEndRowIndex - daysCellsStartRowIndex + 1,
                      },
                      (_, i) => i + daysCellsStartRowIndex
                    )) {
                      const cellIndex = `${columnIndex}${rowIndex}`;

                      const cell = worksheet.getCell(cellIndex);
                      cell.value = 'X';
                    }
                  }
                }

                const employeeName = name.replace(' ', '_');
                const filePath = `${employeeName}_${year}_${monthName}.xlsx`;
                workbooks.push({
                  filePath,
                  workbook: newWorkbook,
                });
              }
            }
          }
        }
      }
      const zipFileName = 'overtime_files.zip';
      const zip = new JSZip();
      for (const workbook of workbooks) {
        const filePath = workbook.filePath;
        const newWorkbook = workbook.workbook;
        zip.file(filePath, newWorkbook.xlsx.writeBuffer());
      }
      zip.generateAsync({ type: 'blob' }).then((content: any) => {
        const blob = new Blob([content], { type: 'application/zip' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = zipFileName;
        a.click();
        window.URL.revokeObjectURL(url);
      });
    } finally {
      this.isGenerating = false;
    }
  }

  onGenerateFiles() {
    this.isGenerating = true;
    // TODO: Implement Excel file generation logic here

    const employeesInput = this.overtimeForm.get('employees')?.value;
    const parsedEmployees = this.parseEmployeesInput(employeesInput);
    const yearsInput = this.overtimeForm.get('years')?.value;
    const years = yearsInput
      .split('\n')
      .map((y: string) => y.trim())
      .filter(Boolean);
    const months = this.months.filter(
      (month) => this.overtimeForm.get(month)?.value
    );
    const additionalDaysOff = this.overtimeForm
      .get('additionalDaysOff')
      ?.value.split('\n')
      .map((d: string) => d.trim())
      .filter(Boolean);
    // Fix: Merge holidays and additionalDaysOff as arrays
    this.getHolidaysForYears(years).subscribe({
      next: (holidays) => {
        const holidayDates = holidays.map((holiday) => holiday.startDate); // Extracting only the date
        const allDaysOff = [
          ...(Array.isArray(holidayDates) ? holidayDates : []),
          ...(Array.isArray(additionalDaysOff) ? additionalDaysOff : []),
        ];

        this.generateExcelFiles(parsedEmployees, years, months, allDaysOff);
      },
      error: (err) => {
        this.isGenerating = false;
      },
    });
    // You can now use these holidays in your component, e.g., to update the additionalDaysOff
    // Add your file generation logic here
  }

  selectAllMonths() {
    this.months.forEach((month) => {
      this.overtimeForm.get(month)?.setValue(true);
    });
  }

  deselectAllMonths() {
    this.months.forEach((month) => {
      this.overtimeForm.get(month)?.setValue(false);
    });
  }
}
