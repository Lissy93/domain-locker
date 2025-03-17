import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PrimeNgModule } from '~/app/prime-ng.module';
import DatabaseService from '~/app/services/database.service';
import { SubdomainListComponent } from './subdomain-list.component';
import { ErrorHandlerService } from '~/app/services/error-handler.service';
import { DomainFaviconComponent } from '~/app/components/misc/favicon.component';
import { groupSubdomains } from './subdomain-utils';
import { LazyLoadDirective } from '~/app/utils/lazy.directive';

interface DomainGroup {
  name: string;
  subdomains: any[];
  loadingSubs: boolean;
}

@Component({
  standalone: true,
  selector: 'app-subdomains-index',
  imports: [CommonModule, RouterModule, PrimeNgModule, SubdomainListComponent, DomainFaviconComponent, LazyLoadDirective],
  templateUrl: './subdomains.page.html',
})
export default class SubdomainsIndexPageComponent implements OnInit {
  subdomains: { domain: string; subdomains: any[] }[] = [];
  loading: boolean = true;
  domains: DomainGroup[] = [];

  constructor(
    private databaseService: DatabaseService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnInit() {
    this.loadParentDomains();
  }

  loadParentDomains() {
    this.loading = true;
    this.databaseService.instance.listDomainNames().subscribe({
      next: (domains) => {
        this.domains = domains.map((domainName) => ({
          name: domainName,
          subdomains: [],
          loadingSubs: false,
        }));
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.handleError({ message: 'Failed to list parent domains', error });
        this.loading = false;
      },
    });
  }

  loadSubdomainsForDomain(domain: DomainGroup) {
    if (domain.subdomains?.length || domain.loadingSubs) {
      return;
    }
  
    domain.loadingSubs = true;
    this.databaseService.instance.subdomainsQueries.getSubdomainsByDomain(domain.name)
      .subscribe({
        next: (subs) => {
          domain.subdomains = subs;
          domain.loadingSubs = false;
        },
        error: (error) => {
          this.errorHandler.handleError({ error, message: `Unable to load subdomains for ${domain.name}`, showToast: true });
          domain.loadingSubs = false;
        },
      });
  }
  


  loadSubdomains() {
    this.loading = true;
    this.databaseService.instance.subdomainsQueries.getAllSubdomains().subscribe({
      next: (subdomains) => {
        this.subdomains = groupSubdomains(subdomains);
        this.loading = false;
      },
      error: (error) => {
        this.errorHandler.handleError({ error });
        this.loading = false;
      },
    });
  }
}
