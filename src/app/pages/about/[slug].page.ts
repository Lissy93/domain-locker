import { ContentFile, injectContent, injectContentFiles, MarkdownComponent } from '@analogjs/content';
import { CommonModule, NgIf } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { aboutPages, AboutLink } from './data/about-page-list';
import { ActivatedRoute } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { PrimeNgModule } from '~/app/prime-ng.module';

import NotFoundPage from '~/app/pages/[...not-found].page'
import { MetaTagsService } from '~/app/services/meta-tags.service';

export interface DocAttributes {
  title: string;
  slug: string;
  description: string;
  coverImage: string;
}

@Component({
  standalone: true,
  imports: [MarkdownComponent, NgIf, CommonModule, PrimeNgModule, NotFoundPage],
  templateUrl: './[slug].page.html',
  styleUrls: ['../../styles/prism.css'],
  encapsulation: ViewEncapsulation.None,
  styles: [`
    h2 { opacity: 70%; }
    h3 { opacity: 90%; margin-top: 1rem !important; }
    hr {
      border-color: var(--surface-50);
      margin-bottom: 2rem;
    }
    img { border-radius: 4px; display: flex; margin: 0 auto; opacity: 90%; max-width: 100%; }
  `],
})
export default class DocsComponent implements OnInit {

  public aboutPages = aboutPages;
  public currentPage = '';

  public docsNotFound: boolean = false;
  public linksTitle: string | null = null;
  public links: AboutLink[] = [];

  readonly doc$: Observable<ContentFile | null> = injectContent<DocAttributes>({
    param: 'slug',
    subdirectory: 'docs',
  }) as Observable<ContentFile | null>;
  public doc: ContentFile | null = null;

  readonly docs = injectContentFiles<DocAttributes>((contentFile) => {
    return contentFile.filename.includes('/src/content/docs/')
  });

  constructor(
    private route: ActivatedRoute,
    private metaTagsService: MetaTagsService,
  ) {}
  
  async ngOnInit(): Promise<void> {
    this.doc$.subscribe(doc => {
      if (!doc?.slug) {
        this.docsNotFound = true;
      } else {
        // Set current doc, and apply meta tags
        this.doc = doc;
        if (doc.attributes) {
          this.metaTagsService.setCustomMeta(
            doc.attributes['title'],
            doc.attributes['description'],
            doc.attributes['keywords'],
          );
        }
      }
    });

    this.route.params.pipe(
      switchMap(params => {
        this.currentPage = params['slug'];
        this.fondLinks(this.currentPage);
        return params['slug'];
      })
    ).subscribe(slug => {
      this.currentPage = slug as string;
    });
  }

  makeId(title: string): string {
    return title.toLowerCase().replace(/ /g, '-');
  }

  fondLinks(title: string): AboutLink[] | null {
    this.links = [];

    // Find list of docs which are in the current content directory
    this.docs.forEach(doc => {
      if (doc.filename.includes(`/${this.currentPage}/`)) {
        this.links.push({
          title: doc.attributes.title,
          description: doc.attributes.description,
          icon: '',
          link: `/about/${this.currentPage}/${doc.attributes.slug}`
        });
      }
    });

    // Find list of docs which are defined in the about-page-list.ts
    const foundSection = this.aboutPages.find(page => this.makeId(page.title) === this.makeId(title));
    if (foundSection) {
      this.linksTitle = foundSection.title;
      this.links = [...this.links, ...foundSection.links];
      this.metaTagsService.setCustomMeta(foundSection.title);
      return foundSection.links;
    }
    return null;
  }

}
