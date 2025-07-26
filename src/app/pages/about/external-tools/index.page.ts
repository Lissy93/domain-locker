import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { MetaTagsService } from '~/app/services/meta-tags.service';
import { sections } from '../data/useful-links';

@Component({
  selector: 'app-external-tools',
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './index.page.html',
})
export default class ExternalToolsPage implements OnInit {
  public sections = sections;

  constructor(private metaTagsService: MetaTagsService) {}

  makeId(title: string) {
    return title.toLowerCase().replace(/\s/g, '-');
  }

    ngOnInit() {
    this.metaTagsService.setCustomMeta(
      'Domain Tools and Resources',
      'A directory of free, useful tools and resources for domain owners, including WHOIS lookups, DNS checks, SSL validation, and more.',
    );
  }
}
