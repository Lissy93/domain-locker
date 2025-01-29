import { RouterOutlet } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { toolsLinks } from '~/app/constants/navigation-links';

@Component({
  standalone: true,
  imports: [CommonModule, RouterOutlet, PrimeNgModule],
  selector: 'tools-index-page',
  templateUrl: './index.page.html',
  styles: ['::ng-deep .content-container { max-width: 1600px; }']
})
export default class ToolsIndexPageComponent {}
