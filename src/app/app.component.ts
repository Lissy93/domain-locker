// Angular
import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';

// Dependencies
import { MessageService, ConfirmationService } from 'primeng/api';
import { filter, Subscription } from 'rxjs';
import { NgApexchartsModule } from 'ng-apexcharts';

// PrimeNG module importing required components
import { PrimeNgModule } from '~/app/prime-ng.module';

// Furniture Components
import { NavbarComponent } from '~/app/components/navbar/navbar.component';
import { FooterComponent } from '~/app/components/footer/footer.component';
import { LoadingComponent } from '~/app/components/misc/loading.component';
import { BreadcrumbsComponent } from '~/app/components/misc/breadcrumbs.component';

// Services
import { ThemeService } from '~/app/services/theme.service';
import { GlobalMessageService } from '~/app/services/messaging.service';
import { SupabaseService } from '~/app/services/supabase.service';
import { HitCountingService } from '~/app/services/hit-counting.service';
import { ErrorHandlerService } from '~/app/services/error-handler.service';
import { TranslationService } from '~/app/services/translation.service';
import { AccessibilityService } from '~/app/services/accessibility-options.service';
import { EnvService } from '~/app/services/environment.service';
import { FeatureService } from '~/app/services/features.service';
import { MetaTagsService } from '~/app/services/meta-tags.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    PrimeNgModule,
    NgApexchartsModule,
    CommonModule,
    NavbarComponent,
    FooterComponent,
    LoadingComponent,
    BreadcrumbsComponent,
  ],
  providers: [MessageService, ErrorHandlerService],
  template: `
    <!-- Navbar -->
    <app-navbar />
    <!-- Main content container -->
    <div class="content-container" [ngClass]="{ 'full': isFullWidth }">
      <!-- While initializing, show loading spinner -->
      <loading *ngIf="loading" />
      <!-- Create router outlet -->
      <breadcrumbs *ngIf="!loading && pagePath" [pagePath]="pagePath" />
      <!-- Router outlet for main content -->
      <router-outlet *ngIf="!loading" />
      <!-- Global components -->
      <p-scrollTop />
      <p-toast />
      <p-confirmDialog />
    </div>
    <!-- Footer -->
    <app-footer [big]="isBigFooter" />
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    ::ng-deep app-root {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
  `],
})
export class AppComponent implements OnInit, OnDestroy {
  private subscription: Subscription | undefined;
  private publicRoutes =  new Set(['/', '/home', '/about', '/login']);
  private fullWidthRoutes: string[] = ['/settings', '/stats'];

  public loading: boolean = true;
  public pagePath: string = '';
  public isFullWidth: boolean = false;
  public isBigFooter: boolean = false;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private supabaseService: SupabaseService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private globalMessageService: GlobalMessageService,
    private errorHandler: ErrorHandlerService,
    public _themeService: ThemeService,
    public _hitCountingService: HitCountingService,
    private _translationService: TranslationService,
    private accessibilityService: AccessibilityService,
    private environmentService: EnvService,
    private featureService: FeatureService,
    private metaTagsService: MetaTagsService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit() {

    // Set meta tags on route change
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((event) => {
        const navEndEvent = event as NavigationEnd;
        this.metaTagsService.setRouteMeta(navEndEvent.urlAfterRedirects);
    });

    // Check auth state
    if (isPlatformBrowser(this.platformId)) {
      // Listen for route changes (on browser only)
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          const currentRoute = event.urlAfterRedirects || event.url;
          this.pagePath = currentRoute;

          // Configuration for docs pages (at /about)
          if (currentRoute.startsWith('/about')) {
            this.checkIfDocsDisabled(currentRoute);
            this.isBigFooter = true;
          } else {
            this.isBigFooter = false;
          }

          // Some pages should be full wider (like /settings or /stats), we add a class if they are active
          this.isFullWidth = this.fullWidthRoutes.some(route => currentRoute.includes(route));

          // Public route
          if (this.publicRoutes.has(currentRoute) || currentRoute.startsWith('/login') || currentRoute.startsWith('/about')) {
            this.loading = false;
            this.metaTagsService.allowRobots(true);
            return; // No auth needed for public routes
          }

          // Private route (auth required and bot no index)
          this.metaTagsService.allowRobots(false);

          // Auth needed for current route, check if user authenticated
          this.checkAuthentication().then(() => {
            this.loading = false;
            this.cdr.detectChanges();
          }).catch(async (error) => {
            this.loading = false;
            this.cdr.detectChanges();
            this.errorHandler.handleError({
              error,
              message: 'Unable to validate auth state',
              showToast: true,
              location: 'app.component',
            });
          });
        }
      });
    }
    // Initialize the global message service for showing toasts
    this.subscription = this.globalMessageService.getMessage().subscribe(message => {
      if (message) {
        this.messageService.add(message);
      } else {
        this.messageService.clear();
      }
    });

    // Apply accessibility classes based on user preference
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.accessibilityService.applyAccessibilityClasses(), 0);
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /* Check if user is authenticated, and take appropriate action */
  private async checkAuthentication(): Promise<void> {

    // Cancel if Supabase auth isn't enabled or setup
    if (!this.environmentService.isSupabaseEnabled()) {
      return;
    }

    try {
      // Check if authenticated
      const isAuthenticated = await this.supabaseService.isAuthenticated();
      if (!isAuthenticated) { // Not authenticated, redirect to login
        await this.redirectToLogin();
        return;
      }

      // Authenticated, now check if MFA is required
      const hasMFA = await this.supabaseService.isMFAEnabled();
      if (hasMFA) {
        const { currentLevel } = await this.supabaseService.getAuthenticatorAssuranceLevel();
        if (currentLevel !== 'aal2') {
          await this.router.navigate(['/login'], {
            queryParams: { requireMFA: 'true' }
          });
        }
      }
      return Promise.resolve();
    } catch (error) {
      this.errorHandler.handleError({
        error,
        message: 'Unable to verify auth status, please log in again',
        showToast: true,
        location: 'app.component',
      });
      throw error;
    }
  }

  private redirectToLogin() {
    this.router.navigate(['/login']).then(() => {
      this.loading = false;
    });
  }

    /* Check if documentation enabled before navigating to any /about page */
    private async checkIfDocsDisabled(docsPath?: string): Promise<void> {
      if (await this.featureService.isFeatureEnabledPromise('disableDocs')) {
        // Docs disabled, show warning and navigate back to home
        this.globalMessageService.showWarn(
          'Docs Disabled',
          'Documentation has not been enabled on this instance, you can view up-to-date content at domain-locker.com',
        );
        this.router.navigate(['/']);

        // Give user option to view on domain-locker.com
        if (docsPath) {
          this.confirmationService.confirm({
            header: 'Documentation not Enabled',
            message: 'Would you want to view this page on the Domain Locker website?',
            icon: 'pi pi-book',
            acceptIcon:'pi pi-reply mr-2',
            rejectIcon:'pi pi-arrow-left mr-2',
            acceptButtonStyleClass:'p-button-sm p-button-primary p-button-text',
            rejectButtonStyleClass:'p-button-sm p-button-secondary p-button-text p-button-text',
            closeOnEscape: true,
            accept: () => {
              window.open(`https://domain-locker.com/${docsPath}`, '_blank');
            },
          });
        }
      }
    }
}
