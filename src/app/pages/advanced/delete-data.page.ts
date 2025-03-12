import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';

import { DeleteAccountComponent } from '~/app/components/settings/delete-data/delete-data.component';

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule, DeleteAccountComponent],
  template: '<app-delete-account />',
})
export default class DeleteAccountPage {}
