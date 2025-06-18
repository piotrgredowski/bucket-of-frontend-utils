# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Angular 19 web application called "Bucket of Frontend Utils" that provides browser-based utility tools:

- **PDF Tools**: PDF manipulation including splitting multipage PDFs
- **QR Tools**: QR code generation including WiFi QR codes
- **Overtime Tools**: Excel file generation for overtime calculation in Poland

The application is deployed at: https://gredowski.com/bucket-of-frontend-utils

## Development Commands

```bash
# Development
npm start                # Start dev server (http://localhost:4200)
npm run build           # Production build
npm run watch           # Build in watch mode

# Testing
npm test                # Run unit tests (Karma/Jasmine)
npm run e2e             # Open Cypress UI for E2E tests
npm run cypress:run     # Run Cypress tests headless

# Deployment
npm run deploy          # Deploy to GitHub Pages
# Or manually:
ng deploy --base-href "https://gredowski.com/bucket-of-frontend-utils/"
```

## Architecture

The application uses:

- **Angular 19** with standalone components (no NgModules)
- **Lazy-loaded routes** for each tool section
- **Angular Material** for UI components
- **Client-side file processing** (PDFs, Excel, QR codes)

Key libraries:

- `pdf-lib` and `pdfjs-dist` for PDF manipulation
- `exceljs` for Excel generation
- `qrcode` for QR code generation
- `dayjs` for date handling

## Project Structure

```text
/src/app/
├── components/         # Shared UI components
├── pages/             # Page components
├── pdf-tools/         # PDF manipulation features
├── qr-tools/          # QR code generation
├── overtime-tools/    # Excel overtime calculator
└── types/             # TypeScript definitions
```

## Testing

- **Unit tests**: Located alongside components as `*.spec.ts` files
- **E2E tests**: Located in `/cypress/e2e/`
- **Playwright testing**: Available via playwright-mcp for browser automation
- Run specific unit test: Use `fdescribe()` or `fit()` in test files
- Run specific E2E test: `npm run cypress:run -- --spec "cypress/e2e/specific-test.cy.ts"`

## Browser Testing with Playwright

This project can be tested using Playwright through the playwright-mcp integration. Use the playwright MCP tools for:

- **Interactive testing**: Navigate, click, type, and interact with the application
- **Visual debugging**: Take screenshots and snapshots during testing
- **File upload testing**: Test PDF merger and other file upload features
- **Download validation**: Verify generated files and downloads
- **Console monitoring**: Track browser console logs and errors
- **Memory testing**: Monitor performance with large files (like 30MB+ PDFs)

Example test files are included in the root directory:
- `test-pdf-merger-playwright.js` - Full PDF merger test with large files
- `test-pdf-merger-small.js` - PDF merger test with small files only

To run browser tests, ensure the dev server is running (`npm start`) then use the playwright MCP tools to navigate to `http://localhost:4200`.

**Playwright Configuration**: Always use Chromium browser for MCP Playwright testing. Use Chromium in headless mode for consistent, reliable browser automation testing. This ensures tests run efficiently without GUI overhead while maintaining full browser compatibility.

## Important Notes

- The overtime tools fetch Polish holidays from OpenHolidaysAPI
- Excel template is stored in `/src/assets/rozliczenie-nadgodzin-template.xlsx`
- All file processing happens client-side (no server uploads)
- Material theme: indigo-pink
- Responsive design with mobile support
