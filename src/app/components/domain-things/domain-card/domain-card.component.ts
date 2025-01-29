import { Component, ElementRef, Input, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';

import { DbDomain } from '~/app/../types/Database';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { NgFor, DatePipe, CommonModule } from '@angular/common';
import { DomainUtils } from '~/app/services/domain-utils.service';
import { DomainFaviconComponent } from '~/app/components/misc/favicon.component';
import { type FieldOption } from '~/app/components/domain-things/domain-filters/domain-filters.component';
import DatabaseService from '~/app/services/database.service';
import { GlobalMessageService } from '~/app/services/messaging.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ErrorHandlerService } from '~/app/services/error-handler.service';

@Component({
  standalone: true,
  selector: 'app-domain-card',
  templateUrl: './domain-card.component.html',
  styleUrls: ['./domain-card.component.scss'],
  imports: [PrimeNgModule, NgFor, DatePipe, CommonModule, DomainFaviconComponent ],
  providers: [ConfirmationService, MessageService],
  animations: [
    trigger('cardAnimation', [
      state('visible', style({
        opacity: 1,
        transform: 'translateY(0)'
      })),
      state('hidden', style({
        opacity: 0,
        transform: 'translateY(-100%)'
      })),
      transition('visible => hidden', animate('300ms ease-out'))
    ])
  ]
})
export class DomainCardComponent implements OnInit {
  @Input() domain!: DbDomain;
  @Input() visibleFields: FieldOption[] = [];
  contextMenuItems: MenuItem[] | undefined;
  cardVisible = true;

  constructor(
    public domainUtils: DomainUtils,
    private router: Router,
    private confirmationService: ConfirmationService,
    private databaseService: DatabaseService,
    private globalMessageService: GlobalMessageService,
    private elRef: ElementRef,
    private errorHandler: ErrorHandlerService
  ) {}

  isVisible(field: string): boolean {
    return this.visibleFields.some(option => option.value === field);
  }

  ngOnInit() {
    this.contextMenuItems = [
      { 
        label: 'View', 
        icon: 'pi pi-reply',
        command: () => this.viewDomain()
      },  
      { 
        label: 'Edit', 
        icon: 'pi pi-pencil',
        command: () => this.editDomain()
      },
      { 
        label: 'Delete', 
        icon: 'pi pi-trash',
        command: (event) => this.deleteDomain(event)
      },
      { 
        label: 'Copy URL', 
        icon: 'pi pi-copy',
        command: () => this.copyDomainUrl()
      },
      { 
        label: 'Visit URL', 
        icon: 'pi pi-external-link',
        command: () => this.visitDomainUrl()
      },
    ];
  }

  viewDomain() {
    this.router.navigate(['/domains', this.domain.domain_name]);
  }

  editDomain() {
    this.router.navigate(['/domains', this.domain.domain_name, 'edit']);
  }

  deleteDomain(event: any) {
    this.confirmationService.confirm({
      target: event.originalEvent.target as EventTarget,
      header: 'Destructive Action',
      message: 'Are you sure you want to delete this domain?',
      icon: 'pi pi-exclamation-triangle',
      rejectButtonStyleClass:"p-button-text", 
      accept: () => {
        this.databaseService.instance.deleteDomain(this.domain.id).subscribe({
          next: () => {
            this.globalMessageService.showMessage({
              severity: 'success',
              summary: 'Success',
              detail: 'Domain deleted successfully'
            });
            this.cardVisible = false;
          },
          error: (err) => {
            console.error('Error deleting domain:', err);
            this.globalMessageService.showMessage({
              severity: 'error',
              summary: 'Error',
              detail: err.message || 'Failed to delete domain'
            });
          }
        });
      }
    });
  }

  copyDomainUrl() {
    const url = `https://${this.domain.domain_name}`;
    const clipboardCopyFailed = (e: Error | unknown) => {
      this.errorHandler.handleError(
        { error: e, message: 'Failed to copy URL to clipboard', showToast: true },
      );
    }
    try {
      navigator.clipboard.writeText(url).then(
        () => {
          this.globalMessageService.showMessage({
            severity: 'success',
            summary: 'Success',
            detail: 'Domain URL copied to clipboard'
          });
        },
        (err) => {
          clipboardCopyFailed(err);
        }
      );
    } catch (err) {
      clipboardCopyFailed(err);
    }
  }

  visitDomainUrl() {
    const url = `https://${this.domain.domain_name}`;
    window.open(url, '_blank');
  }

  // Checks if a given click target is a link or inside a link.
  private clickedOnLink(element: HTMLElement): boolean {
    let node: HTMLElement | null = element;
    while (node && node !== this.elRef.nativeElement) {
      if (node.tagName === 'A' || node.tagName === 'BUTTON') {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  }

    /**
   * Click handler for the entire card.
   * If the user clicked on or inside a link, do nothing.
   * Otherwise, navigate to /domains/[domain-name].
   */
    onCardClick(event: MouseEvent) {
      if (!this.clickedOnLink(event.target as HTMLElement)) {
        this.viewDomain();
      }
    }
}
