// src/app/shared/domain.service.ts
import { DbDomain } from '~/app/../types/Database';
import { Injectable } from '@angular/core';
import { makeEppArrayFromLabels } from '~/app/constants/security-categories';

@Injectable({
  providedIn: 'root'
})
export class DomainUtils {
  constructor() {}

  extractTags(data: any): string[] {
    if (Array.isArray(data.domain_tags)) {
      // Handle the case for /domains page
      return data.domain_tags
        .filter((tagItem: any) => tagItem.tags && tagItem.tags.name)
        .map((tagItem: any) => tagItem.tags.name);
    } else if (data.tags) {
      // Handle the case for /assets/tags/[tag-name] page
      return [data.tags];
    }
    return [];
  }

  formatDomainData(data: any): DbDomain {
    return {
      ...data,
      tags: this.extractTags(data),
      ssl: (data.ssl_certificates && data.ssl_certificates.length) ? data.ssl_certificates[0] : null,
      whois: data.whois_info,
      registrar: data.registrars,
      host: data.domain_hosts && data.domain_hosts.length > 0 ? data.domain_hosts[0].hosts : null,
      dns: {
        mxRecords: data.dns_records?.filter((record: any) => record.record_type === 'MX').map((record: any) => record.record_value) || [],
        txtRecords: data.dns_records?.filter((record: any) => record.record_type === 'TXT').map((record: any) => record.record_value) || [],
        nameServers: data.dns_records?.filter((record: any) => record.record_type === 'NS').map((record: any) => record.record_value) || []
      },
      statuses: makeEppArrayFromLabels(data.domain_statuses?.map((status: any) => status.status_code) || []),
    };
  }

  /* For a given expiry date, return the number of days remaining */
  getDaysRemaining(expiryDate: Date): number {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const timeDiff = expiry.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /* Truncate long to 64 characters */
  truncateNotes(notes: string): string {
    return notes && notes.length > 64 ? notes.substring(0, 64) + '...' : notes || '';
  }

  /* Split a domain into domain and tld */
  splitDomain(domain: string): { domain: string, tld: string } {
    if (!domain) { return { domain: '', tld: '' } }
    if (domain.indexOf('.') === -1) { return { domain, tld: '' } }
    const parts = domain.split('.');
    return {
      domain: parts[0],
      tld: parts.slice(1).join('.')
    };
  }

  /* Returns text string for remaining time for a domain */
  getRemainingDaysText(expiryDate: Date): string {
    const daysRemaining = this.getDaysRemaining(expiryDate);
    if (daysRemaining < 1) {
      return 'Expired'
    }
    if (daysRemaining > 1080) {
      const months = Math.floor(daysRemaining / 30 / 12);
      return `${months} years`;
    }
    if (daysRemaining > 420) {
      const months = Math.floor(daysRemaining / 30);
      return `${months} months`;
    }
    return `${daysRemaining} days`;
  }

  /* Returns the severity level for the expiry date */
  getExpirySeverity(expiryDate: Date): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' {
    const daysRemaining = this.getDaysRemaining(expiryDate);
    if (daysRemaining > 90) {
      return 'success';
    } else if (daysRemaining > 30) {
      return 'warning';
    } else {
      return 'danger';
    }
  }
}
