import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { BillingService } from '~/app/services/billing.service';
import { pricingFeatures } from '~/app/constants/pricing-features';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-upgrade',
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './upgrade.page.html',
})
export default class UpgradePage implements OnInit {
  currentPlan$: Observable<string | null>;
  public availablePlans = pricingFeatures;
  
  public isAnnual = true;
  public billingCycleOptions = [
    { label: 'Annual', value: true, icon: 'pi pi-calendar-plus' },
    { label: 'Monthly', value: false, icon: 'pi pi-calendar-minus' }
  ];

  constructor(private billingService: BillingService) {
    this.currentPlan$ = this.billingService.getUserPlan();
  }

  ngOnInit(): void {
    // Ensure the user's current plan is fetched
    this.billingService.fetchUserPlan().catch((error) =>
      console.error('Failed to fetch current plan:', error)
    );
  }

  async handleUpgrade(planId: string): Promise<void> {
    try {
      if (!planId) return;
      const stripeSession = await this.billingService.createCheckoutSession(planId);
      window.location.href = stripeSession.url; // Redirect to Stripe Checkout
    } catch (error) {
      console.error('Error starting upgrade process:', error);
    }
  }

  getPrice(plan: any) {
    return this.isAnnual ? plan.priceAnnual : plan.priceMonth;
  }
}
