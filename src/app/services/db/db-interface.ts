import { DbDomain, IpAddress, SaveDomainData, Registrar, Host } from '~/app/../types/Database';
import { Observable } from 'rxjs';
import { BaseDatabaseService } from '~/app/services/db/db-base.service';


export interface DatabaseService extends BaseDatabaseService {
  create(table: string, data: any): Observable<any>;
  createBatch(table: string, data: any[]): Observable<void>;
  readAll(table: string): Observable<any[]>;
  update(table: string, data: any, condition: Record<string, any>): Observable<void>;
  updateBatch(table: string, data: any[], keys: string[]): Observable<void>;
  delete(table: string, id: string): Observable<void>;
  queryWithCount(
    table: string,
    query: { select: string; where?: Record<string, any>; orderBy?: Record<string, string>; limit?: number; offset?: number }
  ): Observable<{ data: any[]; count: number }>;
  count(table: string, condition: Record<string, any>): Observable<number>;
  updateAll(table: string, data: Record<string, any>): Observable<void>;
}
