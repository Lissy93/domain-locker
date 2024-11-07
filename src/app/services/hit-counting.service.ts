import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class HitCountingService {
  private plausibleEnabled = false;
  private analyticsKey = 'PRIVACY_disable-analytics';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.plausibleEnabled = this.shouldEnablePlausible();
    if (this.plausibleEnabled) {
      this.initializePlausible();
    }
  }

  /* Read Plausible config from environmental variables */
  private getCredentials() {
    const plausibleUrl = import.meta.env['DL_PLAUSIBLE_URL'];
    const plausibleSite = import.meta.env['DL_PLAUSIBLE_SITE'];
    return { plausibleUrl, plausibleSite };
  }

  /* Checks if Plausible analytics should be enabled */
  private shouldEnablePlausible(): boolean {
    // Ensure we are running in the browser environment
    if (!isPlatformBrowser(this.platformId)) return false;

    // Check for required environment variables
    const { plausibleUrl, plausibleSite } = this.getCredentials();
    const analyticsDisabled = localStorage.getItem(this.analyticsKey) === 'true';

    // Return false if user disabled, admin disabled or any missing values
    if (!plausibleUrl || !plausibleSite || analyticsDisabled) {
      return false;
    }

    return true;
  }

  /* Initializes Plausible Analytics */
  private initializePlausible(): void {
    const { plausibleUrl, plausibleSite } = this.getCredentials();

    // Insert the Plausible script into the document head
    const script = document.createElement('script');
    script.setAttribute('async', 'true');
    script.setAttribute('defer', 'true');
    script.setAttribute('data-domain', plausibleSite as string);
    script.src = `${plausibleUrl}/js/plausible.js`;
    document.head.appendChild(script);

    console.log('Plausible analytics enabled');
  }

  /* Track a key event in Plausible */
  public trackEvent(eventName: string, props?: Record<string, string>): void {
    if (this.plausibleEnabled && isPlatformBrowser(this.platformId)) {
      (window as any).plausible(eventName, { props });
    }
  }
}
