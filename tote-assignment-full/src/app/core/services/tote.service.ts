
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retryWhen, mergeMap } from 'rxjs/operators';

export interface ToteItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  imageUrl?: string | null;
}

export interface ToteContentsResponse {
  toteId: string;
  items: ToteItem[];
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ToteService {
  private base = '/api';

  constructor(private http: HttpClient) {}

  getToteContents(toteId: string): Observable<ToteContentsResponse> {
    return this.http.get<ToteContentsResponse>(`${this.base}/totes/${toteId}`).pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, i) => {
            if (i >= 2 || (error.status >= 400 && error.status < 500)) {
              return throwError(() => error);
            }
            const backoffMs = Math.pow(2, i) * 300;
            return timer(backoffMs);
          })
        )
      ),
      catchError(this.handleError)
    );
  }

  private handleError(err: HttpErrorResponse) {
    const message = err.error?.message || err.statusText || 'Network error';
    return throwError(() => ({ status: err.status, message }));
  }
}
