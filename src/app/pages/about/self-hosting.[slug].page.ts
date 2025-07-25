import { injectContent, injectContentFiles } from '@analogjs/content';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { DocsViewerComponent, DocAttributes } from '~/app/components/about-things/doc-viewer.component';
import { SponsorMessageComponent } from '~/app/components/sponsor-thanks/sponsor-thanks.component';

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule, DocsViewerComponent, SponsorMessageComponent],
  template: `
  <app-docs-viewer [doc$]="doc$" [allDocs]="files" [categoryName]="category" />
  <app-sponsor-message />
  `,
})
export default class DocsComponent {
  // The subdirectory for the docs
  public category = 'self-hosting';
  // Fetch the current *.md file and attributes
  readonly doc$ = injectContent<DocAttributes>({
    param: 'slug',
    subdirectory: `docs/${this.category}`,
  });
  // Fetch all the files in the same subdirectory
  readonly files = injectContentFiles<DocAttributes>((contentFile) =>
    contentFile.filename.includes(`/${this.category}/`)
  );
}
