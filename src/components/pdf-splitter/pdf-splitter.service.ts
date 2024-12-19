import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PdfSplitterState {
  selectedFile: File | null;
  isProcessing: boolean;
  error: string | null;
}

const initialState: PdfSplitterState = {
  selectedFile: null,
  isProcessing: false,
  error: null,
};

@Injectable({
  providedIn: 'root',
})
export class PdfSplitterService {
  private state = new BehaviorSubject<PdfSplitterState>(initialState);

  get state$(): Observable<PdfSplitterState> {
    return this.state.asObservable();
  }

  setSelectedFile(file: File | null): void {
    this.updateState({ selectedFile: file, error: null });
  }

  setProcessing(isProcessing: boolean): void {
    this.updateState({ isProcessing });
  }

  setError(error: string | null): void {
    this.updateState({ error });
  }

  reset(): void {
    this.state.next(initialState);
  }

  private updateState(patch: Partial<PdfSplitterState>): void {
    this.state.next({
      ...this.state.value,
      ...patch,
    });
  }
}
