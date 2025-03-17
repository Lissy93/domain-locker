import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PrimeNgModule } from '~/app/prime-ng.module';
import DatabaseService from '~/app/services/database.service';
import { MessageService } from 'primeng/api';
import { LoadingComponent } from '~/app/components/misc/loading.component';
import { getByEppCode, type SecurityCategory, securityCategories } from '~/app/constants/security-categories';

@Component({
  standalone: true,
  selector: 'app-statuses-index',
  imports: [CommonModule, RouterModule, LoadingComponent, PrimeNgModule],
  templateUrl: './statuses.page.html',
  styleUrls: ['./statuses.page.scss'],
})
export default class StatusesIndexPageComponent implements OnInit {
  statuses: { eppCode: string; description: string; domainCount: number }[] = [];
  loading: boolean = true;
  detailedStatuses: { statusCount: number, statusInfo?: SecurityCategory }[] = [];
  public securityCategories: SecurityCategory[] = securityCategories

  constructor(
    private databaseService: DatabaseService,
    private messageService: MessageService,
  ) {}

  ngOnInit() {
    this.loadStatuses();
  }

  loadStatuses() {
    this.loading = true;
    this.databaseService.instance.getStatusesWithDomainCounts().subscribe({
      next: (statusesWithCounts) => {
        this.statuses = statusesWithCounts.sort((a, b) => b.domainCount - a.domainCount);
        this.detailedStatuses = this.statuses.map(status => {
          return { statusCount: status.domainCount, statusInfo: getByEppCode(status.eppCode) };
        });
        this.securityCategories = securityCategories.filter(cat => 
          this.statuses.every(status => status.eppCode !== cat.eppCode)
        );
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching statuses:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load statuses'
        });
        this.loading = false;
      }
    });
  }
}
