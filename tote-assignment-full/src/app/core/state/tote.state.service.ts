import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { ToteContentsResponse, ScanHistory, LoadingState, ErrorState, ScanStatus } from '../models/tote.models';

interface ToteState {
  currentTote: ToteContentsResponse | null;
  scanHistory: ScanHistory[];
  loading: LoadingState;
  error: ErrorState;
  scanStatus: ScanStatus;
  lastScannedId: string | null;
}

const initialState: ToteState = {
  currentTote: null,
  scanHistory: [],
  loading: { isLoading: false },
  error: { hasError: false },
  scanStatus: ScanStatus.IDLE,
  lastScannedId: null
};

@Injectable({
  providedIn: 'root'
})
export class ToteStateService {
  private state$ = new BehaviorSubject<ToteState>(initialState);

  readonly currentTote$: Observable<ToteContentsResponse | null> = this.select(state => state.currentTote);
  readonly scanHistory$: Observable<ScanHistory[]> = this.select(state => state.scanHistory);
  readonly loading$: Observable<LoadingState> = this.select(state => state.loading);
  readonly error$: Observable<ErrorState> = this.select(state => state.error);
  readonly scanStatus$: Observable<ScanStatus> = this.select(state => state.scanStatus);
  readonly lastScannedId$: Observable<string | null> = this.select(state => state.lastScannedId);

  readonly isLoading$: Observable<boolean> = this.loading$.pipe(
    map(loading => loading.isLoading),
    distinctUntilChanged()
  );

  readonly hasError$: Observable<boolean> = this.error$.pipe(
    map(error => error.hasError),
    distinctUntilChanged()
  );

  private select<T>(selector: (state: ToteState) => T): Observable<T> {
    return this.state$.pipe(
      map(selector),
      distinctUntilChanged()
    );
  }

  getState(): ToteState {
    return this.state$.value;
  }

  setCurrentTote(tote: ToteContentsResponse | null): void {
    this.updateState({ currentTote: tote });
  }

  setLoading(isLoading: boolean, message?: string): void {
    this.updateState({
      loading: { isLoading, message }
    });
  }

  setError(hasError: boolean, message?: string, code?: string, retryable = true): void {
    this.updateState({
      error: { hasError, message, code, retryable }
    });
  }

  setScanStatus(status: ScanStatus): void {
    this.updateState({ scanStatus: status });
  }

  setLastScannedId(toteId: string | null): void {
    this.updateState({ lastScannedId: toteId });
  }

  addScanHistory(history: ScanHistory): void {
    const currentHistory = this.getState().scanHistory;
    const updatedHistory = [history, ...currentHistory].slice(0, 50);
    this.updateState({ scanHistory: updatedHistory });
  }

  clearError(): void {
    this.updateState({
      error: { hasError: false }
    });
  }

  clearHistory(): void {
    this.updateState({ scanHistory: [] });
  }

  reset(): void {
    this.state$.next(initialState);
  }

  private updateState(partial: Partial<ToteState>): void {
    const currentState = this.getState();
    this.state$.next({ ...currentState, ...partial });
  }
}
