import { catchError, from, map, Observable, of } from 'rxjs';
import { PgApiUtilService } from '~/app/utils/pg-api.util';

export class HistoryQueries {
  constructor(
    private pgApiUtil: PgApiUtilService,
    private handleError: (error: any) => Observable<never>,
  ) {}

  getChangeHistory(domainName?: string, days: number = 7): Observable<any[]> {
    const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const query = domainName
      ? `SELECT change_type, date FROM domain_updates 
         INNER JOIN domains ON domain_updates.domain_id = domains.id 
         WHERE domains.domain_name = $1 AND date >= $2`
      : `SELECT change_type, date FROM domain_updates WHERE date >= $1`;

    const params = domainName ? [domainName, daysAgo] : [daysAgo];

    return this.pgApiUtil.postToPgExecutor(query, params).pipe(
      map((response) => {
        const data = response.data as { date: string; change_type: string }[];

        const historyMap: Record<string, { added: number; removed: number; updated: number }> = {};
        data.forEach((entry: { date: string; change_type: string }) => {
          const date = new Date(entry.date).toISOString().split('T')[0]; // Extract day
          if (!historyMap[date]) {
            historyMap[date] = { added: 0, removed: 0, updated: 0 };
          }
          if (entry.change_type === 'added') {
            historyMap[date].added += 1;
          } else if (entry.change_type === 'removed') {
            historyMap[date].removed += 1;
          } else {
            historyMap[date].updated += 1;
          }
        });

        return Object.entries(historyMap).map(([date, counts]) => ({
          date,
          ...counts,
        }));
      }),
      catchError((error) => {
        this.handleError(error);
        return of([]);
      })
    );
  }

  getTotalUpdateCount(domainName?: string): Observable<number> {
    const query = domainName
      ? `SELECT COUNT(*) AS count FROM domain_updates 
         INNER JOIN domains ON domain_updates.domain_id = domains.id 
         WHERE domains.domain_name = $1`
      : `SELECT COUNT(*) AS count FROM domain_updates`;

    const params = domainName ? [domainName] : [];

    return this.pgApiUtil.postToPgExecutor(query, params).pipe(
      map((response) => (response.data[0] as { count: number })?.count || 0),
      catchError((error) => {
        this.handleError(error);
        return of(0);
      })
    );
  }

  getDomainUpdates(
    domainName?: string,
    start: number = 0,
    end: number = 24,
    category?: string,
    changeType?: string,
    filterDomain?: string
  ): Observable<any[]> {
    let query = `SELECT domain_updates.*, domains.domain_name 
                 FROM domain_updates 
                 INNER JOIN domains ON domain_updates.domain_id = domains.id 
                 WHERE 1=1`;

    const params: any[] = [];

    if (domainName) {
      query += ` AND domains.domain_name = $${params.length + 1}`;
      params.push(domainName);
    }

    if (category) {
      query += ` AND domain_updates.change = $${params.length + 1}`;
      params.push(category);
    }

    if (changeType) {
      query += ` AND domain_updates.change_type = $${params.length + 1}`;
      params.push(changeType);
    }

    if (filterDomain) {
      query += ` AND domains.domain_name ILIKE $${params.length + 1}`;
      params.push(`%${filterDomain}%`);
    }

    query += ` ORDER BY domain_updates.date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(end - start, start);

    return this.pgApiUtil.postToPgExecutor(query, params).pipe(
      map((response) => response.data),
      catchError((error) => {
        this.handleError(error);
        return of([]);
      })
    );
  }
}
