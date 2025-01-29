import { Observable, throwError } from 'rxjs';
import { DatabaseService } from './db-interface';
import { ErrorHandlerService } from '~/app/services/error-handler.service';

export abstract class BaseDatabaseService implements DatabaseService {
  constructor(protected errorHandler: ErrorHandlerService) {}

  abstract create(table: string, data: any): Observable<any>;
  abstract createBatch(table: string, data: any[]): Observable<void>;
  abstract readAll(table: string): Observable<any[]>;
  abstract update(table: string, data: any, condition: Record<string, any>): Observable<void>;
  abstract updateBatch(table: string, data: any[], keys: string[]): Observable<void>;
  abstract delete(table: string, id: string): Observable<void>;
  abstract queryWithCount(
    table: string,
    query: {
      select: string;
      where?: Record<string, any>;
      orderBy?: Record<string, string>;
      limit?: number;
      offset?: number;
    }
  ): Observable<{ data: any[]; count: number }>;
  abstract count(table: string, condition: Record<string, any>): Observable<number>;
  abstract updateAll(table: string, data: Record<string, any>): Observable<void>;

  // Error handling
  protected handleError<T>(error: any): Observable<T> {
    this.errorHandler.handleError({ error });
    return throwError(() => new Error(error.message || 'Database error occurred'));
  }
}
