import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { AccountIssuesComponent } from '~/app/components/settings/account-issues/account-issues.component';
import { BillingService } from '~/app/services/billing.service';
import { ThemeService } from '~/app/services/theme.service';
import { SupabaseService } from '~/app/services/supabase.service';
import { TranslationService } from '~/app/services/translation.service';
import DatabaseService from '~/app/services/database.service';
import { Observable, of, from } from 'rxjs';
import { User } from '@supabase/supabase-js';
import { settingsLinks } from '~/app/constants/navigation-links';

@Component({
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.page.html',
  imports: [CommonModule, PrimeNgModule, AccountIssuesComponent],
})
export default class SettingsPage {
  currentPlan$?: Observable<string | null>;
  user$?: Observable<User | null>;

  displayOptions: { theme: string, darkMode: boolean, font: string, scale: string } | null = null;
  language: string = 'English';
  notifications: null | any = null;

  showAccountInfo = false;
  isAccountInfoLoading = false;
  settingsLinks = settingsLinks;

  constructor(
    private billingService: BillingService,
    private themeService: ThemeService,
    private supabaseService: SupabaseService,
    private translationService: TranslationService,
    private databaseService: DatabaseService,
  ) {}

  public toggleAccountInfo(): void {
    this.showAccountInfo = !this.showAccountInfo;

    // If we just opened the section, and we haven't loaded data yet -> fetch now
    if (this.showAccountInfo) {
      this.loadAccountInfo();
    }
  }

  private loadAccountInfo(): void {
    this.isAccountInfoLoading = true;

    // For Observables:
    // 1) Make sure we call the services
    this.billingService.fetchUserPlan(); // triggers plan retrieval
    this.currentPlan$ = this.billingService.getUserPlan();

    this.user$ = from(this.supabaseService.getCurrentUser());

    // Synchronous calls
    this.displayOptions = this.themeService.getUserPreferences();
    this.language = this.translationService.getLanguageToUse();

    // Async call for notifications
    this.getNotificationPreferences()
      .finally(() => {
        this.isAccountInfoLoading = false;
      });
  }

  private async getNotificationPreferences() {
    const preferences = await this.databaseService.instance.notificationQueries.getNotificationChannels();
    if (!preferences) return;
    this.notifications = {
      email: preferences?.email?.enabled || false,
      slack: preferences?.slack?.enabled || false,
      matrix: preferences?.matrix?.enabled || false,
      signal: preferences?.signal?.enabled || false,
      webHook: preferences?.webHook?.enabled || false,
      telegram: preferences?.telegram?.enabled || false,
      pushNotification: preferences?.pushNotification?.enabled || false,
    };
  }

  public passwordInfo(user: User): string {
    const emailProvider = user.identities?.find((i) => i.provider === 'email');
    if (emailProvider) {
      return `****** ${this.makeDate(emailProvider?.updated_at)}`;
    }
    return 'No password set';
  }

  public mfaInfo(user: User): string {
    const toptFactor = user.factors?.find((f) => f.factor_type === 'totp');
    if (toptFactor) {
      return `Enabled ${this.makeDate(toptFactor?.created_at)}`;
    }
    return 'Not configured';
  }

  private makeDate(date: string | undefined): string {
    return date ? `(Updated on ${new Date(date).toLocaleDateString()})` : '';
  }
}
