import { Component, OnInit, ChangeDetectorRef, PLATFORM_ID, Inject, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '~/app/services/supabase.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { Subscription } from 'rxjs';
import { GlobalMessageService } from '~/app/services/messaging.service';
import { ErrorHandlerService } from '~/app/services/error-handler.service';
import { FeatureService } from '~/app/services/features.service';
import { EnvService } from '~/app/services/environment.service';
import { LogoComponent} from '~/app/components/home-things/logo/logo.component';
import { NgxTurnstileModule, NgxTurnstileComponent } from 'ngx-turnstile';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    PrimeNgModule,
    LogoComponent,
    NgxTurnstileModule,
  ],
  templateUrl: './login.page.html',
  styles: [`
    :host ::ng-deep .p-selectbutton {
      display: flex;
      margin-bottom: 1rem;
    }
    :host ::ng-deep .p-selectbutton .p-button {
      flex: 1;
    }
  `]
})
export default class LoginPageComponent implements OnInit {
  isLogin = true;
  form: FormGroup;
  errorMessage = '';
  successMessage = '';
  showLoader = false;
  showWelcomeCard = false;
  isAuthenticated: boolean = false;
  showResendEmail = false;
  disabled = false;
  modes = [
    { label: 'Login', value: true },
    { label: 'Sign Up', value: false }
  ];

  requireMFA = false;
  factorId: string | null = null;
  challengeId: string | null = null
  partialSession: any;
  isDemoInstance = false;

  @ViewChild(NgxTurnstileComponent) turnstile!: NgxTurnstileComponent;
  turnstileResponse?: string;
  turnstileSiteKey = '';

  private subscriptions: Subscription = new Subscription();

  disabledSocialLogin$ = this.featureService.isFeatureEnabled('disableSocialLogin');
  
  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private messagingService: GlobalMessageService,
    private errorHandlerService: ErrorHandlerService,
    private featureService: FeatureService,
    private environmentService: EnvService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: [''],
      mfaCode: ['', [Validators.pattern(/^\d{6}$/)]],
      acceptTerms: [false]
    });

    this.turnstileSiteKey = this.environmentService.getEnvVar('DL_TURNSTILE_KEY', undefined);
  }

  ngOnInit() {
    this.onModeChange();

    this.subscriptions.add(
      this.supabaseService.authState$.subscribe(isAuthenticated => {
        this.isAuthenticated = isAuthenticated;
        this.cdr.detectChanges();
      })
    );

    // Initial check for auth status
    this.checkAuthStatus();

    // If demo instance, show banner and auto-fill credentials
    this.checkIfDemoInstance();

    const isNewSignup = this.route.snapshot.queryParamMap.get('newUser');
    if (isNewSignup !== null) {
      this.isLogin = false;
      this.showWelcomeCard = true;
      this.checkIfSignupDisabled();
    }

    this.route.queryParams.subscribe(async params => {
      if (params['requireMFA'] === 'true') {
        // User needs to complete MFA
        const { data: factors } = await this.supabaseService.supabase.auth.mfa.listFactors();
        if (factors && factors.totp.length > 0) {
          this.requireMFA = true;
          this.factorId = factors.totp[0].id;
          this.form.get('mfaCode')?.setValidators([
            Validators.required, 
            Validators.pattern(/^\d{6}$/)
          ]);
          this.form.get('mfaCode')?.updateValueAndValidity();
          this.successMessage = 'Please enter your 2FA code to continue';
          this.cdr.detectChanges();
        }
      }
    });
  }
  
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  sendCaptchaResponse(captchaResponse: string | null) {
    this.turnstileResponse = captchaResponse || undefined;
  }

  async checkAuthStatus() {
    const isAuthenticated = await this.supabaseService.isAuthenticated();
    this.supabaseService.setAuthState(isAuthenticated);
  }

  /* Update form visibility, and clear messages on mode change */
  async onModeChange() {
    // Reset error/success messages
    this.resetMessages();

    // Reset MFA state
    this.requireMFA = false;
    this.factorId = null;
    this.challengeId = null;
    this.form.get('mfaCode')?.reset();
    
    // Reset form validators based on mode
    if (this.isLogin) {
      this.form.get('confirmPassword')?.clearValidators();
      this.form.get('acceptTerms')?.clearValidators();
    } else {
      this.checkIfSignupDisabled();
      this.form.get('confirmPassword')?.setValidators([Validators.required, this.passwordMatchValidator.bind(this)]);
      this.form.get('acceptTerms')?.setValidators([Validators.requiredTrue]);
    }
    this.form.get('confirmPassword')?.updateValueAndValidity();
    this.form.get('acceptTerms')?.updateValueAndValidity();
  }

  async checkIfSignupDisabled() {
    if ((await this.featureService.isFeatureEnabledPromise('disableSignUp'))) {
      this.messagingService.showWarn(
        'Sign Up Disabled',
        'It\'s not possible to create new accounts on the demo instance.',
      );
      this.isLogin = true;
    }
  }

  checkIfDemoInstance() {
    const environmentType = this.environmentService.getEnvironmentType();
    if (environmentType === 'demo') {
      this.isDemoInstance = true;
    }
    if (environmentType === 'demo' || environmentType === 'dev') {
      // Pre-fill demo/dev credentials if they exist
      const demoUser = this.environmentService.getEnvVar('DL_DEMO_USER') || '';
      const demoPass = this.environmentService.getEnvVar('DL_DEMO_PASS') || '';
      this.form.get('email')?.setValue(demoUser);
      this.form.get('password')?.setValue(demoPass);
    }
  }

  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = this.form.get('password')?.value;
    const confirmPassword = control.value;
    return password === confirmPassword ? null : { 'passwordMismatch': true };
  }

  signOut() {
    this.supabaseService.signOut();
  }
  
  private resetMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  async loginWithGitHub(): Promise<void> {
    try {
      await this.supabaseService.signInWithGitHub();
    } catch (error: any) {
      this.errorHandlerService.handleError({ error, message: 'Failed to sign in with GitHub', showToast: true, location: 'login' });
    }
  }
  async loginWithGoogle(): Promise<void> {
    try {
      await this.supabaseService.signInWithGoogle();
    } catch (error: any) {
      this.errorHandlerService.handleError({ 
        error, 
        message: 'Failed to sign in with Google', 
        showToast: true, 
        location: 'loginWithGoogle' 
      });
    }
  }  

  async loginWithFacebook(): Promise<void> {
    try {
      await this.supabaseService.signInWithFacebook();
    } catch (error: any) {
      this.errorHandlerService.handleError({ 
        error, 
        message: 'Failed to sign in with Facebook', 
        showToast: true, 
        location: 'loginWithFacebook' 
      });
    }
  }
  
  async onSubmit() {
    if (!this.form.valid || (this.requireMFA && this.form.get('mfaCode')?.invalid)) return;
  
    this.resetMessages();
    this.showLoader = true;
  
    try {
      const credentials = {
        email: this.form.get('email')?.value,
        password: this.form.get('password')?.value,
        mfaCode: this.form.get('mfaCode')?.value
      };

      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required.');
      }

      if (this.isLogin) {
        await this.performLogin(credentials);
      } else {
        await this.performSignUp(credentials);
      }
    } catch (error) {
      this.handleError(error);
      this.turnstile.reset();
    } finally {
      this.showLoader = false;
    }
  }

  private async performLogin(credentials: {
    email: string;
    password: string;
    mfaCode?: string;
  }): Promise<void> {
    if (this.requireMFA && credentials.mfaCode) {
      await this.verifyMFACode(credentials.mfaCode);
    } else {
      await this.initialLoginAttempt(credentials);
    }
  }

  private async verifyMFACode(mfaCode: string): Promise<void> {
    if (!this.factorId) {
      throw new Error('No factor ID available');
    }

    await this.supabaseService.verifyMFA(this.factorId, mfaCode);
    this.requireMFA = false;
    this.handleSuccess();
  }

  private async initialLoginAttempt(credentials: {
    email: string;
    password: string;
  }): Promise<void> {
    const { requiresMFA, factors } = await this.supabaseService.signIn(
      credentials.email,
      credentials.password,
      this.turnstileResponse,
    );

    if (requiresMFA && factors.length > 0) {
      await this.setupMFAVerification(factors[0].id);
    } else {
      this.handleSuccess();
    }
  }

  private async setupMFAVerification(factorId: string): Promise<void> {
    this.requireMFA = true;
    this.factorId = factorId;
    
    this.form.get('mfaCode')?.setValidators([
      Validators.required,
      Validators.pattern(/^\d{6}$/)
    ]);
    this.form.get('mfaCode')?.updateValueAndValidity();
    
    this.successMessage = 'Please enter your 2FA code to continue';
    this.cdr.detectChanges();
  }

  private async performSignUp(credentials: {
    email: string;
    password: string;
  }): Promise<void> {
    const delayTimeout = 15000;
    const authPromise = this.supabaseService.signUp(
      credentials.email,
      credentials.password,
      this.turnstileResponse,
    );
    const timeoutPromise = this.createTimeout(delayTimeout);
    
    const result = await Promise.race([authPromise, timeoutPromise]);
    if (result instanceof Error) {
      throw result;
    }

    this.handleSuccess();
  }
  
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), ms);
    });
  }
  
  private handleSuccess() {
    if (this.requireMFA) {
      this.successMessage = '2FA verification is enabled. Please enter your code when prompted';
    } else if (this.isLogin) {
      this.successMessage = 'Login successful! Redirecting...';
      this.router.navigate(['/']);
    } else {
      this.messagingService.showSuccess('Sign Up Successful', 'Awaiting account confirmation...');
      this.successMessage = 'Sign up successful! Please check your email to confirm your account.';
      this.disabled = true;
    }
    this.cdr.detectChanges();
  }
  
  private handleError(error: unknown) {
    if (error instanceof Error) {
      this.errorMessage = error.message;
      if (error.message.includes('Email not confirmed')) {
        this.showResendEmail = true;
      }
    } else {
      this.errorMessage = 'An unexpected error occurred. Please try again.';
    }
    this.cdr.detectChanges();
  }
  
  public resendVerificationEmail() {
    this.showLoader = true;
    try {
      this.supabaseService.resendVerificationEmail(this.form.get('email')?.value);
      this.successMessage = 'Verification email resent successfully.';
      this.errorMessage = '';
      this.showResendEmail = false;
      this.showLoader = false;
    } catch (error: any) {
      this.errorMessage = 'Failed to resend verification email. Please try again.';
      this.showLoader = false;
    }
  }
  
}
