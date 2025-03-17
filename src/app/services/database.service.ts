import { Injectable } from '@angular/core';
import { EnvService } from '~/app/services/environment.service';
import SbDatabaseService from '~/app/services/db-query-services/sb-database.service';
import PgDatabaseService from '~/app/services/db-query-services/pg-database.service';
import { SupabaseService } from '~/app/services/supabase.service';
import { ErrorHandlerService } from '~/app/services/error-handler.service';
import { GlobalMessageService } from '~/app/services/messaging.service';
import { PgApiUtilService } from '~/app/utils/pg-api.util';
import { type DatabaseService as IDatabaseService } from '~/app/../types/Database';
import { FeatureService } from '~/app/services/features.service';
import { Router } from '@angular/router';


@Injectable({
  providedIn: 'root',
})
export default class DatabaseService {
  private service!: IDatabaseService; 
  public serviceType: 'supabase' | 'postgres' | 'none' | 'error' = 'none';

  constructor(
    private envService: EnvService,
    private supabaseService: SupabaseService,
    private errorHandler: ErrorHandlerService,
    private globalMessagingService: GlobalMessageService,
    private pgApiUtil: PgApiUtilService,
    private featureService: FeatureService,
    private router: Router,
  ) {
    // If Postgres creds are present, use Postgres as DB
    if (this.envService.isPostgresEnabled()){
      this.service = new PgDatabaseService(this.pgApiUtil) as unknown as IDatabaseService;
      this.serviceType = 'postgres';
    }
    // If Supabase is enabled, use Supabase as DB
    else if (this.envService.isSupabaseEnabled()) {
      try { // Try to establish connection to Supabase
        this.serviceType = 'supabase';
        this.service = new SbDatabaseService(
          this.supabaseService,
          this.errorHandler,
          this.globalMessagingService,
          this.featureService,
        ) as unknown as IDatabaseService;
        
      } catch (e) {
        this.errorHappened('Failed to establish connection to Supabase', e as Error)
      }
    } else {
      this.errorHappened('No database service is enabled')
    }
  }

  public errorHappened(errorMessage: string, error?: Error) {
    this.errorHandler.handleError({
      message: errorMessage,
      showToast: true,
      error,
      location: 'DatabaseService.constructor',
    });
    this.serviceType = 'error';
    this.service = {} as unknown as IDatabaseService;
    this.router.navigate(
      ['/advanced/error'],
      { queryParams: { errorMessage } }
    );
  }

  // Expose the proxied service to the rest of the app
  public get instance(): IDatabaseService {
    return this.service;
  }
}
