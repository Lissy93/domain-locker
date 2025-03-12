import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { supportContent } from '~/app/pages/about/data/support-links';

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './index.page.html',
  styles: [``],
})
export default class SelfHostedSupportPage {
  public content = supportContent;
  public hideTitle = false;
}
