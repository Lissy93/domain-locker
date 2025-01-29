import { PrimeNgModule } from '~/app/prime-ng.module';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule, ReactiveFormsModule],
  templateUrl: './developer-options.page.html',
  styles: [``],
})
export default class DeveloperOptionsPageComponent {
  constructor(private fb: FormBuilder) {}

  form: FormGroup = this.fb.group({
    restApi: [false],
    graphQl: [false],
    rssFeed: [false],
    prometheus: [false],
  });
}
