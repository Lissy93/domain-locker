import { Injectable } from '@angular/core';
import { environment } from '~/app/environments/environment';

export type EnvironmentType = 'dev' | 'managed' | 'selfHosted' | 'demo';

type EnvVar =
'DL_BASE_URL'           // Hostname/URL or HOST:PORT where domain locker is running
| 'SUPABASE_URL'        // Supabase URL
| 'SUPABASE_ANON_KEY'   // Supabase public key
| 'DL_ENV_TYPE'         // EnvironmentType (dev, managed, selfHosted, demo)
| 'DL_SUPABASE_PROJECT' // Supabase project ID
| 'DL_DEBUG'            // Enable debug mode, to show debug messages
| 'DL_GLITCHTIP_DSN'    // GlitchTip DSN, for error tracking
| 'DL_PLAUSIBLE_URL'    // URL to Plausible instance, for hit counting
| 'DL_PLAUSIBLE_SITE'   // Plausible site ID /  URL, for hit counting
| 'DL_PG_HOST'          // Postgres host
| 'DL_PG_PORT'          // Postgres port
| 'DL_PG_NAME'          // Postgres DB name
| 'DL_PG_USER'          // Postgres user
| 'DL_PG_PASSWORD'      // Postgres password
| 'DL_DEMO_USER'        // Demo user email (for auto-filling on demo instance)
| 'DL_DEMO_PASS'        // Demo user password (for auto-filling on demo instance)
| 'DL_DOMAIN_INFO_API'  // API endpoint for /api/domain-info
| 'DL_DOMAIN_SUBS_API'  // API endpoint for /api/domain-subs
;

@Injectable({
  providedIn: 'root',
})
export class EnvService {

  private environmentFile = (environment || {}) as Record<string, any>;

  mapKeyToVarName(key: EnvVar): string {
    return key.startsWith('DL_') ? key.substring(3) : key;
  }

  /**
   * Retrieves the value of an environment variable
   * Tries environmental variable (e.g. from .env) first, then runtime variable (e.g. from environment.ts)
   * Otherwise returns the fallback value if present, otherwise null.
   * @param key Environment variable key
   * @param fallback Fallback value
   */
  getEnvVar(key: EnvVar, fallback: string | null = null, throwError: boolean = false): any {
    const buildtimeValue = import.meta.env[key]; // From .env
    const runtimeValue = this.environmentFile[this.mapKeyToVarName(key)]; // From environment.ts

    const value = (buildtimeValue || runtimeValue) ?? fallback;
    
    if (!value && throwError) { // Throw error to be caught by the caller
      throw new Error(`Environment variable ${key} is not set.`);
    }
    return value;
  }


  /**
   * Checks if Supabase is enabled in the environment, but without throwing an error.
   * @returns
   */
  isSupabaseEnabled(): boolean {
    if (this.getEnvironmentType() === 'selfHosted') {
      return false;
    }
    const supabaseUrl = this.getEnvVar('SUPABASE_URL');
    const supabaseKey = this.getEnvVar('SUPABASE_ANON_KEY');
    return Boolean(supabaseUrl && supabaseKey);
  }

  /**
   * Determines the environment type.
   */
  getEnvironmentType(): EnvironmentType {
    const env = this.getEnvVar('DL_ENV_TYPE', 'selfHosted');
    if (['dev', 'managed', 'selfHosted', 'demo'].includes(env)) {
      return env as EnvironmentType;
    }
    return 'selfHosted';
  }

  /**
   * Returns the Supabase URL from the environment.
   */
  getSupabaseUrl(): string {
    return this.getEnvVar('SUPABASE_URL', null, true);
  }

  /**
   * Returns the Supabase public key from the environment.
   */
  getSupabasePublicKey(): string {
    return this.getEnvVar('SUPABASE_ANON_KEY', null, true);
  }

  getProjectId(): string {
    return this.getEnvVar('DL_SUPABASE_PROJECT');
  }

  getGlitchTipDsn(): string {
    return this.getEnvVar('DL_GLITCHTIP_DSN');
  }

  /* Returns config object for Postgres */
  getPostgresConfig(): { host: string, port: number, user: string, password: string, database: string } {
    return {
      host: this.getEnvVar('DL_PG_HOST', 'localhost'),
      port: Number(this.getEnvVar('DL_PG_PORT', '5432')),
      user: this.getEnvVar('DL_PG_USER', 'postgres'),
      password: this.getEnvVar('DL_PG_PASSWORD', 'dinosaur'),
      database: this.getEnvVar('DL_PG_NAME', 'domain_locker'),
    };
  }

  getPostgresApiUrl(): string {
    const endpoint = '/api/pg-executer/';
    const baseUrl = this.getEnvVar('DL_BASE_URL', 'http://localhost:5173');
    return `${baseUrl}${endpoint}`;
  }

  getPlausibleConfig(): { site: string, url: string, isConfigured: boolean } {
    const site = this.getEnvVar('DL_PLAUSIBLE_SITE', '');
    const url = this.getEnvVar('DL_PLAUSIBLE_URL', '');
    const isConfigured = Boolean(site && url);
    return { site, url, isConfigured };
  }

}
