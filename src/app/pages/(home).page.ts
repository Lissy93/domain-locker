// src/app/pages/home.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../prime-ng.module';
import DatabaseService from '~/app/services/database.service';
import { SupabaseService } from '~/app/services/supabase.service';
import { DbDomain } from '~/app/../types/Database';
import { MessageService } from 'primeng/api';
import AssetListComponent from '~/app/components/misc/asset-list.component';
import { DomainExpirationBarComponent } from '~/app/components/charts/domain-expiration-bar/domain-expiration-bar.component';
import { DomainCollectionComponent } from '~/app/components/domain-things/domain-collection/domain-collection.component';
import { Subscription } from 'rxjs';
import { LoadingComponent } from '~/app/components/misc/loading.component';
import { WelcomeComponent } from '~/app/components/getting-started/welcome.component';
import { DomainPieChartsComponent } from '~/app/components/charts/domain-pie/domain-pie.component';
import { DomainTagCloudComponent } from '~/app/components/charts/tag-cloud/tag-cloud.component';
import { HostMapComponent } from '~/app/components/charts/host-map/host-map.component';
import { EppStatusChartComponent } from '~/app/components/charts/domain-epp-status/domain-epp-status.component';
import { DomainGanttChartComponent } from '~/app/components/charts/registration-lifespan/registration-lifespan.component';
import { TagGridComponent } from '~/app/components/tag-grid/tag-grid.component';
import { SponsorMessageComponent } from '~/app/components/sponsor-thanks/sponsor-thanks.component';
import { FeatureCarouselComponent } from '~/app/components/home-things/feature-carousel/feature-carousel.component';
import { FeaturesGridComponent } from '~/app/components/home-things/feature-grid/feature-grid.component';
import { PricingCardsComponent } from '~/app/components/home-things/pricing-cards/pricing-cards.component';
import { CtaComponent } from '~/app/components/home-things/cta/cta.component';
import { HeroComponent } from '~/app/components/home-things/hero/hero.component';
import { DemoComponent } from '~/app/components/home-things/demo/demo.component';
import { DemoWelcomeComponent } from '~/app/components/home-things/demo-welcome/demo.welcome.component';

import { TranslateModule } from '@ngx-translate/core';
import { ErrorHandlerService } from '~/app/services/error-handler.service';
import { EnvService } from '~/app/services/environment.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    PrimeNgModule,
    AssetListComponent,
    DomainCollectionComponent,
    DomainExpirationBarComponent,
    LoadingComponent,
    WelcomeComponent,
    DomainPieChartsComponent,
    HostMapComponent,
    EppStatusChartComponent,
    DomainTagCloudComponent,
    DomainGanttChartComponent,
    TagGridComponent,
    TranslateModule,
    SponsorMessageComponent,
    FeatureCarouselComponent,
    FeaturesGridComponent,
    PricingCardsComponent,
    CtaComponent,
    HeroComponent,
    DemoComponent,
    DemoWelcomeComponent,
  ],
  templateUrl: './home.page.html',
  styles: [`
  ::ng-deep .p-divider-content { border-radius: 4px; }
  ::ng-deep .gantt-domain-name { background: var(--surface-50) !important; }
  `],
})
export default class HomePageComponent implements OnInit {
  domains: DbDomain[] = [];
  loading: boolean = true;
  isAuthenticated: boolean = false;
  isDemoInstance: boolean = false;
  showInsights: boolean = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private databaseService: DatabaseService,
    private messageService: MessageService,
    public supabaseService: SupabaseService,
    private environmentService: EnvService,
    private errorHandlerService: ErrorHandlerService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.setAuthState();
    this.loadDomains();
    this.demoInstanceLoginRedirect();
  }

  setAuthState() {
    if (!this.environmentService.isSupabaseEnabled()) {
      this.isAuthenticated = true;
      console.log('Supabase is disabled, skipping auth check');
      return;
    }
    this.subscriptions.add(
      this.supabaseService.authState$.subscribe(isAuthenticated => {
        this.isAuthenticated = isAuthenticated;
      })
    );
  }

  loadDomains() {
    this.loading = true;
    this.databaseService.instance.listDomains().subscribe({
      next: (domains) => {
        this.domains = domains;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching domains:', error);
        this.loading = false;
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Couldn\'t fetch domains from database' 
        });
      }
    });
  }

  newDomainAdded(event: any) {
    console.log('New domain added:', event);
  }

  toggleInsights() {
    this.showInsights = !this.showInsights;
  }

  // If running demo instance, and user not authenticated, redirect to login page
  demoInstanceLoginRedirect() {
    if (this.environmentService.getEnvironmentType() === 'demo') {
      this.isDemoInstance = true;
      if (!this.isAuthenticated) {
        this.router.navigate(['/login']).then(() => {
          this.loading = false;
        });
      }
    }
  }
}
