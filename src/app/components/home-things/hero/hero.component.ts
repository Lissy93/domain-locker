import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, PrimeNgModule, RouterModule],
  templateUrl: './hero.component.html',
  styles: []
})
export class HeroComponent {
  features = [
    { icon: 'pi-lock', text: 'Track all your domains across registrars from one simple dashboard' },
    { icon: 'pi-sparkles', text: 'Detailed metrics and live data visualizations for each domain' },
    { icon: 'pi-send', text: ' Get alerted of upcoming domain expirations or configuration updates' },
    { icon: 'pi-wave-pulse', text: 'Performance, security and configuration monitoring for each domain' },
    { icon: 'pi-check', text: 'And so much more!' },
  ];
}
