import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PrimeNgModule } from '../../prime-ng.module';
import { type DbDomain } from '~/app/../types/Database';
import { DomainUtils } from '~/app/services/domain-utils.service';
import { DomainFaviconComponent } from '~/app/components/misc/favicon.component';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DlIconComponent } from '~/app/components/misc/svg-icon.component';
import { LoadingComponent } from '~/app/components/misc/loading.component';
import { GlobalMessageService } from '~/app/services/messaging.service';
import { ErrorHandlerService } from '~/app/services/error-handler.service';
import { FeatureService } from '~/app/services/features.service';
import { AdditionalResourcesComponent } from '~/app/components/misc/external-links.component';
import { DomainInfoComponent } from '~/app/components/domain-things/domain-info/domain-info.component';
import { NotFoundComponent } from '~/app/components/misc/domain-not-found.component';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { makeEppArrayFromLabels } from '~/app/constants/security-categories';
import { CtaComponent } from '~/app/components/home-things/cta/cta.component';
import { FeatureNotEnabledComponent } from '~/app/components/misc/feature-not-enabled.component';


@Component({
  standalone: true,
  selector: 'app-domain-details',
  imports: [
    CommonModule,
    PrimeNgModule,
    DomainFaviconComponent,
    CtaComponent,
    DlIconComponent,
    LoadingComponent,
    AdditionalResourcesComponent,
    DomainInfoComponent,
    NotFoundComponent,
    FeatureNotEnabledComponent,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './[domain].page.html',
  // styleUrl: './domain-name.page.scss',
})
export default class DomainDetailsPage implements OnInit {
  domain: DbDomain | null = null;
  name: string | null = null;
  domainNotFound = false;
  loading = true;
  attempts = 0;
  enablePreviewDomain$ = this.featureService.isFeatureEnabled('enablePreviewDomain');

  constructor(
    private route: ActivatedRoute,
    public domainUtils: DomainUtils,
    private router: Router,
    private globalMessageService: GlobalMessageService,
    private errorHandler: ErrorHandlerService,
    private featureService: FeatureService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.name = params['domain'] ?? null;
      this.fetchDomainInfo();
    });
  }
  async fetchDomainInfo() {
    if (!this.name) return;
    try {
      const domainInfo = (await lastValueFrom(
        this.http.get<any>(`/api/domain-info-preview?domain=${this.name}`)
      ))?.domainInfo;
      this.ngZone.run(() => {
        if (domainInfo) {
          this.domain = this.formatDomainInfo(domainInfo);
          this.domainNotFound = false;
        } else {
          this.attempts++;
          if (this.attempts < 3) {
            this.fetchDomainInfo();
          }
          this.errorHandler.handleError({
            message: `Sorry, we weren\'t able to fetch info for "${this.name}"`,
            showToast: true,
          });
          this.domain = null;
          this.domainNotFound = true;
        }
        this.loading = false;
      });

    } catch (error) {
      this.domain = null;
      this.domainNotFound = true;
      this.loading = false;
      this.errorHandler.handleError({
        error,
        message: `Failed to fetch domain info for "${this.name}"`,
        showToast: true,
      });
    }
  }


  formatDomainInfo(domain: any): DbDomain {
    const now = new Date().toISOString();
    const domainName = domain.domainName || '';

    return  {
      id: '',
      user_id: '',
      domain_name: domainName,
      created_at: now,
      updated_at: now,
      notes: '',
      ip_addresses: [
        ...(domain.ip_addresses?.ipv4 || []).map((ip: string) => ({ ip_address: ip, is_ipv6: false })),
        ...(domain.ip_addresses?.ipv6 || []).map((ip: string) => ({ ip_address: ip, is_ipv6: true })),
      ],
      ssl: domain.ssl || undefined,
      whois: domain.whois || undefined,
      tags: [],
      host: domain.host
        ? {
            ...domain.host,
            asNumber: domain.host.as || '', // normalize `as` to `asNumber`
          }
        : undefined,
      registrar: domain.registrar || undefined,
      dns: {
        dnssec: domain.dns?.dnssec || 'unknown',
        nameServers: domain.dns?.nameServers || [],
        mxRecords: domain.dns?.mxRecords || [],
        txtRecords: domain.dns?.txtRecords || [],
      },
      statuses: makeEppArrayFromLabels(domain.status || []),
      domain_costings: undefined,
      notification_preferences: [],
      sub_domains: [],
      domain_links: [],
      expiry_date: domain.dates?.expiry_date ? new Date(domain.dates.expiry_date) : new Date(),
      registration_date: domain.dates?.creation_date ? new Date(domain.dates.creation_date) : undefined,
      updated_date: domain.dates?.updated_date ? new Date(domain.dates.updated_date) : undefined,
    };
  }

}
