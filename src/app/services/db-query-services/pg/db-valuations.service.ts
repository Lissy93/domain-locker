import { catchError, from, map, Observable, of } from 'rxjs';
import { PgApiUtilService } from '~/app/utils/pg-api.util';

export class ValuationQueries {
  constructor(
    private pgApiUtil: PgApiUtilService,
    private handleError: (error: any) => Observable<never>,
  ) {}

  // Get all domains with costings info
  getDomainCostings(): Observable<any[]> {
    const query = `
      SELECT 
        dc.domain_id, 
        dc.purchase_price, 
        dc.current_value, 
        dc.renewal_cost, 
        dc.auto_renew, 
        d.domain_name, 
        d.expiry_date, 
        r.name AS registrar
      FROM domain_costings dc
      INNER JOIN domains d ON dc.domain_id = d.id
      LEFT JOIN registrars r ON d.registrar_id = r.id
    `;

    return from(this.pgApiUtil.postToPgExecutor(query)).pipe(
      map((response) => {
        const data = response.data;

        return data.map((item: any) => ({
          domain_id: item.domain_id,
          domain_name: item.domain_name,
          expiry_date: item.expiry_date,
          registrar: item.registrar,
          purchase_price: item.purchase_price,
          current_value: item.current_value,
          renewal_cost: item.renewal_cost,
          auto_renew: item.auto_renew
        }));
      }),
      catchError((error) => this.handleError(error))
    );
  }

  // Update costings for all edited domains
  updateDomainCostings(updates: any[]): Observable<void> {
    const query = `
      INSERT INTO domain_costings (domain_id, purchase_price, current_value, renewal_cost, auto_renew)
      VALUES ${updates.map((_, i) => `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`).join(', ')}
      ON CONFLICT (domain_id) DO UPDATE SET 
        purchase_price = EXCLUDED.purchase_price,
        current_value = EXCLUDED.current_value,
        renewal_cost = EXCLUDED.renewal_cost,
        auto_renew = EXCLUDED.auto_renew
    `;
  
    const params = updates.flatMap(update => [
      update.domain_id,
      update.purchase_price,
      update.current_value,
      update.renewal_cost,
      update.auto_renew
    ]);
  
    return from(this.pgApiUtil.postToPgExecutor(query, params)).pipe(
      map(() => void 0), // Return void after successful execution
      catchError((error) => {
        this.handleError(error);
        return of(void 0);
      })
    );
  }
  
}
