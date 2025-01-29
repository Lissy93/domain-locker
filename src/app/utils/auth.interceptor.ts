import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { EnvService } from '~/app/services/environment.service';
import { SupabaseService } from '~/app/services/supabase.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private envService: EnvService,
    private supabaseService: SupabaseService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const environment = this.envService.getEnvironmentType();

    // Apply auth only in 'managed' environment
    if (environment === 'managed' && request.url.startsWith('/api/')) {
      return from(this.supabaseService.getSessionData()).pipe(
        switchMap((sessionData: { session?: { access_token?: string } }) => {
          const token = sessionData?.session?.access_token;

          if (token) {
            const authRequest = request.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`,
              },
            });
            return next.handle(authRequest);
          }
          return next.handle(request);
        })
      );
    }

    // In other environments or for non-API requests, pass through as-is
    return next.handle(request);
  }
}
