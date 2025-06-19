import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { DbDomain } from '~/app/../types/Database';
import DatabaseService from '~/app/services/database.service';
import { DomainCollectionComponent } from '~/app/components/domain-things/domain-collection/domain-collection.component';
import { DomainFaviconComponent } from '~/app/components/misc/favicon.component';
import { ErrorHandlerService } from '~/app/services/error-handler.service';

@Component({
  standalone: true,
  selector: 'app-registrar-domains',
  imports: [CommonModule, PrimeNgModule, DomainCollectionComponent, DomainFaviconComponent],
  template: `
    <h1 class="flex gap-3 align-items-center">
      <app-domain-favicon *ngIf="registrarUrl" [domain]="registrarUrl" [size]="28" class=""></app-domain-favicon>
      {{ registrarName }}
    </h1>
    @if (registrarUrl && registrarUrl !== 'Unknown') {
      <p class="md:float-right">
        <a [href]="registrarUrl"><i class="pi pi-external-link mr-2 capitalize"></i> {{registrarName}} Website</a>
      </p>
    }
    <app-domain-view
      [domains]="domains"
      *ngIf="!loading"
      [preFilteredText]="'registered with '+registrarName+''"
      [showAddButton]="false"
    />
    <p-progressSpinner *ngIf="loading" />
  `,
})
export default class RegistrarDomainsPageComponent implements OnInit {
  registrarName: string = '';
  registrarUrl: string = '';
  domains: DbDomain[] = [];
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.registrarName = params['registrar'];
      this.loadDomains();
    });
  }

  loadDomains() {
    this.loading = true;
    this.databaseService.instance.registrarQueries.getDomainsByRegistrar(this.registrarName).subscribe({
      next: (domains) => {
        this.domains = domains;
        this.loading = false;
        if (domains.length > 0 && domains[0]?.registrar?.url) {
          this.registrarUrl = domains[0].registrar.url;
          if (this.registrarUrl === 'Unknown') {
            this.registrarUrl = '';
          } else if (!this.registrarUrl.startsWith('http')) {
            this.registrarUrl = 'https://' + this.registrarUrl;
          } 
        }
      },
      error: (error) => {
        this.errorHandler.handleError({
          message: 'Failed to load domains for this registrar',
          error,
          showToast: true,
          location: 'RegistrarIndexPage.loadDomains'
        });
        this.loading = false;
      }
    });
  }
}
