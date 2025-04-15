import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { ErrorHandlerService } from '~/app/services/error-handler.service';

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './error-logs.page.html',
  styles: [``],
})
export default class ErrorLogs {
  public errorLog: { date: Date; message: string; location?: string; error?: any }[] = [];

  public errorTypes = [
    {
      name: 'Client Logs',
      description: 'Errors that occur in the frontend, caught by the browser',
    },
    {
      name: 'Server Logs',
      description: 'Errors that occur in the backend HTTP server or API endpoints',
    },
    {
      name: 'Build Logs',
      description: 'Issues that arise during the build, compilation and release process',
    },
    {
      name: 'Deployment Logs',
      description: 'Events logged during the container or app deployment process',
    },
    {
      name: 'Network Logs',
      description: 'Errors that occur during network requests, such as timeouts or failures',
    },
    {
      name: 'Database Logs',
      description: 'Errors that occur during database operations, such as queries or connections',
    },
    {
      name: 'Security Logs',
      description: 'Events related to security, such as authentication failures or access violations',
    },
    {
      name: 'Performance Logs',
      description: 'Metrics and logs related to application performance and resource usage',
    },
  ];

  constructor(
    private errorHandler: ErrorHandlerService,
    
  ) {}

  ngOnInit(): void {
    this.errorLog = this.errorHandler.getRecentErrorLog();
    console.log(this.errorLog);
  }
}
