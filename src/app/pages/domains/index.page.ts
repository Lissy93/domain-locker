import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../prime-ng.module';
import DatabaseService from '~/app/services/database.service';
import { DbDomain } from '~/app/../types/Database';
import { DomainCollectionComponent } from '~/app/components/domain-things/domain-collection/domain-collection.component';
import { LoadingComponent } from '~/app/components/misc/loading.component';
import { ErrorHandlerService } from '~/app/services/error-handler.service';
import { Subscription } from 'rxjs';

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
export default class DomainAllPageComponent implements OnInit, OnDestroy {
  domains: DbDomain[] = [];
  loading: boolean = true;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private databaseService: DatabaseService,
    private errorHandlerService: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadDomains();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  newDomainAdded() {
    this.loadDomains();
  }

  loadDomains() {
    this.loading = true;

    this.subscriptions.add(
      this.databaseService.instance.listDomains().subscribe({
        next: (domains) => {
          this.domains = domains;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.errorHandlerService.handleError({
            error,
            message: 'Couldn\'t fetch domains from database',
            showToast: true,
            location: 'DomainAllPageComponent.loadDomains',
          });
          this.loading = false;
          this.cdr.markForCheck();
        }
      })
    );
  }
}
