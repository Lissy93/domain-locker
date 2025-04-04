import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';

type LinkItem = {
  title: string;
  description?: string;
  icon: string;
  link: string;
  external?: boolean;
};

type Section = {
  heading: string;
  items: LinkItem[];
};

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './index.page.html',
  styles: [``],
})
export default class AdvancedIndexPage {
  public sections: Section[] = [
    {
      heading: 'Troubleshooting',
      items: [
        {
          title: 'Database Connection',
          icon: 'pi pi-database',
          link: '/advanced/database-connection',
        },
        {
          title: 'Debug Info',
          icon: 'pi pi-stop',
          link: '/advanced/debug-info',
        },
        {
          title: 'Diagnostic Actions',
          icon: 'pi pi-hammer',
          link: '/advanced/diagnostic-actions',
        },
      ],
    },
    {
      heading: 'Data',
      items: [
        {
          title: 'Data Deletion',
          icon: 'pi pi-trash',
          link: '/advanced/delete-data',
        },
        {
          title: 'Data Export',
          icon: 'pi pi-file-export',
          link: '/domains/export',
        },
        {
          title: 'Data Interoperability',
          icon: 'pi pi-arrows-h',
          link: '/settings/developer-options',
        },
      ],
    },
    {
      heading: 'Docs & Help',
      items: [
        {
          title: 'Developer Docs',
          icon: 'pi pi-code',
          link: '/about/developing',
        },
        {
          title: 'Self-Hosting Docs',
          icon: 'pi pi-server',
          link: '/about/self-hosting',
        },
        {
          title: 'Legal Info',
          icon: 'pi pi-briefcase',
          link: '/about/legal',
        },
        {
          title: 'GitHub (source code)',
          icon: 'pi pi-github',
          link: 'https://github.com/lissy93/domain-locker',
          external: true,
        },
        {
          title: 'Support (premium)',
          icon: 'pi pi-phone',
          link: '/about/support',
        },
        {
          title: 'More Docs...',
          icon: 'pi pi-ellipsis-h',
          link: '/about',
        },
      ],
    },
    {
      heading: 'User Settings',
      items: [
        {
          title: 'Account Options',
          icon: 'pi pi-user-edit',
          link: '/settings/account',
        },
        {
          title: 'Notification Preferences',
          icon: 'pi pi-bell',
          link: '/settings/notification-preferences',
        },
        {
          title: 'Display Options',
          icon: 'pi pi-palette',
          link: '/settings/display-options',
        },
        {
          title: 'Privacy Protections',
          icon: 'pi pi-eye-slash',
          link: '/settings/privacy-settings',
        },
        {
          title: 'Billing',
          icon: 'pi pi-shop',
          link: '/settings/upgrade',
        },
        {
          title: 'More Settings...',
          icon: 'pi pi-ellipsis-h',
          link: '/settings',
        },
      ],
    },
  ];
}
