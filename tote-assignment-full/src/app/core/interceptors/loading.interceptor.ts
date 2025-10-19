import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { ToteStateService } from '../state/tote.state.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private activeRequests = 0;

  constructor(private stateService: ToteStateService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.activeRequests === 0) {
      this.stateService.setLoading(true, 'Loading...');
    }

    this.activeRequests++;

    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          this.decreaseRequests();
        }
      }),
      finalize(() => {
        this.decreaseRequests();
      })
    );
  }

  private decreaseRequests(): void {
    this.activeRequests--;
    if (this.activeRequests === 0) {
      this.stateService.setLoading(false);
    }
  }
}
