import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';


interface DangerCard {
  title: string;
  body: string;
  buttonLabel: string;
  buttonLink?: string; // If button is a router link
  buttonFunction?: () => void; // Otherwise, if button is a function
  buttonIcon: string;
  buttonSeverity?: 'success' | 'info' | 'warning' | 'danger' | 'help' | 'primary';
  buttonClass?: string;
};


@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './delete-account.page.html',
  styles: [``]
})
export default class DeleteAccountPage {
  dangerCards: DangerCard[] = [
    {
      title: 'Leave Feedback',
      body: 'Considering closing your account, or facing issues with Domain Locker? We\'d love to hear your feedback, so that we can improve.',
      buttonLabel: 'Leave Feedback',
      buttonLink: '/about/feedback',
      buttonIcon: 'pi pi-comment',
      buttonSeverity: 'success',
    },
    {
      title: 'Export Data',
      body: 'If you wish to close your account, all data will be lost. It\'s recommended to export your data beforehand so you can more easily migrate to another service.',
      buttonLabel: 'Export Data',
      buttonLink: '/domains/export',
      buttonIcon: 'pi pi-download',
      buttonSeverity: 'info',
    },
    {
      title: 'Reset Settings',
      body: 'If you just want to clear your local settings and data, you can reset your settings here. This will not affect any of your domains, domain data or account info.',
      buttonLabel: 'Clear Data',
      buttonFunction: () => this.clearData(),
      buttonIcon: 'pi pi-eraser',
      buttonClass: 'bg-yellow-400 border-yellow-600 text-yellow-900',
    },
    {
      title: 'Cancel Billing',
      body: 'If you\'re on a paid plan, you can cancel your subscription here. If you close your account, your subscription will be automatically cancelled.',
      buttonLabel: 'Cancel Subscription',
      buttonLink: '/billing',
      buttonIcon: 'pi pi-wallet',
      buttonSeverity: 'warning',
    },
    {
      title: 'Delete Account',
      body: 'If you\'re sure you want to delete your account, click the button below. All data will be lost and this action is irreversible.',
      buttonLabel: 'Delete Account',
      buttonFunction: () => this.deleteAccount(),
      buttonIcon: 'pi pi-trash',
      buttonSeverity: 'danger',
    },
    {
      title: 'Switch to Self-Hosted',
      body: 'If you\'re interested in self-hosting, you can switch to the self-hosted version of the app. This will allow you to host the app on your own server and have full control over your data.',
      buttonLabel: 'Self-Hosting Docs',
      buttonLink: '/self-hosting-docs',
      buttonIcon: 'pi pi-server',
      buttonSeverity: 'help',
    },
  ];

  clearData() {
    // Placeholder function for clearing data
    console.log('Clearing data...');
  }

  deleteAccount() {
    // Placeholder function for deleting account
    console.log('Deleting account...');
  }
}
