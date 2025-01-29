import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import DatabaseService from '~/app/services/database.service';
import savePkg from 'file-saver';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-export-page',
  templateUrl: './export.page.html',
  imports: [PrimeNgModule, ReactiveFormsModule],
})
export default class ExportPageComponent implements OnInit { exportForm: FormGroup;
  loading: boolean = false;
  availableFields: any[] = [
    { label: 'Domain Statuses', value: 'domain_statuses' },
    { label: 'IP Addresses', value: 'ip_addresses' },
    { label: 'WHOIS Info', value: 'whois_info' },
    { label: 'Tags', value: 'domain_tags' },
    { label: 'Hosts', value: 'domain_hosts' },
    { label: 'SSL Certificates', value: 'ssl_certificates' },
    { label: 'Notifications', value: 'notifications' },
    { label: 'DNS Records', value: 'dns_records' },
    { label: 'Costings', value: 'domain_costings' },
  ];

  constructor(
    private fb: FormBuilder,
    private databaseService: DatabaseService,
    private messageService: MessageService,
  ) {
    this.exportForm = this.fb.group({
      domains: [''],
      format: ['csv'],
      fields: [[]],
    });
  }

  ngOnInit(): void {}

  exportData() {
    this.loading = true;
    const { domains, fields, format } = this.exportForm.value;

    // Fetch data based on user selections
    this.databaseService.instance.fetchAllForExport(domains, fields).subscribe({
      next: (data) => {
        this.downloadFile(data, format);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Data exported successfully.',
        });
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to export data.',
        });
        this.loading = false;
      },
    });
  }

  private downloadFile(data: any[], format: string) {
    let blob: Blob;
    if (format === 'csv') {
      const csvData = this.convertToCSV(data);
      blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    } else if (format === 'json') {
      const jsonData = JSON.stringify(data, null, 2);
      blob = new Blob([jsonData], { type: 'application/json' });
    } else {
      const txtData = JSON.stringify(data, null, 2);
      blob = new Blob([txtData], { type: 'text/plain;charset=utf-8;' });
    }
    savePkg.saveAs(blob, `domain-data.${format}`);
  }

  private convertToCSV(data: any[]): string {
    if (!data.length) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) => Object.values(row).join(','));
    return `${headers}\n${rows.join('\n')}`;
  }
}
