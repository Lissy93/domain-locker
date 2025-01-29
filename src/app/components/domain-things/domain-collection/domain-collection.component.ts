import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import Fuse from 'fuse.js';
import { DomainCardComponent } from '~/app/components/domain-things/domain-card/domain-card.component';
import { DomainListComponent } from '~/app/components/domain-things/domain-list/domain-list.component';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { DbDomain } from '~/app/../types/Database';
import { FieldVisibilityFilterComponent, type FieldOption } from '~/app/components/domain-things/domain-filters/domain-filters.component';

@Component({
  selector: 'app-domain-view',
  standalone: true,
  imports: [DomainCardComponent, DomainListComponent, PrimeNgModule, CommonModule, FieldVisibilityFilterComponent],
  templateUrl: './domain-collection.component.html',
})
export class DomainCollectionComponent implements OnInit {
  @Input() domains: DbDomain[] = [];
  @Input() showAddButton: boolean = true;
  @Input() showFooter: boolean = true;
  @Input() preFilteredText: string | undefined;
  
  @Input() triggerReload: () => void = () => {};
  @Output() $triggerReload = new EventEmitter();

  @ViewChild(FieldVisibilityFilterComponent)
  filtersComp!: FieldVisibilityFilterComponent;

  filteredDomains: DbDomain[] = [];
  loading: boolean = false;
  isGridLayout: boolean = true;
  visibleFields: FieldOption[] = [];
  searchTerm: string = '';
  sortOrder: string = 'date';
  private fuse!: Fuse<DbDomain>;

  allColumns = [
    { field: 'domain_name', header: 'Domain', width: 200 },
    { field: 'registrar', header: 'Registrar', width: 150 },
    { field: 'expiry_date', header: 'Expiry', width: 120 },
    { field: 'tags', header: 'Tags', width: 150 },
    { field: 'notes', header: 'Notes', width: 200 },
    { field: 'statuses', header: 'Security Statuses', width: 150 },
    { field: 'ip_addresses', header: 'IP Addresses', width: 150 },
    { field: 'renewal_cost', header: 'Renewal Cost', width: 150 },
    { field: 'ssl', header: 'SSL', width: 200 },
    { field: 'whois', header: 'WHOIS', width: 200 },
    { field: 'host', header: 'Host Info', width: 200 },
    { field: 'dns', header: 'DNS Records', width: 200 },
    { field: 'sub_domains', header: 'Sub-Domains', width: 200 },
  ];

  visibleColumns: any[] = [];

  ngOnInit() {
    this.filteredDomains = this.domains;
    this.sortDomains();
    this.initializeFuse();
  }

  onVisibilityChange(selectedFields: FieldOption[]) {
    this.visibleFields = selectedFields;
    this.updateVisibleColumns();
  }

  onSortChange(sortOption: FieldOption) {
    this.sortOrder = sortOption.value;
    this.sortDomains();
  }

  updateVisibleColumns() {
    const domainNameField = { value: 'domainName', label: 'Domain Name' };
    const fieldsToShow = this.visibleFields.some(f => f.value === 'domainName') 
      ? this.visibleFields 
      : [domainNameField, ...this.visibleFields];

    this.visibleColumns = this.allColumns.filter(column => 
      fieldsToShow.some(field => this.mapFieldToColumn(field.value) === column.field)
    );

    this.visibleColumns.sort((a, b) => 
      a.field === 'domain_name' ? -1 : b.field === 'domain_name' ? 1 : 0
    );
  }

  sortDomains() {
    switch (this.sortOrder) {
      case 'alphabetical':
        this.filteredDomains.sort((a, b) => a.domain_name.localeCompare(b.domain_name));
        break;
      case 'expiryDate':
        this.filteredDomains.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
        break;
      case 'date':
      default:
        this.filteredDomains = [...this.domains];
        break;
    }
  }

  mapFieldToColumn(fieldValue: string): string {
    const fieldToColumnMap: { [key: string]: string } = {
      'domainName': 'domain_name',
      'registrar': 'registrar',
      'expiryDate': 'expiry_date',
      'tags': 'tags',
      'notes': 'notes',
      'ipAddresses': 'ip_addresses',
      'renewalCost': 'renewal_cost',
      'sslCertificate': 'ssl',
      'whoisRecord': 'whois',
      'hostInfo': 'host',
      'dnsRecords': 'dns',
      'subDomains': 'sub_domains',
    };
    return fieldToColumnMap[fieldValue] || fieldValue;
  }

  onSearchChange(searchTerm: string) {
    this.searchTerm = searchTerm.toLowerCase();
    this.filterDomains();
  }

  onLayoutChange(isGrid: boolean) {
    this.isGridLayout = isGrid;
  }

  reloadDomains(event: any) {
    this.$triggerReload.emit(event);
  }

  initializeFuse() {
    const options = {
      keys: ['domain_name', 'registrar.name', 'tags', 'notes', 'ip_addresses.ip_address'],
      threshold: 0.3
    };
    this.fuse = new Fuse(this.domains, options);
  }

  filterDomains() {
    if (!this.searchTerm) {
      this.filteredDomains = this.domains;
      return;
    }
    const searchResults = this.fuse.search(this.searchTerm);
    this.filteredDomains = searchResults.map(result => result.item);
    if (this.filteredDomains.length === 0) {
      this.filteredDomains = this.domains.filter(domain => 
        this.domainMatchesSearch(domain, this.searchTerm.toLowerCase())
      );
    }
  }

  domainMatchesSearch(domain: DbDomain, searchTerm: string): boolean {
    return domain.domain_name.toLowerCase().includes(searchTerm) ||
      domain.registrar?.name.toLowerCase().includes(searchTerm) ||
      domain.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
      domain.notes?.toLowerCase().includes(searchTerm) ||
      domain.ip_addresses?.some(ip => ip.ip_address.includes(searchTerm)) ||
      false;
  }

  resetFilters() {
    this.searchTerm = '';
    this.filtersComp.initializeSelectedFields();
    this.filteredDomains = this.domains;
    this.sortOrder = 'date';
    this.sortDomains();
  }
}
