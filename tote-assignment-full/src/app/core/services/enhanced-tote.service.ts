import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap, shareReplay } from 'rxjs/operators';
import { ToteContentsResponse, ScanHistory, ScanStatus } from '../models/tote.models';
import { ToteStateService } from '../state/tote.state.service';

@Injectable({
  providedIn: 'root'
})
export class EnhancedToteService {
  private readonly API_BASE = '/api';
  private readonly cache = new Map<string, Observable<ToteContentsResponse>>();
  private readonly CACHE_EXPIRY_MS = 5 * 60 * 1000;

  constructor(
    private http: HttpClient,
    private stateService: ToteStateService
  ) {}

  getToteContents(toteId: string, useCache = true): Observable<ToteContentsResponse> {
    const trimmedId = toteId.trim();

    if (!trimmedId) {
      return throwError(() => ({ message: 'Tote ID cannot be empty' }));
    }

    if (useCache && this.cache.has(trimmedId)) {
      const cached = this.cache.get(trimmedId);
      if (cached) {
        return cached;
      }
    }

    this.stateService.setScanStatus(ScanStatus.SCANNING);
    this.stateService.clearError();

    const request$ = this.http.get<ToteContentsResponse>(`${this.API_BASE}/totes/${trimmedId}`).pipe(
      tap(response => {
        this.stateService.setCurrentTote(response);
        this.stateService.setLastScannedId(trimmedId);
        this.stateService.setScanStatus(ScanStatus.SUCCESS);

        const history: ScanHistory = {
          id: this.generateId(),
          toteId: trimmedId,
          scannedAt: new Date(),
          itemCount: response.items.length,
          success: true
        };
        this.stateService.addScanHistory(history);

        this.scheduleCache Expiry(trimmedId);
      }),
      catchError(error => {
        this.stateService.setScanStatus(ScanStatus.ERROR);
        this.stateService.setError(
          true,
          error.message || 'Failed to load tote contents',
          error.code,
          error.status !== 404
        );

        const history: ScanHistory = {
          id: this.generateId(),
          toteId: trimmedId,
          scannedAt: new Date(),
          itemCount: 0,
          success: false,
          errorMessage: error.message
        };
        this.stateService.addScanHistory(history);

        return throwError(() => error);
      }),
      shareReplay(1)
    );

    if (useCache) {
      this.cache.set(trimmedId, request$);
    }

    return request$;
  }

  checkToteExists(toteId: string): Observable<boolean> {
    return this.http.get<ToteContentsResponse>(`${this.API_BASE}/totes/${toteId}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  clearCache(toteId?: string): void {
    if (toteId) {
      this.cache.delete(toteId);
    } else {
      this.cache.clear();
    }
  }

  prefetchTote(toteId: string): void {
    if (!this.cache.has(toteId)) {
      this.getToteContents(toteId, true).subscribe({
        next: () => console.log(`Prefetched tote: ${toteId}`),
        error: (err) => console.warn(`Failed to prefetch tote: ${toteId}`, err)
      });
    }
  }

  private scheduleCacheExpiry(toteId: string): void {
    setTimeout(() => {
      this.cache.delete(toteId);
    }, this.CACHE_EXPIRY_MS);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
