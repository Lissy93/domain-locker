import { DlIconComponent } from '~/app/components/misc/svg-icon.component';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule, ReactiveFormsModule, DlIconComponent],
  templateUrl: './privacy-settings.page.html',
})
export default class PrivacyPageComponent {
  constructor(private fb: FormBuilder) {}

  form: FormGroup = this.fb.group({
    hitCounting: [true],
    errorTracking: [false],
    performanceMonitoring: [false],
    cookies: [{ value: false, disabled: true }],
    localStorage: [{ value: true, disabled: true }],
  });

  clearLocalStorage() {
    localStorage.clear();
  }
}
