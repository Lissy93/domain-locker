import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EnvService } from '~/app/services/environment.service';

@Injectable({
  providedIn: 'root',
})
export class PgApiUtilService {
  private baseUrl: string = 'http://localhost:5173/api/pg-executer/';

  constructor(private http: HttpClient, envService: EnvService) {
    // Get the base API URL from the environment service
    // this.baseUrl = envService.getApiBaseUrl(); // Ensure this provides a full URL for server-side rendering
    // this.baseUrl = '/api/pg-executer/';
    // this.baseUrl = this.envService.getPostgresApiUrl();
  }

  /**
   * Posts a query to the Postgres executor API.
   * @param query The SQL query string.
   * @param params Optional array of query parameters.
   * @returns An Observable of the query result.
   */
  postToPgExecutor<T>(query: string, params?: any[]): Observable<{ data: T[] }> {
    return this.http.post<{ data: T[] }>(`${this.baseUrl}`, { query, params });
  }
}
