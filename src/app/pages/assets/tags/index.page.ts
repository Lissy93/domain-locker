import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { Tag } from '~/app/../types/Database';
import DatabaseService from '~/app/services/database.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TagEditorComponent } from '~/app/components/forms/tag-editor/tag-editor.component';

@Component({
  standalone: true,
  selector: 'app-tags-index',
  imports: [CommonModule, RouterModule, PrimeNgModule, TagEditorComponent],
  templateUrl: './index.page.html',
  styleUrl: './tags.scss'
})
export default class TagsIndexPageComponent implements OnInit {
  tags: (Tag & { domainCount: number })[] = [];
  loading: boolean = true;
  addTagDialogOpen: boolean = false;

  constructor(
    private databaseService: DatabaseService,
    private messageService: MessageService,
    private router: Router,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.loadTags();
  }

  loadTags() {
    this.loading = true;
    this.databaseService.instance.tagQueries.getTags().subscribe({
      next: (tags) => {
        this.tags = tags.map(tag => ({ ...tag, domainCount: 0 }));
        this.loadDomainCounts();
      },
      error: (error) => {
        console.error('Error fetching tags:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load tags'
        });
        this.loading = false;
      }
    });
  }

  loadDomainCounts() {
    this.databaseService.instance.tagQueries.getDomainCountsByTag().subscribe({
      next: (counts) => {
        this.tags = this.tags.map(tag => ({
          ...tag,
          domainCount: counts[tag.name] || 0
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching domain counts:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load domain counts'
        });
        this.loading = false;
      }
    });
  }

  showAddTagDialog() {
    this.addTagDialogOpen = true;
  }

  afterAddNewTag() {
    this.addTagDialogOpen = false;
    this.loadTags();
  }

  deleteTag(tag: Tag) {
    this.confirmationService.confirm({
      message: `
        Are you sure you want to delete the "${tag.name}" tag?<br>
        <b class="text-red-500">This action cannot be undone.</b><br>
        <p class="text-surface-400 text-sm">Note that this will not affect the domains associated with this tag,<br>
        but they will loose their association.</p>
      `,
      header: `Tag Deletion Confirmation: ${tag.name}`,
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-secondary p-button-sm',
      accept: () => {
        this.databaseService.instance.tagQueries.deleteTag(tag.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `Tag "${tag.name}" deleted successfully.`
            });
            this.loadTags();
          },
          error: (error) => {
            console.error('Error deleting tag:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete the tag'
            });
          }
        });
      }
    });
  }
}
