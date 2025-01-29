import { Component, Input, OnDestroy, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';

@Component({
  standalone: true,
  selector: 'loading',
  imports: [CommonModule, PrimeNgModule],
  template: `
    <div class="flex justify-center flex-col items-center h-full min-h-80 gap-4 w-fit mx-auto scale-1 md:scale-125 xl:scale-150 mt-2 md:mt-4 lg:mt-8 xl:mt-16 animate-fade-in">
      <p class="m-0 text-4xl font-extrabold text-default tracking-widest">
        {{ loadingTitle || 'Initializing' }}
      </p>
      <div class="w-28 flex gap-2">
        <div class="w-2 h-4 rounded-full bg-primary animate-fade-bounce"></div>
        <div class="w-2 h-4 rounded-full bg-primary animate-fade-bounce [animation-delay:-0.3s]"></div>
        <div class="w-2 h-4 rounded-full bg-primary animate-fade-bounce [animation-delay:-0.5s]"></div>
        <div class="w-2 h-4 rounded-full bg-primary animate-fade-bounce [animation-delay:-0.8s]"></div>
      </div>

      <p *ngIf="loadingDescription" class="m-0 mt-4 text-lg text-surface-400 text-center">
        {{ loadingDescription }}
      </p>
      <p *ngIf="!loadingDescription" class="m-0 mt-4 text-lg text-surface-400 text-center">
        We're just getting everything ready for you.<br />
        This shouldn't take a moment...
      </p>

      <div *ngIf="showError" class="text-center">
        <p class="m-0 text-xs text-surface-400">It shouldn't be taking this long...</p>
        <p class="m-0 text-lg text-red-400">Something might have gone wrong</p>
      </div>

      <div *ngIf="showError" class="flex gap-2">
        <a routerLink="/"><p-button size="small" label="Home" severity="primary" icon="pi pi-home" /></a>
        <p-button size="small" label="Reload" severity="secondary" icon="pi pi-sync" (click)="reloadPage()" />
      </div>
    </div>
  `,
})
export class LoadingComponent implements AfterViewInit, OnDestroy {
  @Input() loadingTitle?: string;
  @Input() loadingDescription?: string;
  public showError: boolean = false;
  private errorTimeout: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object){}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.errorTimeout = window.setTimeout(() => {
        this.showError = true;
      }, 8500);
    }
  }

  ngOnDestroy() {
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }
  }

  reloadPage() {
    window.location.reload();
  }
}
