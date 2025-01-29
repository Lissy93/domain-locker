import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-cta',
  standalone: true,
  imports: [CommonModule, PrimeNgModule, RouterModule],
  template: `
    <div class="p-card py-3 px-4 my-4">
      <h3 class="my-1 font-semmibold">Ready to get started?</h3>
      <p class="my-2">
        Domain Locker is easy to use, and our free plan will get you up and running in no time.
        Alternatively, check out our GitHub repo to run on your own infrastructure.
      </p>
      <div class="flex justify-center sm:justify-end w-full flex-wrap gap-3 my-3">
        <a href="https://github.com/lissy93/domain-locker" target="_blank" rel="noopener noreferrer">
          <p-button 
            label="View on GitHub" 
            severity="secondary" 
            icon="pi pi-github" 
            class="min-w-48" 
            styleClass="w-full" 
          ></p-button>
        </a>
        <p-button
          routerLink="/login"
          [queryParams]="{ newUser: 'true' }"
          label="Get Started" 
          class="min-w-48" 
          icon="pi pi-arrow-circle-right" 
          styleClass="w-full" 
        ></p-button>
      </div>
    </div>
  `,
  styles: []
})
export class CtaComponent {}
