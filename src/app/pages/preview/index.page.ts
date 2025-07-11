import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../prime-ng.module';
import { DomainUtils } from '~/app/services/domain-utils.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FeatureService } from '~/app/services/features.service';
import { CtaComponent } from '~/app/components/home-things/cta/cta.component';
import { BusinessFeaturesComponent } from '~/app/components/about-things/business-features.component';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-domain-details',
  imports: [
    CtaComponent,
    CommonModule,
    PrimeNgModule,
    BusinessFeaturesComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: 'index.page.html',
})
export default class DomainDetailsPage {
  monitorEnabled$ = this.featureService.isFeatureEnabled('domainMonitor');

  public domain: string = '';

  constructor(
    public domainUtils: DomainUtils,
    private featureService: FeatureService,
    private router: Router
  ) {}


  cleanDomain(domain: string): string {
    if (!domain) return '';
    return domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  }

  showResults() {
    this.domain = this.cleanDomain(this.domain);
    if (this.domain) {
      this.router.navigate(['/preview', this.domain]);
    }
    
  }
}
