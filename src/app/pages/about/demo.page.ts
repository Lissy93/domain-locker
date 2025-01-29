import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { DemoComponent } from '~/app/components/home-things/demo/demo.component';
import { CtaComponent } from '~/app/components/home-things/cta/cta.component';

@Component({
  selector: 'app-demo-page',
  template: `
    <h1 class="my-4 text-2xl">Domain Locker Demos</h1>
    <app-demo />
    <p-card styleClass="mt-4 mx-2 mb-0">
      <h3>About the Demo</h3>
      <p class="m-0">
        Try before you buy (or self-host). The live demo will give you an idea of what Domain Locker can do for you.
      </p>
      <p class="text-sm text-orange-400 my-2 opacity-80">
        Note that any data written to the demo database will be reset every 24 hours.  
        <br />
        Some features on the live demo have been disabled for security reasons.
      </p>
    </p-card>
    <p-divider />
    <app-cta />
  `,
  standalone: true,
  imports: [CommonModule, PrimeNgModule, DemoComponent, CtaComponent ]
})
export default class DemoPage {
  // Your component logic here
}
