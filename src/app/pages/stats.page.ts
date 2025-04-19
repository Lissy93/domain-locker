import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { ExtendedMenuItem, statsLinks } from '~/app/constants/navigation-links';
import { FeatureService } from '~/app/services/features.service';
import { FeatureNotEnabledComponent } from '~/app/components/misc/feature-not-enabled.component';

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule, FeatureNotEnabledComponent],
  selector: 'stats-index-page',
  templateUrl: './stats/index.page.html',
  styles: [`
    ::ng-deep .content-container {
      max-width: 1600px;
    }
  `],
})
export default class StatsIndexPage implements OnInit, OnDestroy {
  @ViewChild('sidebarNav', { static: false }) sidebarNav!: ElementRef;

  items: ExtendedMenuItem[] | undefined;
  statsEnabled$ = this.featureService.isFeatureEnabled('visualStats');
  hideSideBar = false;
  hideTextLabels = false;

  private resizeObserver!: ResizeObserver;
  private isBrowser = false;   // Keep track if we’re in the browser

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private featureService: FeatureService,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit() {
    this.items = statsLinks as ExtendedMenuItem[];
    this.hideSideBar = (this.router.url === '/stats');

    // If route changes, update whether sidebar is hidden
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.hideSideBar = (event.urlAfterRedirects === '/stats');
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit() {
    // Only do ResizeObserver in the browser
    if (!this.isBrowser) return;

    // Slightly delay the creation so the DOM is stable
    setTimeout(() => {
      this.resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          if (entry.contentRect.width < 150) {
            this.hideTextLabels = true;
          } else {
            this.hideTextLabels = false;
          }
          this.cdr.detectChanges();
        }
      });
      if (this.sidebarNav?.nativeElement) {
        this.resizeObserver.observe(this.sidebarNav.nativeElement);
      }
    }, 0);
  }

  ngOnDestroy() {
    if (this.isBrowser && this.resizeObserver && this.sidebarNav?.nativeElement) {
      this.resizeObserver.unobserve(this.sidebarNav.nativeElement);
      this.resizeObserver.disconnect();
    }
  }

  isActive(link: string): boolean {
    return this.router.url === link;
  }
}
