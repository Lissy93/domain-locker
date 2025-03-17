import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PrimeNgModule } from '~/app/prime-ng.module';
import DatabaseService from '~/app/services/database.service';
import { MessageService } from 'primeng/api';

interface SslIssuer {
  issuer: string;
  domainCount: number;
}

@Component({
  standalone: true,
  selector: 'app-ssl-issuers-index',
  imports: [CommonModule, RouterModule, PrimeNgModule],
  template: `
    <h1 class="mt-2 mb-4">SSL Certificate Issuers</h1>
    <p-table [value]="sslIssuers" [loading]="loading" styleClass="p-datatable-striped">
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="issuer">Issuer <p-sortIcon field="issuer"></p-sortIcon></th>
          <th pSortableColumn="domainCount">Domain Count <p-sortIcon field="domainCount"></p-sortIcon></th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-issuer>
        <tr>
          <td><a [routerLink]="['/assets/certs', issuer.issuer]" class="text-primary">{{ issuer.issuer }}</a></td>
          <td>{{ issuer.domain_count }}</td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export default class SslIssuersIndexPageComponent implements OnInit {
  sslIssuers: SslIssuer[] = [];
  loading: boolean = true;

  constructor(
    private databaseService: DatabaseService,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadSslIssuers();
  }

  loadSslIssuers() {
    this.loading = true;
    this.databaseService.instance.sslQueries.getSslIssuersWithDomainCounts().subscribe({
      next: (issuers) => {
        this.sslIssuers = issuers.map(issuer => ({
          issuer: issuer.issuer,
          domainCount: issuer.domain_count
        })).sort((a, b) => b.domainCount - a.domainCount);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching SSL issuers:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load SSL issuers'
        });
        this.loading = false;
      }
    });
  }
}
