import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';

@Component({
  selector: 'app-demo',
  template: `
  <div class="flex flex-wrap md:flex-nowrap w-full px-2 h-full gap-4">
    <div class="p-card flex-1 py-4 px-3">
      <h4>Live Demo</h4>
      <p>
        A live demo is deployed to
        <a href="https://demo.domain-locker.com" class="text-primary">demo.domain-locker.com</a>.
      </p>
      <h5>Credentials</h5>
        <ul class="m-0 pl-3">
          <li>Username: <code>demo&#64;domain-locker.com</code></li>
          <li>Password: <code>domainlocker</code></li>
        </ul>
        <a href="https://demo.domain-locker.com">
          <p-button label="Visit Demo" class="float-right" icon="pi pi-desktop"></p-button>
        </a>
    </div>
    <div class="p-card flex-1 py-4 px-3">
      <h4>Video Demo</h4>
      <p>TODO</p>
      <a href="#">
        <p-button label="Watch Video" class="float-right" icon="pi pi-video"></p-button>
      </a>
    </div>
  </div>
`,
  standalone: true,
  imports: [CommonModule, PrimeNgModule]
})
export class DemoComponent  {}
