import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../prime-ng.module';
import DatabaseService from '@services/database.service';
import { DbDomain } from '@/types/Database';
import { DomainCollectionComponent } from '@components/domain-things/domain-collection/domain-collection.component';
import { LoadingComponent } from '@components/misc/loading.component';
import { ErrorHandlerService } from '@/app/services/error-handler.service';
import ts from 'typescript';

@Component({
  standalone: true,
  selector: 'domain-all-page',
  imports: [DomainCollectionComponent, PrimeNgModule, CommonModule, LoadingComponent],
  template: `
    <app-domain-view 
      *ngIf="!loading; else loadingTemplate" 
      [domains]="domains"
      ($triggerReload)="newDomainAdded()"
    />
    <ng-template #loadingTemplate>
      <loading loadingTitle="Loading" loadingDescription="Fetching domains from database" />
    </ng-template>
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
    this.databaseService.listDomains().subscribe({
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
