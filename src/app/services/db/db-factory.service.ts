import { Injectable } from '@angular/core';
import { SupabaseDatabaseService } from './db-supabase.service';
import { PostgresDatabaseService } from './db-postgres.service';
import { EnvService } from '~/app/services/environment.service';
import { BaseDatabaseService } from '~/app/services/db/db-base.service';

@Injectable({
  providedIn: 'root',
})
export class DatabaseServiceFactory {
  constructor(
    private supabaseService: SupabaseDatabaseService,
    private postgresService: PostgresDatabaseService,
    private environmentService: EnvService,
  ) {}

  create(): BaseDatabaseService {
    const environment = this.environmentService.getEnvironmentType();
    return environment === 'managed' ? this.supabaseService : this.postgresService;
  }
}
