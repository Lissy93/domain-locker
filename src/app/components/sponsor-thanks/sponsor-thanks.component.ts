import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { SupabaseService } from '~/app/services/supabase.service';
import { ErrorHandlerService } from '~/app/services/error-handler.service';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { GlobalMessageService } from '~/app/services/messaging.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-sponsor-message',
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './sponsor-thanks.component.html',
  styles: [``],
})
export class SponsorMessageComponent implements OnInit {
  githubUsername: string | null = null;
  isSponsor: boolean = false;
  isHidden: boolean = false;
  inSelfHostingDocs: boolean = false;

  constructor(
    private supabase: SupabaseService,
    private http: HttpClient,
    private errorHandler: ErrorHandlerService,
    private messageService: GlobalMessageService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // Check localStorage for hide preference (browser-only)
      if (this.isBrowser() && localStorage.getItem('hideSponsorThanks') === 'true') {
        this.isHidden = true;
        return;
      }

      if (this.router.url.includes('self-hosting')) {
        this.inSelfHostingDocs = true;
      }

      // Get session data
      const sessionData = await this.supabase.getSessionData();

      // Extract GitHub username
      const identities = (sessionData as any)?.session?.user?.identities || [];
      const githubIdentity = identities.find(
        (identity: any) => identity.provider === 'github'
      );

      this.githubUsername = githubIdentity?.identity_data?.['user_name'] || null;

      if (this.githubUsername) {
        // Check if user is a sponsor
        this.http
          .get(`https://github-sponsors-api.as93.net/lissy93`)
          .subscribe({
            next: (sponsors: any) => {
              this.isSponsor = sponsors.some(
                (sponsor: any) => sponsor.login === this.githubUsername
              );
            },
            error: (error) => this.errorHandler.handleError({ error }),
          });
      }
    } catch (error) {
      this.errorHandler.handleError({ error });
    }
  }

  hideSponsorThanks(): void {
    if (this.isBrowser()) {
      localStorage.setItem('hideSponsorThanks', 'true');
      this.messageService.showInfo('Sponsor Section Deactivated', 'No problem! We won\'t mention this again!');
    }
    this.isHidden = true;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}
