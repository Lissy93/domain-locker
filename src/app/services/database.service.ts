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


@Injectable({
  providedIn: 'root',
})
export default class DatabaseService {
  private service: IDatabaseService;

  constructor(
    private envService: EnvService,
    private supabaseService: SupabaseService,
    private errorHandler: ErrorHandlerService,
    private globalMessagingService: GlobalMessageService,
    private pgApiUtil: PgApiUtilService,
    private featureService: FeatureService,
  ) {
    // Create the real sub-service
    if (this.envService.isSupabaseEnabled()) {
      this.service = new SbDatabaseService(
        this.supabaseService,
        this.errorHandler,
        this.globalMessagingService,
        this.featureService,
      ) as unknown as IDatabaseService;
    } else {
      this.service = new PgDatabaseService(this.pgApiUtil) as unknown as IDatabaseService;
    }
  }

  // Expose the proxied service to the rest of the app
  public get instance(): IDatabaseService {
    return this.service;
  }
}
