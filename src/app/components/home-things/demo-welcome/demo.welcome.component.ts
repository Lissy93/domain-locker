import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';

@Component({
  selector: 'app-demo-welcome',
  template: `
  <p-messages severity="info" *ngIf="!isHidden">
    <ng-template pTemplate>
      <div class="relative">
        <h3 class="m-0">
          Demo Instance
        </h3>
        <p class="m-0 mt-2">
          Welcome to the Domain Locker live demo!
          Below you can see some example domains. In a real instance, you would
          add your domains (that you own).
        </p>
        <p class="m-0 mt-2">
          The data is real, and updated live. Try clicking a domain to analyse it,
          or browse through the auto-fetched assets, view stats, see the change
          history or checkout the website monitor.
        </p>
        <p class="m-0">
          Note that some features have been disabled on the demo instance,
          and much of the data is reset every night.
        </p>
        <p class="m-0 mt-2">
          When you're ready to get started, head back to
          <a href="https://domain-locker.com">domain-locker.com</a>, and sign up!
        </p>
        <button pButton
          (click)="hideDemoWelcome()"
          type="button"
          icon="pi pi-times"
          label="Dismiss"
          size="small"
          class="p-button-info float-right md:mt-[-2rem]"></button>
      </div>
    </ng-template>
  </p-messages>
`,
  standalone: true,
  imports: [CommonModule, PrimeNgModule]
})
export class DemoWelcomeComponent  {
  isHidden: boolean = false;

  ngOnInit(): void {
    if (this.isBrowser() && localStorage.getItem('hideDemoWelcome') === 'true') {
      this.isHidden = true;
      return;
    }
  }

  hideDemoWelcome(): void {
    if (this.isBrowser()) {
      localStorage.setItem('hideDemoWelcome', 'true');
    }
    this.isHidden = true;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}
