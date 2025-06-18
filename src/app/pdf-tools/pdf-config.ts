import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - use consistent version across all components
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export { pdfjsLib };