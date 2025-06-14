import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { ActivatedRoute } from '@angular/router';
import { GlobalMessageService } from '~/app/services/messaging.service';
import { EnvService, EnvVar } from '~/app/services/environment.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import DatabaseService from '~/app/services/database.service';

interface DiagnosticEndpoint {
  label: string;
  description: string;
  url: string;
  loading: boolean;
  success: boolean | null;
  response?: any;
  errorMsg?: string;
  statusCode?: number;
  timeTaken?: number;
  bytesReceived?: number;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, any>;
}

interface EndpointGroup {
  title: string;
  endpoints: DiagnosticEndpoint[];
  showReset: boolean;
  showRunAll?: boolean;
}

declare const __APP_VERSION__: string;

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './diagnostic-actions.page.html',
  styles: [``],
})
export default class ErrorPage implements OnInit {
  errorMessage?: string;

  endpointGroup: EndpointGroup[] = [];

  endpoints: DiagnosticEndpoint[] = [];
  resolutionEndpoints: DiagnosticEndpoint[] = [];

  appVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
  updateStatus = 'pending';
  updateMessage = '';

  databaseResults = '';
  databaseSuccess = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private envService: EnvService,
    private databaseService: DatabaseService,
  ) {}

  ngOnInit(): void {
    this.errorMessage = this.route.snapshot.queryParamMap.get('errorMessage') || undefined;

    this.resolutionEndpoints = [
      {
        label: 'Billing Check',
        description: 'Checks for valid payment and billing status, and updates plan accordingly.',
        url: '',
        loading: false,
        success: null,
        method: 'GET',
      },
      {
        label: 'Update Domains',
        description: 'Triggers updates of all your domains, finding changes and updating the database.',
        url: '',
        loading: false,
        success: null,
        method: 'GET',
      },
      {
        label: 'Dispatch Notifications',
        description: 'Triggers all pending notifications to be sent, according to your notification preferences.',
        url: '',
        loading: false,
        success: null,
        method: 'GET',
      },
    ];

     this.endpoints = [
      {
        label: 'App Health Check',
        description: 'Checks the application is running and healthy.',
        url: '/api/health',
        loading: false,
        success: null,
        method: 'GET',
      },
      {
        label: 'Domain Info',
        description: `
          Fetches info about a domain. Used to auto-populate fields when adding a new domain,
          and also called when checking for domain updates.`,
        url: this.getEnvValue('DL_DOMAIN_INFO_API', '/api/domain-info'),
        loading: false,
        success: null,
        method: 'GET',
        params: { domain: 'example.com' },
      },
      {
        label: 'Domain Subs',
        description: `
          Returns the list of subdomains for a given domain. Used during subdomain discovery.`,
        url: this.getEnvValue('DL_DOMAIN_SUBS_API', '/api/domain-subs'),
        loading: false,
        success: null,
        params: { domain: 'example.com' },
      },
      {
        label: 'Domain Monitor',
        description: `
          Checks if a given website is up and running, and saves response times and details into db`,
        url: '/api/domain-monitor',
        loading: false,
        success: null,
        params: { domain: 'example.com' },
      },
      {
        label: 'Domain Updater',
        description: 'Runs update script, to find new changes (from domain-info), and update the DB accordingly.',
        url: '/api/domain-updater',
        loading: false,
        success: null,
        params: { domain: 'example.com' },
      },
      {
        label: 'Postgres Executer',
        description: 'Used to execute SQL commands server-side on self-hosted instances of Domain Locker.',
        url: '/api/pg-executer',
        loading: false,
        success: null,
        method: 'POST',
      },
      {
        label: 'Status Info',
        description: 'Ensures that services relied upon by the Domain Locker public instance are running well.',
        url: '/api/status-info',
        loading: false,
        success: null,
      },
    ];

    
    this.endpointGroup = [
      {
        title: 'Account Checks',
        endpoints: this.resolutionEndpoints,
        showReset: false,
      },
      {
        title: 'Local Endpoint Tests',
        endpoints: this.endpoints,
        showReset: false,
        showRunAll: true,
      },
    ];
  }

  checkDatabaseConnection(): void {
    this.databaseResults = 'Loading...';
    this.databaseSuccess = '';
    try {
    this.databaseService.instance.checkAllTables().subscribe({
      next: (results) => {
        this.databaseResults = '';
        if (!results || !results.length) {
          throw new Error('No tables found in the database.');
        }
        this.databaseSuccess = 'passed';
        results.forEach((table) => {
          this.databaseResults += `${table.success} ${table.table} (${table.count} records)\n`;
          if (table.success !== '✅') {
            this.databaseSuccess = 'some_errors';
          };
        });
      },
      error: (err) => {
        this.databaseResults = `Error checking tables: ${err.message || err}`;
        this.databaseSuccess = 'errored';
      },
    });
    } catch (err: any) {
      this.databaseResults = `Error checking tables: ${err.message || err}`;
      this.databaseSuccess = 'errored';
    }
  }

  checkAppVersion(): void {
    const currentVersion = this.appVersion;
    this.http.get<{ version: string }>('https://raw.githubusercontent.com/Lissy93/domain-locker/refs/heads/main/package.json')
      .subscribe({
        next: (data) => {
          const latestVersion = data.version;
          if (latestVersion && latestVersion !== currentVersion) {
            this.updateStatus = 'update_available';
            this.updateMessage = `A new version (${latestVersion}) is available. You are running ${currentVersion}.`;
          } else {
            this.updateStatus = 'up_to_date';
            this.updateMessage = `You are running the latest version (${currentVersion}).`;
          }
        },
        error: () => {
          this.updateStatus = 'error';
          this.updateMessage = 'Could not check for updates. Please try again later.';
        }
      });
  }


  getEnvValue(key: EnvVar, fallback?: string): string {
    return this.envService.getEnvVar(key, fallback) || fallback || '';
  }

  runAllEndpointTests(targetGroup: EndpointGroup): void {
    targetGroup.showReset = true;
    targetGroup.endpoints.forEach(ep => {
      if (!ep.loading) {
        this.testEndpoint(ep);
      }
    });
  }

  resetAllEndpointTests(targetGroup: EndpointGroup): void {
    targetGroup.showReset = false;
    targetGroup.endpoints.forEach(ep => {
      ep.loading = false;
      ep.success = null;
      ep.response = undefined;
      ep.errorMsg = undefined;
      ep.statusCode = undefined;
      ep.timeTaken = undefined;
      ep.bytesReceived = undefined;
    });
  }

/**
   * Called when the user clicks “Run” on a particular endpoint.
   * It will:
   *  1) set loading=true,
   *  2) fetch the URL,
   *  3) record success/response or failure/message,
   *  4) set loading=false.
   */
  testEndpoint(ep: DiagnosticEndpoint, group?: EndpointGroup): void {
    if (group) {
      group.showReset = true;
    }

    ep.loading = true;
    ep.success = null;
    ep.response = undefined;
    ep.errorMsg = undefined;
    ep.statusCode = undefined;
    ep.timeTaken = undefined;

    const httpMethod = ep.method?.toUpperCase() || 'GET';
    let httpCall;

    const startTime = performance.now();

    if (httpMethod === 'GET') {
      httpCall = this.http.get(ep.url, { params: ep.params, observe: 'response' });
    } else if (httpMethod === 'POST') {
      httpCall = this.http.post(ep.url, ep.params, { observe: 'response' });
    } else if (httpMethod === 'PUT') {
      httpCall = this.http.put(ep.url, ep.params, { observe: 'response' });
    } else if (httpMethod === 'DELETE') {
      httpCall = this.http.delete(ep.url, { params: ep.params, observe: 'response' });
    } else {
      ep.loading = false;
      ep.success = false;
      ep.errorMsg = `Unsupported HTTP method: ${httpMethod}`;
      return;
    }

    firstValueFrom(httpCall)
      .then(response => {
        ep.timeTaken = Math.round(performance.now() - startTime);
        ep.statusCode = (response?.body as any)?.statusCode || response.status;
        if ((response.body as any)?.error) {
          ep.success = false;
          ep.errorMsg = (response.body as any).error || 'Unknown error';
        } else {
          ep.success = true;
        }
        ep.response = response.body;
        ep.bytesReceived = response.headers.get('Content-Length') ? parseInt(response.headers.get('Content-Length') || '0', 10) : undefined;
      })
      .catch(err => {
        ep.timeTaken = Math.round(performance.now() - startTime);
        ep.success = false;
        ep.statusCode = err.status;
        ep.errorMsg = err.message || (err.error?.error || JSON.stringify(err.error)) || 'Unknown error';
      })
      .finally(() => {
        ep.loading = false;
      });
  }
}
