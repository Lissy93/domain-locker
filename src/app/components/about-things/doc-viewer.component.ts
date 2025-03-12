import { Component, Input, HostListener, ViewEncapsulation } from '@angular/core';
import { ContentFile } from '@analogjs/content';
import { Observable } from 'rxjs';
import { MarkdownComponent } from '@analogjs/content';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { MetaTagsService } from '~/app/services/meta-tags.service';
import { CommonModule, NgIf } from '@angular/common';

export interface DocAttributes {
  title: string;
  slug: string;
  description: string;
  coverImage?: string;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  category?: string;
  noShowInContents?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-docs-viewer',
  imports: [CommonModule, NgIf, MarkdownComponent, PrimeNgModule],
  template: `
  <section class="flex flex-row-reverse items-start gap-4 h-full mx-auto my-4 flex-wrap md:flex-nowrap min-h-[105vh]">
    <article *ngIf="doc" class="p-card p-4 flex-1 h-full min-h-64 max-w-[60rem] w-2">
      <h2 class="text-3xl text-default opacity-100">{{ doc.attributes.title }}</h2>
      <analog-markdown class="block max-w-[59rem]" [content]="doc.content"></analog-markdown>
    </article>

    <div class="relative h-full min-h-64 min-w-64 w-full md:w-fit mr-0 md:mr-4">
      <nav class="p-card py-4 relative md:fixed sticky-nav" [style.top]="navTop">
        <a [routerLink]="['/about', categoryName]" class="no-underline text-default">
          <h2 class="capitalize mx-4">{{ categoryName }} Docs</h2>
        </a>
        <ul class="list-none p-0 mx-0 mt-4 flex flex-col">
          <li *ngFor="let file of allDocs; index as index" class="border-x-0 border-b-0 border-t-2 border-solid border-surface-200">
            <a
              *ngIf="!file.attributes.noShowInContents"
              [routerLink]="['/about', categoryName, file.slug]"
              pTooltip="{{ file.attributes.description }}"
              showDelay="300"
              class="no-underline py-2 block px-4 hover:bg-surface-100 transition-all duration-200"
              [ngClass]="{ 'text-default font-bold': file.slug === doc?.slug, 'text-primary': file.slug !== doc?.slug}"
            >
              <span class="opacity-70 text-default font-normal">{{index + 1}}. </span>
              {{ file.attributes.title }}
            </a>
          </li>
        </ul>
        <a routerLink="/about" class="w-full flex">
          <p-button
            label="All Docs"
            class="mx-auto no-underline"
            severity="secondary"
            [outlined]="true"
            size="small"
            icon="pi pi-arrow-left"
          />
        </a>
      </nav>
    </div>
  </section>
  `,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['../../styles/prism.css'],
  styles: [`
    h2 { opacity: 70%; }
    h3 { opacity: 90%; margin-top: 1rem !important; }
    hr {
      border-color: var(--surface-50);
      margin-bottom: 2rem;
    }
    img { border-radius: 4px; display: flex; margin: 0 auto; max-width: 100%; }
    .sticky-nav { transition: top 0.3s ease; }
  `]
})
export class DocsViewerComponent {
  /** The doc$ to display. If it's null or never resolves, we'll treat it as 'not found'. */
  @Input() doc$!: Observable<ContentFile<DocAttributes | Record<string, never>>>;

  /** The array of docs for the same category, used for listing. */
  @Input() allDocs: ContentFile<DocAttributes>[] = [];

  /** The name of the category (e.g. 'legal', 'blog'), for building links. */
  @Input() categoryName: string = '';

  doc: ContentFile<DocAttributes | Record<string, never>> | null = null;

  navTop = 'unset'; // default top offset

  constructor(private metaTagsService: MetaTagsService) {}

  ngOnInit() {
    this.doc$.subscribe(doc => {
      // Set current doc when it resolves
      this.doc = doc;
      // If doc has attributes, then get them for meta and JSON-LD content
      if (doc?.attributes) {
        const { title, description, coverImage, author, publishedDate, modifiedDate, slug } = doc.attributes;

        // Set meta tags
        this.metaTagsService.setCustomMeta(title, description, undefined, coverImage || this.getFallbackImage(title));
        
        // Set JSON-LD structured data
        this.metaTagsService.addStructuredData('article', {
          title: title,
          description: description,
          coverImage: coverImage || this.getFallbackImage(title),
          author: author || 'Domain Locker Team',
          publishedDate: publishedDate || new Date().toISOString(),
          modifiedDate: modifiedDate || publishedDate || new Date().toISOString(),
          slug: slug,
          category: this.categoryName,
        });
      }
    });
  }

  /** Called on window scroll. If user scrolled > 7rem => fix nav top at 7rem. Otherwise 0. */
  @HostListener('window:scroll')
  onWindowScroll() {
    const scrollY = window.scrollY;
    const sevenRemInPx = 112; // approx 7rem if root font-size = 16px
    this.navTop = scrollY > sevenRemInPx ? '1rem' : '9rem';
  }

  getFallbackImage(title: string) {
    const encodedTitle = encodeURIComponent(title);
    return `https://dynamic-og-image-generator.vercel.app/api/generate?title=${encodedTitle}`
    + ' &author=Domain+Locker&websiteUrl=domain-locker.com&avatar=https%3A%2F%2Fdomain-locker'
    + '.com%2Ficons%2Fandroid-chrome-maskable-192x192.png&theme=dracula';
  }
}
