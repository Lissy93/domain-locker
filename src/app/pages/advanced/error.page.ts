import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { ActivatedRoute } from '@angular/router';
import { GlobalMessageService } from '~/app/services/messaging.service';

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './error.page.html',
  styles: [``],
})
export default class ErrorPage implements OnInit {
  errorMessage?: string;

  constructor(
    private route: ActivatedRoute,
    private messagingService: GlobalMessageService,
  ) {}

  ngOnInit(): void {
    this.errorMessage = this.route.snapshot.queryParamMap.get('errorMessage') || undefined;
  }

  reload() {
    this.messagingService.showInfo('Reloading...', '');
    window.location.href = '/';
  }

  clearStorage() {
    this.messagingService.showInfo('Clearing Session Data', '');
    localStorage.clear();
    sessionStorage.clear();
    this.reload();
  }

  enableDebugging() {
    this.messagingService.showInfo('Enabling Debug Mode', 'Error logs and diagnostics will be send to us');
  }
}
