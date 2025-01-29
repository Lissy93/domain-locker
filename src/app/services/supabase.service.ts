// ~/app/services/supabase.service.ts
import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, Factor, Session, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { EnvService } from '~/app/services/environment.service';
import { ErrorHandlerService } from '~/app/services/error-handler.service';
import { features } from '~/app/constants/feature-options';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {

  public supabase!: SupabaseClient;
  private authStateSubject = new BehaviorSubject<boolean>(false);
  authState$ = this.authStateSubject.asObservable();
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();
  private token: string | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private envService: EnvService,
    private errorHandler: ErrorHandlerService,
  ) {
    
    try {

      if (this.envService.getEnvironmentType() === 'selfHosted') {
        console.warn('Supabase is disabled in selfHosted mode.');
        return;
      }

      const supabaseUrl = this.envService.getSupabaseUrl();
      const supabaseAnonKey = this.envService.getSupabasePublicKey();
      this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    } catch (error) {
      this.errorHandler.handleError({
        message: 'Failed to connect to Supabase',
        error,
        showToast: true,
        location: 'SupabaseService.constructor',
      });
      return;
    }

    this.supabase.auth.onAuthStateChange((event, session) => {
      this.setAuthState(!!session);
    });

    if (isPlatformBrowser(this.platformId)) {
      try {
        this.initializeAuth();
      } catch (error) {
        this.errorHandler.handleError({
          message: 'Failed to initialize authentication',
          error,
          showToast: true,
          location: 'SupabaseService.constructor',
        });
      }
    }
  }

  isSupabaseEnabled(): boolean {
    return this.envService.isSupabaseEnabled();
  }  

  async isAuthenticated(): Promise<boolean> {

    // Self-hosted environments do not use Supabase for authentication
    if (!this.isSupabaseEnabled()) {
      return true;
    }

    // Check if user has an active session
    const { data: { session } } = await this.supabase.auth.getSession();
    if (!session) return false;
  
    // Check if user has MFA enabled
    const { data: factors, error: factorsError } = await this.supabase.auth.mfa.listFactors();
    if (factorsError) throw factorsError;
    const hasMFAEnabled = factors.totp.length > 0;
    
    // No MFA required, any session is fine
    if (!hasMFAEnabled) {
      return true;
    }
  
    // User has MFA enabled, verify they're at AAL2
    const { data: aal, error: aalError } = await this.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError) throw aalError;
    return aal.currentLevel === 'aal2'; // Only consider authenticated if they've completed MFA (AAL2)
  }

  async getSessionData() {
    if (!this.isSupabaseEnabled()) {
      return {};
    }
    return (await this.supabase.auth.getSession()).data || {};
  }

  private initializeAuth() {
    this.token = localStorage.getItem('supabase_token');
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.userSubject.next(session?.user ?? null);
      if (session) {
        this.token = session.access_token;
        localStorage.setItem('supabase_token', session.access_token);
      } else {
        this.token = null;
        localStorage.removeItem('supabase_token');
      }
    });
  }

  setAuthState(isAuthenticated: boolean) {
    this.authStateSubject.next(isAuthenticated);
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string): Promise<{
    requiresMFA: boolean;
    factors: Factor[];
  }> {
    // First verify credentials and reach AAL1
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;

    // Check AAL and MFA requirements
    const { data: mfaData, error: mfaError } = await this.supabase.auth.mfa.listFactors();
    if (mfaError) throw mfaError;

    const hasMFAEnabled = mfaData.totp.length > 0;

    if (!hasMFAEnabled) {
      // No MFA required, user can proceed with AAL1
      this.setAuthState(true);
      return {
        requiresMFA: false,
        factors: []
      };
    }

    // MFA is required - user needs to provide code to reach AAL2
    return {
      requiresMFA: true,
      factors: mfaData.totp
    };
  }

  async verifyMFA(factorId: string, code: string): Promise<void> {
    // Create MFA challenge
    const { data: challengeData, error: challengeError } = 
      await this.supabase.auth.mfa.challenge({ factorId });
    
    if (challengeError) throw challengeError;

    // Verify the challenge with provided code
    const { data, error: verifyError } = await this.supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code
    });

    if (verifyError) throw verifyError;

    // Successfully verified - user is now at AAL2
    this.setAuthState(true);
  }

  async verifyMFA2WithChallenge(factorId: string, challengeId: string, code: string): Promise<void> {
    const { error } = await this.supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });
    if (error) throw error;
  }  

  async getAuthenticatorAssuranceLevel(): Promise<{ currentLevel: string | null; nextLevel: string | null }> {
    const { data, error } = await this.supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) throw error;
    return { currentLevel: data.currentLevel, nextLevel: data.nextLevel };
  }

  async signInWithGitHub(): Promise<void> {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth-callback`,
      },
    });
    if (error) {
      this.errorHandler.handleError({
        error, message: 'Failed to sign in with GitHub', showToast: true, location: 'SupabaseService.signInWithGitHub',
      });
      throw error;
    }
  }

  async signInWithGoogle(): Promise<void> {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth-callback`
      }
    });
    if (error) {
      this.errorHandler.handleError({
        error,
        message: 'Failed to sign in with Google',
        showToast: true,
        location: 'SupabaseService.signInWithGoogle',
      });
      throw error;
    }
  }

  async signInWithFacebook(): Promise<void> {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/auth-callback`
      }
    });
    if (error) {
      this.errorHandler.handleError({
        error,
        message: 'Failed to sign in with Facebook',
        showToast: true,
        location: 'SupabaseService.signInWithFacebook',
      });
      throw error;
    }
  }
  

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    this.setAuthState(false);
    if (error) throw error;
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('supabase_token');
    }
    return this.token;
  }

  setToken(token: string | null) {
    this.token = token;
    if (isPlatformBrowser(this.platformId)) {
      if (token) {
        localStorage.setItem('supabase_token', token);
      } else {
        localStorage.removeItem('supabase_token');
      }
    }
  }

  /**
   * Checks if the user's email is verified.
   * @returns {Promise<boolean>}
   */
  async isEmailVerified(): Promise<boolean> {
    const { data: user, error } = await this.supabase.auth.getUser();
    if (error) {
      console.error('Error fetching user data:', error);
      return false;
    }
    console.log(user.user)
    return user.user.email_confirmed_at ? true : false;
  }

  /**
   * Resends the verification email to the provided email address.
   * @param {string} email - The email address to resend the verification email to.
   * @returns {Promise<void>}
   */
  async resendVerificationEmail(email: string): Promise<void> {
    if (!email) {
      throw new Error('Email address is required to resend the verification email.');
    }

    const { error: resendError } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/verify`,
    });

    if (resendError) {
      console.error('Error resending verification email:', resendError);
      throw resendError;
    }
  }

  async verifyEmail() {
    // TODO: Implement email verification logic
    const { error } = await this.supabase.auth.getUser();
    if (error) throw error;
    // The user object should now reflect the verified status
  }

  async updateEmail(newEmail: string): Promise<void> {
    // TODO: Implement email update logic
    const { error } = await this.supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
  }

  /* Set password, used for when users have logged in via a social auth provider */
  async setPassword(newPassword: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({ password: newPassword });
    if (error) { throw error; }
    // Mark password as set, so we don't prompt user again
    const { error: metadataError } = await this.supabase.auth.updateUser({
      data: { has_password: true },
    });
    if (metadataError) {
      throw new Error('Failed to mark password as set');
    }
  }
  

  /* Updates the user's account password, if their current password is correct */
  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    // Fetch the current user's email
    const { data: user, error: userError } = await this.supabase.auth.getUser();
    if (userError || !user?.user?.email) {
      throw new Error('Failed to retrieve user email. Please try again.');
    }
  
    // Validate current password by re-authenticating
    const { error: authError } = await this.supabase.auth.signInWithPassword({
      email: user.user.email,
      password: currentPassword,
    });
    if (authError) {
      throw new Error('Current password is incorrect.');
    }
  
    // Proceed with updating the password
    const { error: updateError } = await this.supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      throw new Error(updateError.message || 'Failed to update password. Please try again.');
    }
  }

  async getUserBillingInfo(): Promise<{ data: any; error: any }> {
    const user = await this.getCurrentUser();
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    const { data, error } = await this.supabase
      .from('billing')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return { data, error };
  }


  async getBackupCodes(): Promise<string[]> {
    // TODO: Implement backup codes generation logic
    throw new Error('Backup codes not implemented');
  }

  async exportUserData(): Promise<any> {
    // TODO: Implement data export logic
    // This will depend on what data you're storing for users
    throw new Error('Data export not implemented');
  }

  async deleteAccount(): Promise<void> {
    // TODO: Implement account deletion logic
    const currentUser = await this.getCurrentUser();
    if (currentUser) {
      const { error } = await this.supabase.auth.admin.deleteUser(currentUser.id);
      if (error) throw error;
    }
  }
  
  async updateUserMetadata(metadata: { name?: string; avatar_url?: string }): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({ data: metadata });
    if (error) throw error;
  }

  /***********************************\
  |*********** MFA Methods ***********|
  \***********************************/

  async enableMFA(): Promise<{ qrCode: string; secret: string; factorId: string; challengeId: string }> {

    // Check if TOTP factor already exists
    const { data: factorList, error: listError } = await this.supabase.auth.mfa.listFactors();
    if (listError) throw listError;
    const existingTotpFactor = factorList.all.find(factor => factor.status === 'unverified');
    if (existingTotpFactor) {
      await this.resetMFA(existingTotpFactor.id);
    }

    // Enroll a TOTP factor
    const { data: factorData, error: enrollError } = await this.supabase.auth.mfa.enroll({
      factorType: 'totp',
    });
  
    if (enrollError) throw enrollError;
  
    if (factorData.type !== 'totp') {
      throw new Error('Failed to retrieve TOTP details for MFA setup.');
    }
    const { id: factorId, totp } = factorData;
  
    // Start the challenge to get the challengeId
    const { data: challengeData, error: challengeError } = await this.supabase.auth.mfa.challenge({ factorId });
    if (challengeError) throw challengeError;
  
    return {
      qrCode: totp.qr_code,
      secret: totp.secret,
      factorId,
      challengeId: challengeData.id,
    };
  }
  
  async disableMFA(): Promise<void> {
    // List all factors to find the TOTP factor
    const { data: factorList, error: listError } = await this.supabase.auth.mfa.listFactors();
    if (listError) throw listError;
    const totpFactor = factorList.all.find(factor => factor.status === 'verified' || factor.status === 'unverified');
    if (!totpFactor) {
      throw new Error('No active TOTP factor found to disable MFA.');
    }
    const { error: revokeError } = await this.supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
    if (revokeError) throw revokeError;
  }
  

  async isMFAEnabled(): Promise<boolean> {
    const { data, error } = await this.supabase.auth.mfa.listFactors();
    if (error) throw error;
    return data.totp.some(factor => factor.status === 'verified');
  }

  /* Resets MFA, either by ID, or by most recent */
  async resetMFA(id?: string): Promise<void> {
    if (id) {
      const { error: unenrollError } = await this.supabase.auth.mfa.unenroll({ factorId: id });
      if (unenrollError) throw unenrollError;
    } else {
      const { data, error } = await this.supabase.auth.mfa.listFactors();
      if (error) throw error;
      const unverifiedFactor = data.totp.find(factor => factor.status === 'unverified');
      if (unverifiedFactor) {
        const { error: unenrollError } = await this.supabase.auth.mfa.unenroll({ factorId: unverifiedFactor.id });
        if (unenrollError) throw unenrollError;
      }
    }
  }
  
  
  /**
   * Checks for any account issues, suggestions or warnings.
   * Returns a list of issues with description, severity levels and action function.
   * @returns 
   */
  async getAccountIssues(): Promise<{ type: 'warn' | 'error' | 'info'; message: string; action?: { label: string; route?: string; callback?: () => void } }[]> {
    const issues: { type: 'warn' | 'error' | 'info'; message: string; action?: { label: string; route?: string; callback?: () => void } }[] = [];
    
    try {
      const { data: user } = await this.supabase.auth.getUser();
      const session = await this.supabase.auth.getSession();
      const userInfo = await this.supabase.from('user_info').select('current_plan').single();
  
      // Check if session expired
      if (!session || !session.data.session) {
        issues.push({
          type: 'error',
          message: 'Your session has expired. Please sign in again.',
          action: { label: 'Sign Out', callback: () => this.signOut() },
        });
      }
  
      // Check if account locked
      if (user?.user?.user_metadata['locked']) {
        issues.push({
          type: 'error',
          message: 'Your account is locked. Please contact support.',
          action: { label: 'Contact Support', route: '/support' },
        }); 
      }
  
      // Check if email is missing
      if (!user?.user?.email) {
        issues.push({
          type: 'error',
          message: 'Your account is missing an email address. Please update your details.',
          action: { label: 'Update Details', route: '/settings/account' },
        });
      }
  
      // Check if profile is incomplete
      if (!user?.user?.user_metadata?.['name'] || !user?.user?.user_metadata?.['avatar_url']) {
        const nonEmailIdentities = user?.user?.identities?.filter(identity => identity.provider !== 'email') || [];
        if (nonEmailIdentities.length === 0) {
          issues.push({
            type: 'warn',
            message: 'Your profile is incomplete. Add more details to enhance your account.',
            action: { label: 'Update Profile', route: '/settings/account' },
          });
        }
      }
  
      // Check if MFA is not enabled (exclude social logins)
      if (!(await this.isMFAEnabled()) && user?.user?.identities?.[0]?.provider === 'email') {
        issues.push({
          type: 'warn',
          message: 'You have not enabled multi-factor authentication. Add an extra layer of security.',
          action: { label: 'Setup MFA', route: '/settings/account' },
        });
      }
  
      // Check if unverified OAuth accounts exist
      const unverifiedIdentities = user?.user?.identities?.filter((id) => id.provider && !user.user.email_confirmed_at) || [];
      if (unverifiedIdentities.length > 0) {
        issues.push({
          type: 'warn',
          message: 'One or more third-party accounts are unverified.',
          action: { label: 'Verify Accounts', route: '/settings/account' },
        });
      }
  
      // Plan-based warnings (for future)
      const { data: billingInfo, error: billingError } = await this.getUserBillingInfo();
      if (billingError) {
        throw billingError;
      }
      const currentPlan = billingInfo?.current_plan || 'free';

      if (currentPlan === 'free' || currentPlan === 'hobby') {
        // Get domain count
        let { count: domainCount } = await this.supabase.from('domains').select('id', { count: 'exact' });
        if (!domainCount) domainCount = 0;

        // Get domain limit for current plan
        const managedDomainLimit = features.domainLimit?.managed;
        const domainLimit = managedDomainLimit ? managedDomainLimit[currentPlan as keyof typeof managedDomainLimit] || 1000 : 1000;
        
        // Check if domain limit exceeded or approaching
        if (domainCount > domainLimit) {
          issues.push({
            type: 'error',
            message: 'You have exceeded the limit of domains on your current plan. Remove some domains, or upgrade to continue using.',
            action: { label: 'Upgrade Plan', route: '/settings/upgrade' },
          });
        } else if (domainCount > (domainLimit - 3)) {
          issues.push({
            type: 'info',
            message: 'You are approaching the limit of the free plan, consider upgrading to add more domains and access additional features.',
            action: { label: 'Upgrade Plan', route: '/settings/upgrade' },
          });
        }
      }
    } catch (error) {
      this.errorHandler.handleError({ error, message: 'Failed to fetch account issues', location: 'SupabaseService.getAccountIssues' });
    }
    
    // Sort issues by severity: error, warn, info
    issues.sort((a, b) => {
      const severityOrder = { error: 0, warn: 1, info: 2 };
      return severityOrder[a.type] - severityOrder[b.type];
    });
    return issues;
  }
  
}
