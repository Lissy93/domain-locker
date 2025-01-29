import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { FeaturesGridComponent } from '~/app/components/home-things/feature-grid/feature-grid.component';
import { CtaComponent } from '~/app/components/home-things/cta/cta.component';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, PrimeNgModule, FeaturesGridComponent, CtaComponent],
  templateUrl: './index.page.html',
})
export default class FeaturesPage {}
