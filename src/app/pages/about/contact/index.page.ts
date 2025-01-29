import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { SupabaseService } from '~/app/services/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HelpfulLinksComponent } from '~/app/components/misc/helpful-links.component';

interface QueryInfo {
  [key: string]: {
    allow: boolean;
    info?: string,
    warn?: string,
    links?: {
      location: string,
      title: string,
      icon: string,
      body: string
    }[]
  }
}

@Component({
  standalone: true,
  selector: 'app-contact',
  imports: [CommonModule, PrimeNgModule, FormsModule, ReactiveFormsModule, HelpfulLinksComponent],
  templateUrl: './index.page.html',
})
export default class ContactPageComponent implements OnInit {
  contactForm!: FormGroup;
  isAuthenticated = false;
  userType: string | null = null;
  showContactForm = false;
  queryInfo: QueryInfo = {
    Feedback: {
      allow: false,
      info: 'We welcome feedback from our users. Please share your thoughts!',
    },
    'Bug/Issue': {
      allow: false,
      info: 'Please report bugs/issues if you are on a paid plan.',
    },
    Security: {
      allow: true,
      info: 'If you have a security concern, please let us know immediately.',
    },
    'Custom Plan': {
      allow: true,
      info: 'Looking for a custom plan? Get in touch with us!',
    },
    'User Support': {
      allow: false,
      info: 'User support is available for Pro and above users.',
    },
    'Enterprise Support': {
      allow: false,
      warn: 'Enterprise support is available for enterprise users.',
    },
    Data: {
      allow: false,
      info: 'Have questions about your data? Let us know.',
      links: [
        { location: '/about/data', title: 'Privacy Policy', icon: 'info-circle', body: 'Read what data is collected and how it\'s stored and used' },
        { location: '/settings/privacy', title: 'Privacy Options', icon: 'lock-open', body: 'Update preferences for 3rd party services' },
        { location: '/domains/export', title: 'Export Data', icon: 'download', body: 'Export your data in a machine-readable format' },
        { location: '/domains/add', title: 'Add Domain(s)', icon: 'upload', body: 'Add domains and associated assets to your account' },
        { location: '/settings/delete-account', title: 'Delete Account', icon: 'ban', body: 'Delete your account, and all associated data' },
        { location: '/settings/developer-options', title: 'Data Interoperability', icon: 'code', body: 'Access your data programmatically via our API' },
        // { location: '', title: '', icon: '', body: '' },
      ],
    },
    Help: {
      allow: false,
      info: 'Need help with something? Reach out to us.',
    },
  };

  queryTypes = Object.keys(this.queryInfo);

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit(): Promise<void> {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      userType: [{ value: '', disabled: true }],
      queryType: ['', Validators.required],
      body: ['', [Validators.required, Validators.minLength(10)]],
    });

    // Get auth state
    this.isAuthenticated = await this.supabaseService.isAuthenticated();
    const user = await this.supabaseService.getCurrentUser();

    // Autofill user details
    if (user) {
      this.contactForm.patchValue({
        name: user.user_metadata?.['name'] || '',
        email: user.email || '',
      });

      // Determine user type
      this.userType = user.user_metadata?.['user_type'] || 'Free'; // Default to Free
      this.contactForm.get('userType')?.setValue(this.userType);

      // Update permissions based on user type
      this.updateQueryPermissions();
    }
  }

  onQueryTypeChange(queryType: string): void {
    this.showContactForm = this.queryInfo[queryType]?.allow || false;
  }

  private updateQueryPermissions(): void {
    if (this.userType === 'Pro' || this.userType === 'Hobby') {
      this.queryInfo['Bug/Issue'].allow = true;
      this.queryInfo['User Support'].allow = true;
    }
    if (this.userType === 'Enterprise') {
      this.queryInfo['Enterprise Support'].allow = true;
    }
    if (this.isAuthenticated) {
      this.queryInfo['Feedback'].allow = true;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.contactForm.invalid) return;

    const { name, email, queryType, body } = this.contactForm.getRawValue();

    try {
      // Replace with your email sending logic
      console.log('Submitting form:', { name, email, queryType, body });
    } catch (error) {
      console.error('Failed to submit form:', error);
    }
  }
}
