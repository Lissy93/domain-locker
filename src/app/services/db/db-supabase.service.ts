import { Injectable } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ErrorHandlerService } from '~/app/services/error-handler.service';
import { BaseDatabaseService } from '~/app/services/db/db-base.service';

@Injectable({
  providedIn: 'root',
})
export class SupabaseDatabaseService extends BaseDatabaseService  {

  constructor(private supabase: SupabaseClient, errorHandler: ErrorHandlerService) {
    super(errorHandler);
  }

  create(table: string, data: any): Observable<any> {
    return from(this.supabase.from(table).insert(data).single()).pipe(map(({ data }) => data));
  }

  createBatch(table: string, data: any[]): Observable<void> {
    return from(this.supabase.from(table).insert(data)).pipe(map(() => void 0));
  }

  readAll(table: string): Observable<any[]> {
    return from(this.supabase.from(table).select()).pipe(map(({ data }) => data || []));
  }

  update(table: string, data: any, condition: Record<string, any>): Observable<void> {
    return from(this.supabase.from(table).update(data).match(condition)).pipe(map(() => void 0));
  }

  updateBatch(table: string, data: any[], keys: string[]): Observable<void> {
    const updates = data.map((item) =>
      this.supabase.from(table).upsert(item, { onConflict: keys.join(',') })
    );
    return from(Promise.all(updates)).pipe(map(() => void 0));
  }

  delete(table: string, id: string): Observable<void> {
    return from(this.supabase.from(table).delete().eq('id', id)).pipe(map(() => void 0));
  }

  queryWithCount(
    table: string,
    query: { select: string; where?: Record<string, any>; orderBy?: Record<string, string>; limit?: number; offset?: number }
  ): Observable<{ data: any[]; count: number }> {
    let qb = this.supabase.from(table).select(query.select, { count: 'exact' });

    if (query.where) {
      Object.entries(query.where).forEach(([key, value]) => {
        qb = qb.eq(key, value);
      });
    }

    if (query.orderBy) {
      Object.entries(query.orderBy).forEach(([key, direction]) => {
        qb = qb.order(key, { ascending: direction === 'asc' });
      });
    }

    if (query.limit) {
      qb = qb.limit(query.limit);
    }

    if (query.offset) {
      qb = qb.range(query.offset, query.offset + (query.limit || 0));
    }

    return from(qb).pipe(map(({ data, count }) => ({ data: data || [], count: count || 0 })));
  }

  count(table: string, condition: Record<string, any>): Observable<number> {
    let qb = this.supabase.from(table).select('id', { count: 'exact', head: true });

    Object.entries(condition).forEach(([key, value]) => {
      qb = qb.eq(key, value);
    });

    return from(qb).pipe(map(({ count }) => count || 0));
  }

  updateAll(table: string, data: Record<string, any>): Observable<void> {
    return from(this.supabase.from(table).update(data)).pipe(map(() => void 0));
  }
}
