import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import DatabaseService from '~/app/services/database.service';
import { NgIf, NgFor } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { PaginatorModule } from 'primeng/paginator';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CHANGE_CATEGORIES } from '~/app/constants/change-categories';
import { ErrorHandlerService } from '~/app/services/error-handler.service';

@Component({
  standalone: true,
  selector: 'app-domain-updates',
  templateUrl: './domain-updates.component.html',
  styleUrls: ['./domain-updates.component.scss'],
  imports: [NgIf, NgFor, PrimeNgModule, PaginatorModule, DropdownModule, InputTextModule, SelectButtonModule, CommonModule],
})
export class DomainUpdatesComponent implements OnInit {
  @Input() domainName?: string;
  public updates$: Observable<any[]> | undefined;
  public loading = true;
  public totalRecords: number = 0;
  public currentPage: number = 0;
  public showFilters = false;
  public changeCategories = CHANGE_CATEGORIES;

  public selectedCategory: string | undefined;

  public changeTypes = [
    { label: 'Added', value: 'added', icon: 'pi pi-plus' },
    { label: 'Updated', value: 'updated', icon: 'pi pi-pencil' },
    { label: 'Removed', value: 'removed', icon: 'pi pi-minus' },
  ];
  public selectedChangeType: string | undefined;

  public filterDomain: string | undefined;

  constructor(
    private databaseService: DatabaseService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.fetchTotalCount();
    this.fetchUpdates(this.currentPage);
  }

  private fetchUpdates(page: number) {
    this.loading = true;
    const limit = 25;
    const from = page * limit;
    const to = from + limit - 1;
    
    this.databaseService.instance.historyQueries
      .getDomainUpdates(this.domainName, from, to, this.selectedCategory, this.selectedChangeType, this.filterDomain)
      .subscribe({
        next: (updates) => {
          this.updates$ = of(updates);
          this.loading = false;
        },
        error: (error) => {
          this.errorHandler.handleError({
            error,
            message: 'Failed to fetch domain updates',
            location: 'DomainUpdatesComponent.fetchUpdates',
            showToast: true,
          });
          this.loading = false;
        }
      });
  }
  

  private fetchTotalCount() {
    this.databaseService.instance.historyQueries.getTotalUpdateCount(this.domainName).subscribe({
      next: (total) => {
        this.totalRecords = total;
      },
      error: (error) => {
        this.errorHandler.handleError({
          error,
          message: 'Failed to fetch total updates count',
          location: 'DomainUpdatesComponent.fetchTotalCount',
          showToast: true,
        });
      },
    });
  }

  onPageChange(event: any) {
    this.currentPage = event.page;
    this.fetchUpdates(this.currentPage);
  }

  applyFilters() {
    this.fetchUpdates(0);
  }

  clearFilters() {
    this.selectedCategory = undefined;
    this.selectedChangeType = undefined;
    this.filterDomain = undefined;
    this.fetchUpdates(0);
    this.showFilters = false;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  mapChangeKey(key: string): string {
    const category = CHANGE_CATEGORIES.find((cat) => cat.value === key);
    return category ? category.label : key;
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
}
