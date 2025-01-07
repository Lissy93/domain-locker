import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '@/app/prime-ng.module';
import { type FeatureDefinitions, featureDescriptions } from '@/app/constants/feature-options';
import { EnvironmentType, EnvService } from '@/app/services/environment.service';
import { Observable } from 'rxjs';
import { BillingService } from '@/app/services/billing.service';

@Component({
  selector: 'app-feature-not-enabled',
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  template: `
    <p-messages severity="warn" styleClass="">
      <ng-template pTemplate>
        <div class="flex justify-between items-center w-full">
          <span>
            <i class="pi pi-lock"></i>
            {{ featureName || 'This feature'}} is not available 
            @if (environment === 'managed') {
              on the {{ (userPlan$ | async) || 'current' }} plan
            } @else {
              in {{ mapEnvironmentToString(environment) }} environments
            }
          </span>
          <p-button
            *ngIf="environment === 'managed'"
            severity="warning"
            label="Upgrade"
            icon="pi pi-arrow-circle-right"
            size="small"
            routerLink="/settings/upgrade"
          />
        </div>
      </ng-template>
    </p-messages>
  `,
  styles: []
})
export class FeatureNotEnabledComponent {
  @Input() feature!: keyof FeatureDefinitions;
  featureName?: string;
  featureDescription?: string;

  environment: EnvironmentType;
  userPlan$: Observable<string | null>;
  
  constructor(
    private billingService: BillingService,
    private environmentService: EnvService,
  ) {
    this.environment = this.environmentService.getEnvironmentType();
    this.userPlan$ = this.billingService.getUserPlan();
  }

  ngOnInit(): void {
    this.billingService.fetchUserPlan();
    this.featureName = featureDescriptions[this.feature]?.label;
    this.featureDescription = featureDescriptions[this.feature]?.description;
  }

  mapEnvironmentToString(env: EnvironmentType): string {
    switch (env) {
      case 'dev':
        return 'development';
      case 'selfHosted':
        return 'self-hosted';
      case 'demo':
        return 'live demo';
      default:
        return env;
    }
  }
}

