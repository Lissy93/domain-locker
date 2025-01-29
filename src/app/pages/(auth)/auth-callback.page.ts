import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '~/app/services/supabase.service';
import { GlobalMessageService } from '~/app/services/messaging.service';
import { ErrorHandlerService } from '~/app/services/error-handler.service';

@Component({
  standalone: true,
  selector: 'app-auth-callback',
  template: `<p>Processing social login...</p>`,
})
export default class AuthCallbackComponent implements OnInit {
  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
    private messagingService: GlobalMessageService,
    private errorHandlerService: ErrorHandlerService
  ) {}

  private errorHappened(error: Error | any) {
    this.errorHandlerService.handleError({
      message: 'Unable to authenticate with your social account',
      error,
      location: 'auth-callback',
    });
    this.router.navigate(['/login']);
  }

  async ngOnInit(): Promise<void> {
    const { data, error } = await this.supabaseService.supabase.auth.exchangeCodeForSession(window.location.href);
    if (error) {
      this.errorHappened(error);
    }
    // Successfully logged in
    this.messagingService.showSuccess('Authenticated', 'Successfully logged in');
    this.router.navigate(['/']);

  }
}
