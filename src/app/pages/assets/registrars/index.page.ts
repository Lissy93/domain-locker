import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { Registrar } from '~/app/../types/common';
import DatabaseService from '~/app/services/database.service';
import { DomainFaviconComponent } from '~/app/components/misc/favicon.component';
import { ErrorHandlerService } from '~/app/services/error-handler.service';

@Component({
  standalone: true,
  selector: 'app-registrars-index',
  imports: [CommonModule, RouterModule, PrimeNgModule, DomainFaviconComponent],
  templateUrl: './index.page.html',
})
export default class RegistrarsIndexPageComponent implements OnInit {
  registrars: (Registrar & { domainCount: number })[] = [];
  loading: boolean = true;

  constructor(
    private databaseService: DatabaseService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnInit() {
    this.loadRegistrars();
  }

  loadRegistrars() {
    this.loading = true;
    this.databaseService.instance.registrarQueries.getRegistrars().subscribe({
      next: (registrars) => {
        this.registrars = registrars.map(registrar => ({ ...registrar, domainCount: 0 }));
        this.loadDomainCounts();
      },
      error: (error) => {
        this.errorHandler.handleError({
          message: 'Failed to load registrars',
          error,
          showToast: true,
          location: 'RegistrarsIndexPageComponent.loadRegistrars'
        });
        this.loading = false;
      }
    });
  }

  loadDomainCounts() {
    this.databaseService.instance.registrarQueries.getDomainCountsByRegistrar().subscribe({
      next: (counts) => {
        this.registrars = this.registrars.map(registrar => ({
          ...registrar,
          domainCount: counts[registrar.name] || 0
        }));
        this.loading = false;
        this.registrars = this.registrars.sort((a, b) => b.domainCount - a.domainCount);
      },
      error: (error) => {
        this.errorHandler.handleError({
          message: 'Unable to fetch domain counts',
          error,
          showToast: true,
          location: 'RegistrarsIndexPageComponent.loadDomainCounts'
        });
        this.loading = false;
      }
    });
  }

  public makePrettyUrl(domain: string): string {
    try {
      let sanitizedDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
      sanitizedDomain = sanitizedDomain.split('/')[0];
      return sanitizedDomain;
    } catch (e) {
      return domain;
    }
  }
}
