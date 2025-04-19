import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { ErrorHandlerService } from '~/app/services/error-handler.service';

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './error-logs.page.html',
})
export default class ErrorLogs {
  public errorLog: { date: Date; message: string; location?: string; error?: any }[] = [];

  constructor(
    private errorHandler: ErrorHandlerService,

  ) {}

  ngOnInit(): void {
    this.errorLog = this.errorHandler.getRecentErrorLog();
  }
}
