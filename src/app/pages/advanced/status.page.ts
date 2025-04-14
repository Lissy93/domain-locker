import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ErrorHandlerService } from '~/app/services/error-handler.service'; 
import { DomainFaviconComponent } from '~/app/components/misc/favicon.component';
import { serviceLinks, type LinkItem } from '~/app/constants/admin-links';

interface StatusSummary {
  service: string;
  status: string;
  details: string;
  serviceMeta?: LinkItem;
}

interface StatusLog {
  service: string;
  date: string;
  details: string;
  link: string;
  severity: string;
  serviceMeta?: LinkItem;
}

interface StatusData {
  summary: StatusSummary[];
  history: StatusLog[];
  scheduled: StatusLog[];
}

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule, DomainFaviconComponent],
  templateUrl: './status.page.html',
})
export default class StatusPage {
  statusInfo$: Observable<StatusData>;

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
  ) {
    this.statusInfo$ = this.http.get<StatusData>('/api/status-info').pipe(
      map(data => {
        const enrich = <T extends { service: string }>(list: T[]): T[] =>
          list.map(item => ({
            ...item,
            serviceMeta: serviceLinks.find(link =>
              link.provider.toLowerCase() === item.service.toLowerCase()
            )
          }));
          
        return {
          summary: enrich(data.summary),
          history: enrich(data.history),
          scheduled: enrich(data.scheduled)
        };
      }),
      catchError(error => {
        this.errorHandler.handleError({
          error, message: 'Failed to load status data', location: 'status-info', showToast: true,
        });
        return of({ summary: [], history: [], scheduled: [] });
      })
    );
  }

  public getColor(severity: string, mode: 'color' | 'disc' = 'color'): string {
    switch (severity) {
      case '✅': return mode === 'disc' ? '🟢' : 'green';
      case 'ℹ️': return mode === 'disc' ? '🔵' : 'blue';
      case '⚠️': return mode === 'disc' ? '🟠' : 'orange';
      case '❌': return mode === 'disc' ? '🔴' : 'red';
      case '❔': return mode === 'disc' ? '⚪' : 'gray';
      default: return mode === 'disc' ? '🟡' : 'yellow';
    }
  }

}
