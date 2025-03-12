import { Injectable, isDevMode, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as Sentry from '@sentry/angular';
import { EnvService } from '~/app/services/environment.service';

import { GlobalMessageService } from '~/app/services/messaging.service';

interface ErrorParams {
  error?: Error | any, // Should be error, but might be funny error type
  message?: string; // Friendly message to show to user (if needed)
  location?: string; // Location in code where error occurred
  showToast?: boolean; // Whether to show a toast to the user
  date?: Date; // Date of error (if not now)
}

/**
 * Global error handler service.
 * Called whenever an error is caught in the app.
 * If running in dev or debug mode, logs to console.
 * If server has GT configured, and user has enabled logging, sends to GlitchTip.
 * If user-triggered, shows a toast message to the user.
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  private glitchTipEnabled = false; // Don't log errors, unless enabled

  private lsKey = 'PRIVACY_disable-error-tracking';

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private globalMessageService: GlobalMessageService,
    private envService: EnvService,
  ) {
    this.glitchTipEnabled = this.shouldEnableGlitchTip();
    if (this.glitchTipEnabled) {
      this.initializeGlitchTip();
    }
  }


  /* Shows a popup toast message to the user (if user-triggered) */
  private showToast(title: string, message: string): void {
    this.globalMessageService.showMessage({
      severity: 'error',
      summary: title,
      detail: message,
    })
  }

  /* Logs an error to the console (when in dev or debug mode) */
  private printToConsole(message?: string, location?: string, error?: any): void {
    console.error(`Error in ${location || 'unknown location'}: ${message}`, error);
  };

  /* Determines whether to enable GlitchTip (if enabled at server-level, and not disabled by user) */
  private shouldEnableGlitchTip(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false; // Don't run on server-side
    const glitchTipDsn = this.envService.getGlitchTipDsn(); // Get DSN from environment service
    const disabledByUser = localStorage.getItem(this.lsKey) !== null; // Check if user disabled error tracking
    const isLocal = isDevMode(); // Check if we are running in development mode

    // If there's any reason to disable GlitchTip, log it and skip initialization
    if (!glitchTipDsn || disabledByUser || isLocal) {
      const whyDisabled = [];
      if (!glitchTipDsn) whyDisabled.push('No GlitchTip DSN Provided');
      if (disabledByUser) whyDisabled.push('Error tracking disabled by user');
      if (isLocal) whyDisabled.push('App running in dev mode');
      console.log(`GlitchTip not enabled due to: ${whyDisabled.join(', ')}`);
      return false;
    }
    return true;
  }

  /* Initializes GlitchTip error tracking (if not disabled by user or admin) */
  private initializeGlitchTip(): void {
    if (!this.glitchTipEnabled) return;
    const glitchTipDsn = this.envService.getGlitchTipDsn();
    Sentry.init({
      dsn: glitchTipDsn,
      integrations: [ Sentry.browserTracingIntegration() ],
      tracesSampleRate: 1.0,
    });
  }

  /* Gets the user ID from local storage (if available) */
  private getUserId(): string | null {
    const projectName = this.envService.getProjectId();
    let userId: string | null = null;
    if (projectName && typeof localStorage !== 'undefined') {
      const authObject = localStorage.getItem(`sb-${projectName}-auth-token`);
      if (authObject) {
        const user = JSON.parse(authObject)?.user;
        userId = user?.id || null;
      }
    }
    return userId;
  }

  /* Logs an error to GlitchTip with user context */
  private logToGlitchTip(message: string, location: string, error: any): void {
    if (!this.glitchTipEnabled) return;
    const userId = this.getUserId();
      Sentry.setUser( userId ? { id: userId } : null);
      Sentry.withScope((scope) => {
        scope.setContext('context', { message, location });
        Sentry.captureException(error);
      });
  }

  private saveToLocalStorage(message: string, location: string, error: any): void {
    if (!isPlatformBrowser(this.platformId) || !localStorage) return;
    const key = 'DL_error_log';
    const lsErrorLog = JSON.parse(localStorage.getItem(key) || '[]');
    lsErrorLog.push({ message, location, error, date: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(lsErrorLog));
  }

  /* Entry point for error handler, takes appropriate logging action */
  public handleError(params: ErrorParams): void {
    const { error, message, location, showToast } = params;
    if (!error && !message) return; // Not much I can do without an error or message!
    
    // Log to console in development mode
    if (isDevMode()) {
      this.printToConsole(message, location, error);
    }

    // Show error toast if showError is true
    if (showToast && message && error) {
      if (error.message) {
        this.showToast(message, error.message);
      } else {
        this.showToast('Error', message);
      }
    }

    // Log error to Glitchtip (if enabled) with user context
    if (this.glitchTipEnabled && error) {
      this.logToGlitchTip(message || 'mystery error', location || '-', error);
    }

    // Save to recent error log in localstorage
    this.saveToLocalStorage(message || 'mystery error', location || '-', error);
  }

  public getRecentErrorLog(): any[] {
    return JSON.parse(localStorage.getItem('DL_error_log') || '[]').reverse();
  }
}
