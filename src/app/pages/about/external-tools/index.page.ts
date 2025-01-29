import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { sections } from '../data/useful-links';

@Component({
  selector: 'app-external-tools',
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './index.page.html',
})
export default class FeaturesPage {
  public sections = sections;

  makeId(title: string) {
    return title.toLowerCase().replace(/\s/g, '-');
  }
}
