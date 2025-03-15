import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { DbDomain, Tag } from '~/app/../types/Database';
import { TagPickListComponent } from '~/app/components/forms/tag-picklist/tag-picklist.component';
import DatabaseService from '~/app/services/database.service';
import { ErrorHandlerService } from '~/app/services/error-handler.service';

@Component({
  standalone: true,
  selector: 'app-tag-edit',
  imports: [CommonModule, PrimeNgModule, TagPickListComponent],
  template: `
  <h2 class="mb-4 ml-4">Add Domains: {{ tagName }}</h2>
  <div *ngIf="tag && tag.id" class="p-card p-4 m-4">
    <app-domain-tag-picklist [tagId]="tag.id" ($afterSave)="afterSave()" />
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
    private errorHandler: ErrorHandlerService,
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
        this.errorHandler.handleError({
          message: 'Failed to load tag details',
          error,
          showToast: true,
          location: 'TagDomainsPageComponent.loadTag',
        });
        this.loading = false;
      }
    });
  }

  afterSave() {
    if (this.tagName) {
      this.router.navigate([`/assets/tags/${this.tagName}`]);
    } else {
      this.router.navigate([`/assets/tags`]);
    } 
  }

}
