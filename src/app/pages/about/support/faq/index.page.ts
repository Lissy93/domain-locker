import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  templateUrl: './index.page.html',
})
export default class FaqPage implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
