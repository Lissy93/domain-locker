import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, from, map, Observable, throwError } from 'rxjs';
import { SupabaseService } from '~/app/services/supabase.service';
import { EnvService } from '~/app/services/environment.service';
import { ErrorHandlerService } from '~/app/services//error-handler.service';
import { HttpClient } from '@angular/common/http';

/**
 * Environment Types
 */
export type BillingPlans = 'free' | 'hobby' | 'pro' | 'enterprise';
type SpecialPlans = 'sponsor' | 'complimentary' | 'tester' | 'demo' | 'super' | 'local';
export type UserType = BillingPlans | SpecialPlans;
type EnvironmentType = 'dev' | 'managed' | 'selfHosted' | 'demo';

@Injectable({
  providedIn: 'root',
})
export class BillingService {
  private userPlan$ = new BehaviorSubject<UserType | null>(null);
  private environmentType: EnvironmentType;

  constructor(
    private supabaseService: SupabaseService,
    private envService: EnvService,
    private errorHandler: ErrorHandlerService,
    private http: HttpClient,
  ) {
    this.environmentType = this.envService.getEnvironmentType();
  }

  /**
   * Fetches and caches the user's current plan from the database.
   */
  async fetchUserPlan(): Promise<void> {
    const envType = this.environmentType;

    if (envType === 'selfHosted') {
      this.userPlan$.next('super');
      return;
    } else if (envType === 'dev') {
      this.userPlan$.next('tester');
      return;
    } else if (envType === 'demo') {
      this.userPlan$.next('demo');
      return;
    }

    if (!this.envService.isSupabaseEnabled()) {
      this.userPlan$.next('local');
      return;
    }

    try {
      const user = await this.supabaseService.getCurrentUser();

      if (!user) {
        this.userPlan$.next(null);
        return;
      }

      // Fetch user plan from `user_info`
      const { data, error } = await this.supabaseService.getUserBillingInfo();
      if (error || !data?.current_plan) {
        this.errorHandler.handleError({
          error,
          message: 'Failed to fetch billing info',
          location: 'billing service',
        });
        this.userPlan$.next('free');
        return;
      }
      this.userPlan$.next(data.current_plan as UserType);
    } catch (error) {
      this.errorHandler.handleError({
        error,
        location: 'billing service',
        message: 'Unable to verify billing plan, fallback to free plan',
      });
      this.userPlan$.next('free');
    }
  }

  /**
   * Returns an observable of the user's current plan.
   */
  getUserPlan(): Observable<UserType | null> {
    return this.userPlan$.asObservable();
  }

  /** Returns an Observable that emits the user's billing row or throws an error. */
  getBillingData(): Observable<any> {
    return from(
      this.supabaseService.supabase
        .from('billing')
        .select('*')
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        return data;
      }),
      catchError((err) => throwError(() => err))
    );
  }

  async cancelSubscription(subscriptionId: string): Promise<any> {
    const userId = (await this.supabaseService.getCurrentUser())?.id;
    const endpoint = this.envService.getEnvVar('DL_STRIPE_CANCEL_URL', '/api/stripe/cancel-subscription');
    try {
      const body = { userId, subscriptionId };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to cancel subscription');
      }
      if (data.error) {
        throw new Error(data.error);
      }
      return data;
    } catch (error) {
      throw error;
    }
  }


  async createCheckoutSession(productId: string): Promise<string> {
    const userId = (await this.supabaseService.getCurrentUser())?.id;
    const endpoint = this.envService.getEnvVar('DL_STRIPE_CHECKOUT_URL', null, true);
    const host = this.envService.getEnvVar('DL_BASE_URL', 'https://domain-locker.com');
    const callbackUrl = host ? `${host}/settings/upgrade` : window.location.href;
    try {
      const body = { userId, productId, callbackUrl };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || 'Failed to create checkout session');
      }
      return data.url;
    } catch (error) {
      throw error;
    }
  }

  verifyStripeSession(sessionId: string) {
    this.http.post('/api/verify-checkout', { sessionId })
      .subscribe((res: any) => {
        if (res && res.status === 'paid') {
          // Payment is confirmed, plan is 'pro' or 'hobby', etc.
          // Now you can either refresh the user plan from DB or fallback if webhooks fail
        } else {
          // Payment not actually successful
        }
      });
  }

}
