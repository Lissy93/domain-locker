import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { SupabaseService } from '~/app/services/supabase.service';

interface AccountIssueInterface {
  type: 'warn' | 'error' | 'info' | 'success';
  message: string;
  action?: { label: string; route?: string; callback?: () => void };
}

@Component({
  selector: 'app-account-issues',
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './account-issues.component.html',
})
export class AccountIssuesComponent implements OnInit {
  accountIssues: AccountIssueInterface[] = [
    { type: 'success', message: 'No issues found' },
  ];
  loading: boolean = true;

  constructor(
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const accountIssues = await this.supabaseService.getAccountIssues();
      if (accountIssues.length) this.accountIssues = accountIssues;
    } catch (error) {
      console.error('Error fetching account issues:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges(); // Trigger change detection manually
    }
  }
}
