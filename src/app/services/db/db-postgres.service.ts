import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import pkg from 'pg';
import { catchError, map } from 'rxjs/operators';
import { ErrorHandlerService } from '~/app/services/error-handler.service';
import { EnvService } from '~/app/services/environment.service';
import { BaseDatabaseService } from '~/app/services/db/db-base.service';

const Pool = pkg.Pool;

@Injectable({
  providedIn: 'root',
})
export class PostgresDatabaseService extends BaseDatabaseService  {
  private pool: any;

  constructor(errorHandler: ErrorHandlerService, private envService: EnvService) {
    super(errorHandler);
    const postgresConfig = this.envService.getPostgresConfig();
    this.pool = new Pool(postgresConfig);
  }


  create(table: string, data: any): Observable<any> {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;

    return from(this.pool.query(query, values) as Promise<{ rows: any[] }>).pipe(map(({ rows }) => rows[0]));
  }

  createBatch(table: string, data: any[]): Observable<void> {
    if (!data.length) return from(Promise.resolve());

    const columns = Object.keys(data[0]).join(', ');
    const values = data.flatMap(Object.values);
    const placeholders = data
      .map((_, i) =>
        `(${Object.values(data[0])
          .map((_, j) => `$${i * Object.keys(data[0]).length + j + 1}`)
          .join(', ')})`
      )
      .join(', ');

    const query = `INSERT INTO ${table} (${columns}) VALUES ${placeholders}`;

    return from(this.pool.query(query, values)).pipe(map(() => void 0));
  }

  readAll(table: string): Observable<any[]> {
    const query = `SELECT * FROM ${table}`;
    return from(this.pool.query(query) as Promise<{ rows: any[] }>).pipe(map(({ rows }) => rows));
  }

  update(table: string, data: any, condition: Record<string, any>): Observable<void> {
    const setClause = Object.entries(data)
      .map(([key], i) => `${key} = $${i + 1}`)
      .join(', ');
    const whereClause = Object.entries(condition)
      .map(([key], i) => `${key} = $${i + Object.keys(data).length + 1}`)
      .join(' AND ');

    const values = [...Object.values(data), ...Object.values(condition)];
    const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;

    return from(this.pool.query(query, values)).pipe(map(() => void 0));
  }

  updateBatch(table: string, data: any[], keys: string[]): Observable<void> {
    // Implement update logic for batch updates
    return from(Promise.resolve()); // Stub for simplicity
  }

  delete(table: string, id: string): Observable<void> {
    const query = `DELETE FROM ${table} WHERE id = $1`;
    return from(this.pool.query(query, [id])).pipe(map(() => void 0));
  }

  queryWithCount(
    table: string,
    query: { select: string; where?: Record<string, any>; orderBy?: Record<string, string>; limit?: number; offset?: number }
  ): Observable<{ data: any[]; count: number }> {
    // Implement logic for query with count
    return from(Promise.resolve({ data: [], count: 0 })); // Stub for simplicity
  }

  count(table: string, condition: Record<string, any>): Observable<number> {
    // Implement count logic
    return from(Promise.resolve(0)); // Stub for simplicity
  }

  updateAll(table: string, data: Record<string, any>): Observable<void> {
    // Implement updateAll logic
    return from(Promise.resolve()); // Stub for simplicity
  }
}
