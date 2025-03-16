import { SupabaseClient } from '@supabase/supabase-js';
import { catchError, from, map, Observable, of } from 'rxjs';

export class HistoryQueries {
  constructor(
    private supabase: SupabaseClient,
    private handleError: (error: any) => Observable<never>,
  ) {}


  getChangeHistory(domainName?: string, days: number = 7): Observable<any[]> {
    let query = this.supabase
      .from('domain_updates')
      .select('change_type, date')
      .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());
  
    if (domainName) {
      query = query.eq('domains.domain_name', domainName);
    }
  
    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          this.handleError(error);
          throw error;
        }
  
        // Process data to group by date and change_type
        const historyMap: Record<string, { added: number, removed: number, updated: number }> = {};
  
        data.forEach((entry: { date: string, change_type: string }) => {
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
        this.handleError({
          message: 'Error fetching change history',
          error,
          location: 'HistoryQueries.getChangeHistory',
        });
        return of([]);
      })
    );
  }

  getTotalUpdateCount(domainName?: string): Observable<number> {
    let query = this.supabase
      .from('domain_updates')
      .select('id', { count: 'exact' });
  
    // if (domainName) {
    //   query = this.supabase
    //     .from('domain_updates')
    //     .select('id, domains!inner(domain_name)', { count: 'exact' })
    //     .eq('domains.domain_name', domainName);
    // }
  
    return from(query.then(({ count, error }: { count: number | null; error: any }) => {
      if (error) throw error;
      return count || 0;
    })).pipe(
      catchError(error => {
        this.handleError({
          message: 'Error fetching total update count',
          error,
          location: 'HistoryQueries.getTotalUpdateCount',
        });
        return of(0);
      })
    );
  }

    
  getDomainUpdates(domainName?: string, start: number = 0, end: number = 24, category?: string, changeType?: string, filterDomain?: string): Observable<any[]> {
    let query = this.supabase
      .from('domain_updates')
      .select(`
        *,
        domains!inner(domain_name)
      `)
      .order('date', { ascending: false })
      .range(start, end);
  
    if (domainName) {
      query = query.eq('domains.domain_name', domainName);
    }
    if (category) {
      query = query.eq('change', category);
    }
    if (changeType) {
      query = query.eq('change_type', changeType);
    }
    if (filterDomain) {
      query = query.ilike('domains.domain_name', `%${filterDomain}%`);
    }
  
    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
      catchError((error) => {
        this.handleError({
          error, message: 'Error fetching domain updates', location: 'HistoryQueries.getDomainUpdates',
        });
        return of([]);
      })
    );
  }

}
