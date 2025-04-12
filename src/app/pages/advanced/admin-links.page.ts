import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { DomainFaviconComponent } from '~/app/components/misc/favicon.component';

import { selfHostedLinks, serviceLinks, type LinkItem } from '~/app/constants/admin-links';

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule, DomainFaviconComponent],
  templateUrl: './admin-links.page.html',
})
export default class AdminLinksPage {
  public sections: { title: string, description: string; links: LinkItem[]}[] = [
    {
      title: 'Third-Party Services',
      description: 'These services are managed by third-party providers, and '
        + 'are used on the Domain-Locker.com managed instance.',
      links: serviceLinks,
    },
    {
      title: 'Self-hosted Services',
      description: 'These technologies are only used on the self-hosted version '
        + 'of Domain Locker, where no third-party services are required.',
      links: selfHostedLinks,
    },
  ];

  public details = [
    'ℹ️ These are links to the admin panels of external and third-party services used by Domain Locker.',
    '⚠️ This content is intended only for system administrators and developers. '
    + 'Therefore these portals will be inaccessible to you, if you have not either '
    + 'been granted permissions to the Domain-Locker team, or set these services '
    + 'up on your own instance.',
    '❗ Domain Locker cannot guarantee the availability, reliability, or security '
    + 'of these external services. Use them at your own discretion.',
  ];
}
