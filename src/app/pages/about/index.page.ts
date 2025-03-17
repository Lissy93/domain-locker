import { Component } from '@angular/core';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { CommonModule } from '@angular/common';
import { aboutPages } from '~/app/pages/about/data/about-page-list';
import { injectContentFiles } from '@analogjs/content';
import { DocAttributes } from '~/app/components/about-things/doc-viewer.component';
import { DlIconComponent } from '~/app/components/misc/svg-icon.component';

@Component({
  standalone: true,
  selector: 'about-index-page',
  templateUrl: './about.page.html',
  imports: [CommonModule, PrimeNgModule, DlIconComponent],
})
export default class AboutPageComponent {
  sections = aboutPages;

  readonly autoLinks: { [key: string]: any } = {
    legal: injectContentFiles<DocAttributes>((contentFile) =>
      contentFile.filename.includes('/legal')
    ),
    developing: injectContentFiles<DocAttributes>((contentFile) =>
      contentFile.filename.includes('/developing/')
    ),
  };
  
  makeId(title: string): string {
    return title.toLowerCase().replace(/ /g, '-');
  }
}
