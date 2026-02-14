import { SupabaseClient } from '@supabase/supabase-js';
import { catchError, from, map, Observable } from 'rxjs';

export class ValuationQueries {
  constructor(
    private supabase: SupabaseClient,
    private handleError: (error: any) => Observable<never>,
  ) {}

   // Get all domains with costings info
   getDomainCostings(): Observable<any[]> {
    return from(this.supabase
      .from('domain_costings')
      .select(`
        domain_id, 
        purchase_price, 
        current_value, 
        renewal_cost, 
        auto_renew, 
        domains (
          domain_name, 
          expiry_date, 
          registrar_id, 
          registrars (name)
        )
      `)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
  
        return data.map((item: any) => ({
          domain_id: item.domain_id,
          domain_name: item.domains?.domain_name,
          expiry_date: item.domains?.expiry_date,
          registrar: item.domains?.registrars?.name,
          purchase_price: parseFloat(item.purchase_price) || 0,
          current_value: parseFloat(item.current_value) || 0,
          renewal_cost: parseFloat(item.renewal_cost) || 0,
          auto_renew: item.auto_renew
        }));
      }),
      catchError(error => this.handleError(error))
    );
  }  

  // Update costings for all edited domains
  updateDomainCostings(updates: any[]): Observable<void> {
    return from(
      this.supabase
        .from('domain_costings')
        .upsert(updates, { onConflict: 'domain_id' })
        .then((response) => {
          if (response.error) {
            throw response.error;
          }
        })
    );
  }

}
