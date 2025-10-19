import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, mergeMap } from 'rxjs/operators';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      retry({
        count: this.MAX_RETRIES,
        delay: (error: HttpErrorResponse, retryCount: number) => {
          if (this.shouldRetry(error, retryCount)) {
            const delayMs = this.calculateBackoff(retryCount);
            console.log(`Retrying request (${retryCount}/${this.MAX_RETRIES}) after ${delayMs}ms`);
            return timer(delayMs);
          }
          return throwError(() => error);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const errorMessage = this.getErrorMessage(error);
        console.error('HTTP Error:', {
          url: req.url,
          status: error.status,
          message: errorMessage,
          timestamp: new Date().toISOString()
        });

        return throwError(() => ({
          status: error.status,
          message: errorMessage,
          code: this.getErrorCode(error),
          originalError: error
        }));
      })
    );
  }

  private shouldRetry(error: HttpErrorResponse, retryCount: number): boolean {
    if (retryCount >= this.MAX_RETRIES) {
      return false;
    }

    const retryableStatuses = [0, 408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status);
  }

  private calculateBackoff(retryCount: number): number {
    return Math.pow(2, retryCount - 1) * this.RETRY_DELAY_MS;
  }

  private getErrorMessage(error: HttpErrorResponse): string {
    if (error.error?.message) {
      return error.error.message;
    }

    switch (error.status) {
      case 0:
        return 'Network error. Please check your connection.';
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Unauthorized. Please log in.';
      case 403:
        return 'Access forbidden.';
      case 404:
        return 'Tote not found. Please check the barcode.';
      case 408:
        return 'Request timeout. Please try again.';
      case 429:
        return 'Too many requests. Please wait a moment.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
        return 'Service temporarily unavailable.';
      case 504:
        return 'Gateway timeout. Please try again.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }

  private getErrorCode(error: HttpErrorResponse): string {
    return `HTTP_${error.status}`;
  }
}
