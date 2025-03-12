import { PrimeNgModule } from '~/app/prime-ng.module';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './../advanced/index.page.html',
  styles: [``],
})
export default class AdvancedIndexPage {}
