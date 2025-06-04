import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../prime-ng.module';
import DatabaseService from '~/app/services/database.service';
import { DbDomain } from '~/app/../types/Database';
import { DomainCollectionComponent } from '~/app/components/domain-things/domain-collection/domain-collection.component';
import { LoadingComponent } from '~/app/components/misc/loading.component';
import { ErrorHandlerService } from '~/app/services/error-handler.service';

@Component({
  standalone: true,
  selector: 'domain-all-page',
  imports: [DomainCollectionComponent, PrimeNgModule, CommonModule, LoadingComponent],
  template: `
    <app-domain-view 
      *ngIf="!loading"
      [loading]="loading"
      [domains]="domains"
      ($triggerReload)="newDomainAdded()"
    />
  `,
})
export default class DomainAllPageComponent implements OnInit {
  domains: DbDomain[] = [];
  loading: boolean = true;

  constructor(
    private databaseService: DatabaseService,
    private errorHandlerService: ErrorHandlerService,
  ) {}

  ngOnInit() {
    this.loadDomains();
  }

  newDomainAdded() {
    this.loadDomains();
  }

  loadDomains() {
    this.loading = true;
    this.databaseService.instance.listDomains().subscribe({
      next: (domains) => {
        this.domains = domains;
        this.loading = false;
      },
      error: (error) => {
        this.errorHandlerService.handleError({
          error,
          message: 'Couldn\'t fetch domains from database',
          showToast: true,
          location: 'domains',
        });
        this.loading = false;
      }
    });
  }
}
