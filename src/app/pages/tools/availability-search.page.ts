import { Component, OnInit } from '@angular/core';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { CommonModule } from '@angular/common';


@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  selector: 'tools-availability-page',
  templateUrl: './availability-search.page.html',
  styles: ['::ng-deep .content-container { max-width: 1600px; }']
})
export default class ToolsAvailabilityPageComponent {}
