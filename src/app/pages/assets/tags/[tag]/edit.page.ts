import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { DbDomain, Tag } from '~/app/../types/Database';
import { DomainCollectionComponent } from '~/app/components/domain-things/domain-collection/domain-collection.component';
import { TagEditorComponent } from '~/app/components/forms/tag-editor/tag-editor.component';
import DatabaseService from '~/app/services/database.service';
import { MessageService } from 'primeng/api';

@Component({
  standalone: true,
  selector: 'app-tag-edit',
  imports: [CommonModule, PrimeNgModule, DomainCollectionComponent, TagEditorComponent],
  template: `
  <h2 class="mb-4 ml-4">Edit Tag: {{ tagName }}</h2>
  <div class="p-card p-4 m-4">
    <app-tag-editor [tag]="tag" ($afterSave)="afterSave($event)" />
  </div>`,
})
export default class TagDomainsPageComponent implements OnInit {
  tagName: string = '';
  domains: DbDomain[] = [];
  loading: boolean = true;
  dialogOpen: boolean = false;
  tag: Tag | any = {};

  constructor(
    private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private messageService: MessageService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.tagName = params['tag'];
      this.loadTag();
    });
  }

  loadTag() {
    this.loading = true;
    this.databaseService.instance.tagQueries.getTag(this.tagName).subscribe({
      next: (tag) => {
        this.tag = tag;
        if (tag.icon && !tag.icon.includes('/')) {
          this.tag.icon = `mdi/${tag.icon}`;
        }
      },
      error: (error) => {
        console.error('Error fetching tag details:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load tag details'
        });
        this.loading = false;
      }
    });
  }

  afterSave() {
    this.router.navigate([`/assets/tags/${this.tag.name}/add-domains`]);
  }

}
