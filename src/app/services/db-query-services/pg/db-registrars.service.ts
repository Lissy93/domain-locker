import { catchError, from, map, Observable, of } from 'rxjs';
import { PgApiUtilService } from '~/app/utils/pg-api.util';
import { DbDomain, Registrar } from '~/app/../types/Database';

export class RegistrarQueries {
  constructor(
    private pgApiUtil: PgApiUtilService,
    private handleError: (error: any) => Observable<never>,
    private formatDomainData: (data: any) => DbDomain
  ) {}

  // Get all registrars
  getRegistrars(): Observable<Registrar[]> {
    const query = 'SELECT * FROM registrars';

    return from(this.pgApiUtil.postToPgExecutor<Registrar>(query)).pipe(
      map((response) => response.data),
      catchError((error) => this.handleError(error))
    );
  }

  // Get or insert a registrar by name
  async getOrInsertRegistrarId(registrarName: string): Promise<string> {
    const selectQuery = 'SELECT id FROM registrars WHERE name = $1 LIMIT 1';
    const insertQuery = 'INSERT INTO registrars (name) VALUES ($1) RETURNING id';

    try {
      const selectResponse = await this.pgApiUtil.postToPgExecutor<{ id: string }>(selectQuery, [registrarName]).toPromise();
      if (selectResponse && selectResponse.data.length > 0) {
        return selectResponse.data[0].id;
      }

      const insertResponse = await this.pgApiUtil.postToPgExecutor<{ id: string }>(insertQuery, [registrarName]).toPromise();
      if (insertResponse && insertResponse.data.length > 0) {
        return insertResponse.data[0].id;
      }
      throw new Error('Failed to insert registrar');
    } catch (error) {
      throw error;
    }
  }

  // Get domain counts by registrar
  getDomainCountsByRegistrar(): Observable<Record<string, number>> {
    const query = `
      SELECT r.name AS registrar_name, COUNT(d.id) AS domain_count
      FROM domains d
      INNER JOIN registrars r ON d.registrar_id = r.id
      GROUP BY r.name
    `;

    return from(this.pgApiUtil.postToPgExecutor<{ registrar_name: string; domain_count: number }>(query)).pipe(
      map((response) => {
        const counts: Record<string, number> = {};
        response.data.forEach((item) => {
          counts[item.registrar_name] = item.domain_count;
        });
        return counts;
      }),
      catchError((error) => this.handleError(error))
    );
  }

  // Get domains by registrar name
  getDomainsByRegistrar(registrarName: string): Observable<DbDomain[]> {
    const query = `
      SELECT d.*, 
             r.name AS registrar_name, 
             r.url AS registrar_url, 
             da.ip_address, 
             da.is_ipv6, 
             sc.issuer, 
             sc.issuer_country, 
             sc.subject, 
             sc.valid_from, 
             sc.valid_to, 
             sc.fingerprint, 
             sc.key_size, 
             sc.signature_algorithm, 
             wi.name AS whois_name, 
             wi.organization, 
             wi.country, 
             wi.street, 
             wi.city, 
             wi.state, 
             wi.postal_code, 
             dh.host_id, 
             dr.record_type, 
             dr.record_value, 
             dt.tag_name
      FROM domains d
      INNER JOIN registrars r ON d.registrar_id = r.id
      LEFT JOIN domain_addresses da ON d.id = da.domain_id
      LEFT JOIN ssl_certificates sc ON d.id = sc.domain_id
      LEFT JOIN whois_info wi ON d.id = wi.domain_id
      LEFT JOIN domain_hosts dh ON d.id = dh.domain_id
      LEFT JOIN dns_records dr ON d.id = dr.domain_id
      LEFT JOIN domain_tags dt ON d.id = dt.domain_id
      WHERE r.name = $1
    `;

    return from(this.pgApiUtil.postToPgExecutor(query, [registrarName])).pipe(
      map((response) => response.data.map(this.formatDomainData)),
      catchError((error) => this.handleError(error))
    );
  }

  // Save registrar for a domain
  async saveRegistrar(domainId: string, registrar: Omit<Registrar, 'id'>): Promise<void> {
    if (!registrar?.name) return;

    try {
      const registrarId = await this.getOrInsertRegistrarId(registrar.name);

      const updateQuery = 'UPDATE domains SET registrar_id = $1 WHERE id = $2';
      await this.pgApiUtil.postToPgExecutor(updateQuery, [registrarId, domainId]).toPromise();
    } catch (error) {
      throw error;
    }
  }
}
