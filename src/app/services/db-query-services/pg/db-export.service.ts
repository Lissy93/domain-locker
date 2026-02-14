import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PgApiUtilService } from '~/app/utils/pg-api.util';

export class ExportQueries {
  constructor(
    private pgApiUtil: PgApiUtilService,
    private handleError: (error: any) => Observable<never>,
    private getCurrentUser: () => Promise<{ id: string } | null>
  ) {}

  fetchAllForExport(domainNames: string, includeFields: string[] | { label: string; value: string }[]): Observable<any[]> {
    return new Observable((observer) => {
      this.executeExport(domainNames, includeFields)
        .then((data) => {
          observer.next(data);
          observer.complete();
        })
        .catch((error) => observer.error(error));
    });
  }

  private async executeExport(domainNames: string, includeFields: string[] | { label: string; value: string }[]): Promise<any[]> {
    // Ensure includeFields is an array
    const fields = Array.isArray(includeFields) ? includeFields : [];

    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const userId = user.id;
    const domainFilter = domainNames.trim();

    const fieldMap: { [key: string]: string } = {
      domain_statuses: `
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object('status_code', domain_statuses.status_code))
          FILTER (WHERE domain_statuses.status_code IS NOT NULL), '[]'
        ) AS domain_statuses
      `,
      ip_addresses: `
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object('ip_address', ip_addresses.ip_address, 'is_ipv6', ip_addresses.is_ipv6))
          FILTER (WHERE ip_addresses.ip_address IS NOT NULL), '[]'
        ) AS ip_addresses
      `,
      whois_info: `
        jsonb_build_object(
          'name', whois_info.name,
          'organization', whois_info.organization,
          'country', whois_info.country,
          'street', whois_info.street,
          'city', whois_info.city,
          'state', whois_info.state,
          'postal_code', whois_info.postal_code
        ) AS whois_info
      `,
      domain_tags: `
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object('name', tags.name))
          FILTER (WHERE tags.name IS NOT NULL), '[]'
        ) AS tags
      `,
      ssl_certificates: `
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'issuer', ssl_certificates.issuer,
            'issuer_country', ssl_certificates.issuer_country,
            'subject', ssl_certificates.subject,
            'valid_from', ssl_certificates.valid_from,
            'valid_to', ssl_certificates.valid_to,
            'fingerprint', ssl_certificates.fingerprint,
            'key_size', ssl_certificates.key_size,
            'signature_algorithm', ssl_certificates.signature_algorithm
          ))
          FILTER (WHERE ssl_certificates.issuer IS NOT NULL), '[]'
        ) AS ssl_certificates
      `,
      notifications: `
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object('notification_type', notification_preferences.notification_type, 'is_enabled', notification_preferences.is_enabled))
          FILTER (WHERE notification_preferences.notification_type IS NOT NULL), '[]'
        ) AS notifications
      `,
      domain_hosts: `
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'ip', hosts.ip,
            'lat', hosts.lat,
            'lon', hosts.lon,
            'isp', hosts.isp,
            'org', hosts.org,
            'as_number', hosts.as_number,
            'city', hosts.city,
            'region', hosts.region,
            'country', hosts.country
          ))
          FILTER (WHERE hosts.ip IS NOT NULL), '[]'
        ) AS hosts
      `,
      dns_records: `
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object('record_type', dns_records.record_type, 'record_value', dns_records.record_value))
          FILTER (WHERE dns_records.record_type IS NOT NULL), '[]'
        ) AS dns_records
      `,
      domain_costings: `
        jsonb_build_object(
          'purchase_price', domain_costings.purchase_price,
          'current_value', domain_costings.current_value,
          'renewal_cost', domain_costings.renewal_cost,
          'auto_renew', domain_costings.auto_renew
        ) AS domain_costings
      `
    };

    const selectedRelations = fields
      .map(field => {
        // Handle both string values and objects with {label, value} structure
        const fieldValue = typeof field === 'string' ? field : field?.value;
        return fieldMap[fieldValue];
      })
      .filter(Boolean);

    // Always include registrar
    const registrarField = `
      jsonb_build_object(
        'name', registrars.name,
        'url', registrars.url
      ) AS registrar
    `;

    const selectQuery = selectedRelations.length > 0
      ? `domains.*, ${registrarField}, ${selectedRelations.join(', ')}`
      : `domains.*, ${registrarField}`;

    // Handle empty domain filter (export all) vs specific domains
    const whereClause = domainFilter
      ? 'WHERE domains.domain_name = ANY($1::text[]) AND domains.user_id = $2'
      : 'WHERE domains.user_id = $1';

    const params = domainFilter
      ? [domainFilter.split(',').map(d => d.trim()), userId]
      : [userId];

    const query = `
      SELECT ${selectQuery}
      FROM domains
      LEFT JOIN registrars ON domains.registrar_id = registrars.id
      LEFT JOIN domain_statuses ON domains.id = domain_statuses.domain_id
      LEFT JOIN ip_addresses ON domains.id = ip_addresses.domain_id
      LEFT JOIN whois_info ON domains.id = whois_info.domain_id
      LEFT JOIN domain_tags ON domains.id = domain_tags.domain_id
      LEFT JOIN tags ON domain_tags.tag_id = tags.id
      LEFT JOIN ssl_certificates ON domains.id = ssl_certificates.domain_id
      LEFT JOIN notification_preferences ON domains.id = notification_preferences.domain_id
      LEFT JOIN domain_hosts ON domains.id = domain_hosts.domain_id
      LEFT JOIN hosts ON domain_hosts.host_id = hosts.id
      LEFT JOIN dns_records ON domains.id = dns_records.domain_id
      LEFT JOIN domain_costings ON domains.id = domain_costings.domain_id
      ${whereClause}
      GROUP BY domains.id, registrars.id, whois_info.id, domain_costings.id
      LIMIT 10000
    `;

    const result = await this.pgApiUtil.postToPgExecutor<any[]>(query, params).toPromise();

    if (!result || !result.data) {
      return [];
    }

    return this.flattenData(result.data);
  }

  private flattenData(data: any[]): any[] {
    return data.map((domain: any) => ({
      ...domain,
      registrar_name: domain.registrar?.name || '',
      registrar_url: domain.registrar?.url || '',
      ip_addresses: Array.isArray(domain.ip_addresses)
        ? domain.ip_addresses.map((ip: any) => ip.ip_address).join(', ')
        : '',
      ssl_certificates: Array.isArray(domain.ssl_certificates)
        ? domain.ssl_certificates.map((cert: any) => cert.issuer).join(', ')
        : '',
      whois_name: domain.whois_info?.name || '',
      whois_organization: domain.whois_info?.organization || '',
      whois_country: domain.whois_info?.country || '',
      whois_street: domain.whois_info?.street || '',
      whois_city: domain.whois_info?.city || '',
      whois_state: domain.whois_info?.state || '',
      whois_postal_code: domain.whois_info?.postal_code || '',
      tags: Array.isArray(domain.tags)
        ? domain.tags.map((tag: any) => tag.name).join(', ')
        : '',
      hosts: Array.isArray(domain.hosts)
        ? domain.hosts.map((host: any) => host.isp).join(', ')
        : '',
      dns_records: Array.isArray(domain.dns_records)
        ? domain.dns_records.map((record: any) => `${record.record_type}: ${record.record_value}`).join('; ')
        : '',
      purchase_price: domain.domain_costings?.purchase_price || 0,
      current_value: domain.domain_costings?.current_value || 0,
      renewal_cost: domain.domain_costings?.renewal_cost || 0,
      auto_renew: domain.domain_costings?.auto_renew ? 'Yes' : 'No',
    }));
  }
}
