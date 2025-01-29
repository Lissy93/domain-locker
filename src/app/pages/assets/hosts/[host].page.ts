import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { DbDomain } from '~/app/../types/Database';
import DatabaseService from '~/app/services/database.service';
import { MessageService } from 'primeng/api';
import { DomainCollectionComponent } from '~/app/components/domain-things/domain-collection/domain-collection.component';

@Component({
  standalone: true,
  selector: 'app-host-domains',
  imports: [CommonModule, PrimeNgModule, DomainCollectionComponent],
  template: `
    <h1>Domains hosted by "{{ hostIsp }}"</h1>
    <app-domain-view
    [domains]="domains"
    [preFilteredText]="'hosted with '+hostIsp+''"
    [showAddButton]="false"
    *ngIf="!loading" />
    <p-progressSpinner *ngIf="loading"></p-progressSpinner>
  `,
})
export default class HostDomainsPageComponent implements OnInit {
  hostIsp: string = '';
  domains: DbDomain[] = [];
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.hostIsp = params['host'];
      this.loadDomains();
    });
  }

  loadDomains() {
    this.loading = true;
    this.databaseService.instance.hostsQueries.getDomainsByHost(this.hostIsp).subscribe({
      next: (domains) => {
        this.domains = domains;
        this.loading = false;
      },
      error: (error) => {
        console.error(`Error fetching domains for host ${this.hostIsp}:`, error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load domains for this host'
        });
        this.loading = false;
      }
    });
  }
}
