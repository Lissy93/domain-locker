import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import DatabaseService from '~/app/services/database.service';
import { MessageService } from 'primeng/api';
import { TabViewModule } from 'primeng/tabview';
import { Router } from '@angular/router';

interface DnsRecord {
  record_value: string;
  domains: string[];
}

interface DomainWithRecords {
  domain: string;
  records: string[];
}

@Component({
  standalone: true,
  selector: 'app-dns-records',
  imports: [CommonModule, PrimeNgModule, TabViewModule],
  templateUrl: './index.page.html',
  styleUrls: ['./index.page.scss'],
})
export default class DnsRecordsPageComponent implements OnInit {
  txtRecords: DnsRecord[] = [];
  nsRecords: DnsRecord[] = [];
  mxRecords: DnsRecord[] = [];
  txtDomains: DomainWithRecords[] = [];
  nsDomains: DomainWithRecords[] = [];
  mxDomains: DomainWithRecords[] = [];
  loadingTxt: boolean = true;
  loadingNs: boolean = true;
  loadingMx: boolean = true;

  constructor(
    private databaseService: DatabaseService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDnsRecords();
  }

  loadDnsRecords() {
    this.loadingTxt = this.loadingNs = this.loadingMx = true;

    this.databaseService.instance.dnsQueries.getDnsRecords('TXT').subscribe({
      next: (records) => {
        this.txtRecords = records;
        this.txtDomains = this.groupByDomain(records);
        this.loadingTxt = false;
      },
      error: () => this.handleError('TXT'),
    });

    this.databaseService.instance.dnsQueries.getDnsRecords('NS').subscribe({
      next: (records) => {
        this.nsRecords = records;
        this.nsDomains = this.groupByDomain(records);
        this.loadingNs = false;
      },
      error: () => this.handleError('NS'),
    });

    this.databaseService.instance.dnsQueries.getDnsRecords('MX').subscribe({
      next: (records) => {
        this.mxRecords = records;
        this.mxDomains = this.groupByDomain(records);
        this.loadingMx = false;
      },
      error: () => this.handleError('MX'),
    });
  }

  handleError(type: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: `Failed to load ${type} records`,
    });
    this.loadingTxt = this.loadingNs = this.loadingMx = false;
  }

  groupByDomain(records: DnsRecord[]): DomainWithRecords[] {
    return records.reduce((results: DomainWithRecords[], record) => {
      record.domains.forEach((domain) => {
        const existingDomain = results.find((result) => result.domain === domain);
        if (existingDomain) {
          existingDomain.records.push(record.record_value);
        } else {
          results.push({ domain, records: [record.record_value] });
        }
      });
      return results;
    }, []);
  }

  navigateToDomain(domain: string) {
    this.router.navigate([`/domains/${domain}`]);
  }
}
