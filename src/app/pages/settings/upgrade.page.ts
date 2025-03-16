import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { BillingService } from '~/app/services/billing.service';
import { pricingFeatures } from '~/app/constants/pricing-features';
import { Observable } from 'rxjs';
import { ErrorHandlerService } from '~/app/services/error-handler.service';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ConfirmationService } from 'primeng/api';
import { GlobalMessageService } from '~/app/services/messaging.service';
import { EnvService } from '~/app/services/environment.service';
import { FeatureNotEnabledComponent } from '~/app/components/misc/feature-not-enabled.component';
import { FeatureService } from '~/app/services/features.service';

@Component({
  selector: 'app-upgrade',
  standalone: true,
  imports: [CommonModule, PrimeNgModule, FeatureNotEnabledComponent],
  templateUrl: './upgrade.page.html',
  styles: ['::ng-deep .p-confirm-dialog { max-width: 600px; }'],
})
export default class UpgradePage implements OnInit {
  currentPlan$: Observable<string | null>;
  public availablePlans = pricingFeatures;
  public billingInfo: any;

  public isAnnual = true;
  public billingCycleOptions = [
    { label: 'Annual', value: true, icon: 'pi pi-calendar-plus' },
    { label: 'Monthly', value: false, icon: 'pi pi-calendar-minus' }
  ];

  public status: 'nothing' | 'success' | 'failed' = 'nothing';

  enableBilling$ = this.featureService.isFeatureEnabled('enableBilling');

  constructor(
    private billingService: BillingService,
    private errorHandler: ErrorHandlerService,
    private route: ActivatedRoute,
    private http: HttpClient,
    private confirmationService: ConfirmationService,
    private messagingService: GlobalMessageService,
    private envService: EnvService,
    private featureService: FeatureService,
  ) {
    this.currentPlan$ = this.billingService.getUserPlan();
  }

  ngOnInit(): void {
    // Ensure the user's current plan is fetched
    this.billingService.fetchUserPlan().catch((error) =>
      this.errorHandler.handleError({ error, message: 'Failed to fetch user plan', showToast: true }),
    );

    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    const success = this.route.snapshot.queryParamMap.get('success');
    const cancelled = this.route.snapshot.queryParamMap.get('canceled');

    if (success && sessionId) {
      this.status = 'success';
    } else if (cancelled) {
      this.status = 'failed';
    }

    this.billingService.getBillingData().subscribe((data) => {
      this.billingInfo = data;
    });
  }

  getStripePlanId(planId: string): string {
    const planMap: { [key: string]: { annual: string; monthly: string } } = {
      free: { annual: '', monthly: '' },
      hobby: { annual: 'dl_hobby_annual', monthly: 'dl_hobby_monthly' },
      pro: { annual: 'dl_pro_annual', monthly: 'dl_pro_monthly' },
    };

    const billingCycle = this.isAnnual ? 'annual' : 'monthly';
    return planMap[planId]?.[billingCycle] || '';
  }

  async handleUpgrade(planId: string): Promise<void> {
    const stripePlanId = this.getStripePlanId(planId);
    if (!stripePlanId) {
      this.errorHandler.handleError({ message: 'Invalid plan ID', showToast: true });
      return;
    }
    try {
      const stripeSessionUrl = await this.billingService.createCheckoutSession(stripePlanId);
      window.location.href = stripeSessionUrl;
    } catch (error) {
      this.errorHandler.handleError({ error, message: 'Failed to create Stripe session', showToast: true });
    }
  }

  getPrice(plan: any) {
    return this.isAnnual ? plan.priceAnnual : plan.priceMonth;
  }

  cancelSubscription() {
    this.confirmationService.confirm({
      message: 'You can cancel your subscription at any time, but '
        + 'you\'ll lose access to all premium features, '
        + 'including stats, monitor, alerts, change history, data connectors and more.'
        + 'You may also loose access to your data if you have more than the free plan quota, '
        + 'so it\'s recommended you check this is okay, or export your data first.',
      header: 'Are you sure that you want to downgrade?',
      icon: 'pi pi-exclamation-triangle',
      rejectLabel: 'No, stay subscribed',
      rejectButtonStyleClass: 'p-button-sm p-button-success',
      acceptIcon:'pi pi-times-circle mr-2',
      rejectIcon:'pi pi-check-circle mr-2',
      acceptButtonStyleClass:'p-button-sm p-button-danger p-button-text',
      closeOnEscape: true,
      accept: () => {
        const subscriptionId = this.billingInfo?.meta?.subscription_id;
        this.billingService.cancelSubscription(subscriptionId)
          .then(() => {
            this.messagingService.showSuccess(
              'Subscription Canceled',
              'Your subscription has been successfully canceled.',
            );
          })
          .catch((error) => {
            this.errorHandler.handleError({ error, message: 'Failed to cancel subscription', showToast: true });
          });
      },
    });
  }
}
