import { Component, OnInit } from '@angular/core';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { CommonModule } from '@angular/common';


@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  selector: 'tools-valuation-page',
  templateUrl: './domain-valuation.page.html',
  styles: ['::ng-deep .content-container { max-width: 1600px; }']
})
export default class ToolsValuationPageComponent {}
