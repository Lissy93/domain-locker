import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import DatabaseService from '~/app/services/database.service';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { Router } from '@angular/router';

import { PrimeNgModule } from '~/app/prime-ng.module';
import { ContextMenu } from 'primeng/contextmenu';

@Component({
  standalone: true,
  selector: 'app-tag-grid',
  templateUrl: './tag-grid.component.html',
  styleUrls: ['../../pages/assets/tags/tags.scss'],
  imports: [CommonModule, PrimeNgModule]
})
export class TagGridComponent implements OnInit {
  public tags: Array<any> = [];
  public loading: boolean = true;
  public contextMenuItems: MenuItem[] = [];
  private selectedTag: any;
  @Input() public miniGrid: boolean = false;
  @ViewChild('menu') menu: ContextMenu | undefined;

  constructor(
    private databaseService: DatabaseService,
    private messageService: MessageService,
    private router: Router,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit() {
    this.loadTagsWithCounts();
    this.initializeContextMenu();
  }

  loadTagsWithCounts() {
    this.loading = true;
    this.databaseService.instance.tagQueries.getTagsWithDomainCounts().subscribe({
      next: (tagsWithCounts) => {
        this.tags = tagsWithCounts;
        this.loading = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load tags with domain counts'
        });
        this.loading = false;
      }
    });
  }

  initializeContextMenu() {
    this.contextMenuItems = [
      { label: 'View Tag', icon: 'pi pi-eye', command: () => this.viewTag() },
      { label: 'Edit', icon: 'pi pi-pencil', command: () => this.editTag() },
      { label: 'Move Domains', icon: 'pi pi-check-square', command: () => this.addRemoveDomains() },
      { label: 'Delete Tag', icon: 'pi pi-trash', command: () => this.deleteTag() },
      { label: 'Add New Tag', icon: 'pi pi-plus', command: () => this.addNewTag() },
    ];
  }

  onRightClick(event: MouseEvent, tag: any) {
    this.selectedTag = tag;
    if (this.menu) {
      this.menu.show(event);
    }
    event.preventDefault();
  }

  viewTag() {
    this.router.navigate(['/assets/tags', this.selectedTag.name]);
  }

  editTag() {
    this.router.navigate(['/assets/tags', this.selectedTag.name, 'edit']);
  }

  addRemoveDomains() {
    this.router.navigate(['/assets/tags', this.selectedTag.name, 'add-domains']);
  }

  addNewTag() {
    this.router.navigate(['/assets/tags/new']);
  }

  deleteTag() {
    this.confirmationService.confirm({
      message: `
        Are you sure you want to delete the "${this.selectedTag.name}" tag?<br>
        <b class="text-red-500">This action cannot be undone.</b><br>
        <p class="text-surface-400 text-sm">Note that this will not affect the domains associated with this tag,<br>
        but they will loose their association.</p>
      `,
      header: `Tag Deletion Confirmation: ${this.selectedTag.name}`,
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-secondary p-button-sm',
      accept: () => {
        this.databaseService.instance.tagQueries.deleteTag(this.selectedTag.tag_id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: `Tag "${this.selectedTag.name}" deleted successfully.`
            });
            this.loadTagsWithCounts();
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
