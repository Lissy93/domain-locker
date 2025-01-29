import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { DomainFaviconComponent } from '~/app/components/misc/favicon.component';
import { NotificationsListComponent } from '~/app/components/notifications-list/notifications-list.component';

@Component({
  standalone: true,
  templateUrl: './index.page.html',
  imports: [CommonModule, PrimeNgModule, DomainFaviconComponent, NotificationsListComponent ],
})
export default class NotificationsPage {}
