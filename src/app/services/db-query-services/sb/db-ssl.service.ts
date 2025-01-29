import { SupabaseClient, User } from '@supabase/supabase-js';
import { catchError, forkJoin, from, map, Observable, of } from 'rxjs';
import { DbDomain, SaveDomainData, Ssl } from '~/app/../types/Database';

export class SslQueries {
  constructor(
    private supabase: SupabaseClient,
    private handleError: (error: any) => Observable<never>,
    private getCurrentUser: () => Promise<User | null>,
    private getFullDomainQuery: () => string,
    private formatDomainData: (domain: any) => DbDomain,
  ) {}

  getSslIssuersWithDomainCounts(): Observable<{ issuer: string; domain_count: number }[]> {
    return from(this.supabase
      .rpc('get_ssl_issuers_with_domain_counts')
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as { issuer: string; domain_count: number }[];
      }),
      catchError(error => this.handleError(error))
    );
  }

  getDomainsBySslIssuer(issuer: string): Observable<DbDomain[]> {
    return from(this.supabase
      .from('domains')
      .select(this.getFullDomainQuery())
      .eq('ssl_certificates.issuer', issuer)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data.map(domain => this.formatDomainData(domain));
      }),
      catchError(error => this.handleError(error))
    );
  }


  async saveSslInfo(domainId: string, ssl: SaveDomainData['ssl']): Promise<void> {
    if (!ssl) return;

    const sslData = {
      domain_id: domainId,
      issuer: ssl.issuer,
      issuer_country: ssl.issuer_country,
      subject: ssl.subject,
      valid_from: new Date(ssl.valid_from),
      valid_to: new Date(ssl.valid_to),
      fingerprint: ssl.fingerprint,
      key_size: ssl.key_size,
      signature_algorithm: ssl.signature_algorithm
    };

    const { error } = await this.supabase
      .from('ssl_certificates')
      .insert(sslData);

    if (error) throw error;
  }

}
