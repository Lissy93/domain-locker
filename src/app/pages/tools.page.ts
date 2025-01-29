import { RouterOutlet } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { CommonModule } from '@angular/common';
import { ExtendedMenuItem, toolsLinks } from '~/app/constants/navigation-links';
import { DlIconComponent } from '~/app/components/misc/svg-icon.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterOutlet, PrimeNgModule, DlIconComponent],
  selector: 'tools-index-page',
  templateUrl: './tools/layout.html',
  styles: [
    '::ng-deep .content-container { max-width: 1600px; }',
    ``,
  ]
})
export default class ToolsIndexPageComponent {
  toolsLinks: ExtendedMenuItem[] = toolsLinks;
}
