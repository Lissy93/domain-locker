import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import DatabaseService from '~/app/services/database.service';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-domain-tag-picklist',
  templateUrl: './tag-picklist.component.html',
  standalone: true,
  imports: [PrimeNgModule, CommonModule],
  styles: [`
    ::ng-deep .p-picklist-target-controls, ::ng-deep .p-picklist-source-controls { display: none; }
  `],
})
export class TagPickListComponent implements OnInit {
  @Input() tagId: string | undefined;
  @Output() $afterSave = new EventEmitter();

  availableDomains: any[] = [];
  selectedDomains: any[] = [];

  constructor(
    private databaseService: DatabaseService,
    private messageService: MessageService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (this.tagId) {
      this.loadDomainsForTag(this.tagId);
    }
  }

  // Load domains already associated with the tag and all available domains
  private loadDomainsForTag(tagId: string) {
    this.databaseService.instance.tagQueries.getDomainsForTag(tagId).subscribe({
      next: ({ available, selected }) => {
        const selectedDomainIds = selected.map(domain => domain.id);
        this.availableDomains = available.filter(domain => !selectedDomainIds.includes(domain.id));
        this.selectedDomains = selected;
      },
      error: (error) => {
        console.error('Error loading domains for tag:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load domains for this tag',
        });
      },
    });
  }

  // Save the tag for the selected domains
  saveDomainsForTag() {
    if (!this.tagId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Tag ID is missing',
      });
      return;
    }
    this.databaseService.instance.tagQueries.saveDomainsForTag(this.tagId, this.selectedDomains).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Domains saved successfully',
        });
        this.$afterSave.emit();
      },
      error: (error) => {
        console.error('Error saving domains for tag:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to save domains for this tag',
        });
      },
    });
  }
}
