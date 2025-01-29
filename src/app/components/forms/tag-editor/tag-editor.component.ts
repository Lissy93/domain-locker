import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { MessageService } from 'primeng/api';
import DatabaseService from '~/app/services/database.service';
import { Tag } from '~/app/../types/common';

@Component({
  selector: 'app-tag-editor',
  templateUrl: './tag-editor.component.html',
  styleUrls: ['./tag-editor.component.scss'],
  standalone: true,
  imports: [PrimeNgModule, CommonModule],
})
export class TagEditorComponent {
  @Input() tag: Tag | any = {};
  @Input() isAddNew: boolean = false;
  @Input() afterSave: (p?: string) => void = () => {};
  @Output() $afterSave = new EventEmitter<string>();

  tagColors: string[] = ['blue', 'green', 'yellow', 'cyan', 'pink', 'indigo', 'teal', 'orange', 'purple', 'red', 'gray'];

  constructor(
    private databaseService: DatabaseService,
    private messageService: MessageService,
  ) {}

  saveTag() {
    if (!this.tag.name.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Tag name is required',
      });
      return;
    }

    if (this.isAddNew) {
      this.createTag();
    } else {
      this.updateTag();
    }
  }

  private createTag() {
    this.databaseService.instance.tagQueries.createTag(this.tag).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Tag created successfully',
        });
        this.$afterSave.emit(this.tag.name);
      },
      error: (err) => {
        if (err.code === '23505') {  // Handle duplicate tag names
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Tag with this name already exists',
          });
        } else {
          console.error('Error creating tag:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create tag',
          });
        }
      }
    });
  }

  private updateTag() {
    this.databaseService.instance.tagQueries.updateTag(this.tag).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Tag updated successfully',
        });
        this.$afterSave.emit(this.tag.name);
      },
      error: (err) => {
        console.error('Error updating tag:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update tag',
        });
      }
    });
  }

  isValidIcon(): boolean {
    const iconRegex = /^[a-z]+\/[a-z-]+$/;
    return iconRegex.test(this.tag.icon);
  }
}
