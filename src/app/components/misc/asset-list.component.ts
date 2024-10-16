import { Component, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '../../prime-ng.module';
import { DlIconComponent } from '@components/misc/svg-icon.component';
import DatabaseService from '@services/database.service';

interface Asset {
  title: string;
  link: string;
  icon: string;
  viewBox?: string;
  count?: number;
}

@Component({
  standalone: true,
  selector: 'app-asset-list',
  template: `
    <h2 class="my-4 block">Assets</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
      <ng-container *ngFor="let asset of assets">
        <a pAnimateOnScroll class="asset-card-link" [routerLink]="asset.link">
          <div class="p-card asset-card">
            <h4>{{ asset.title }}</h4>
            <p class="text-surface-400 my-0" *ngIf="asset.count !== undefined">{{ asset.count }} {{ asset.title }}</p>
            <div class="absolute top-2 right-4 h-16 w-16 opacity-70">
              <dl-icon [icon]="asset.icon" [viewBox]="asset.viewBox || '0 0 512 512'" classNames="w-full h-full" color="var(--surface-200)"></dl-icon>
            </div>
          </div>
        </a>
      </ng-container>
    </div>
  `,
  styles: [`
    .asset-card-link {
      text-decoration: none;
      color: inherit;
      .asset-card {
        position: relative;
        break-inside: avoid !important;
        transition: ease-in-out 0.3s;
        border: 3px solid transparent;
        cursor: pointer;
        height: 100%;
        padding: 1rem;
        h4 {
          font-size: 1.4rem;
          margin: 0.5rem 0;
        }
        &:hover {
          border-color: var(--primary-color);
        }
      }
    }
  `],
  imports: [CommonModule, PrimeNgModule, DlIconComponent]
})
export default class AssetListComponent implements OnInit {
  assets: Asset[] = [
    { title: 'Registrars', link: '/assets/registrars', icon: 'registrar', viewBox: '0 0 620 512' },
    { title: 'IP Addresses', link: '/assets/ips', icon: 'ips' },
    { title: 'SSL Certificates', link: '/assets/certs', icon: 'ssl' },
    { title: 'Hosts', link: '/assets/hosts', icon: 'host' },
    { title: 'DNS Records', link: '/assets/dns', icon: 'dns', viewBox: '0 0 620 512' },
    { title: 'Tags', link: '/assets/tags', icon: 'tags' }
  ];

  constructor(
    private databaseService: DatabaseService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    // Run the count fetching outside of Angular's change detection
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => this.fetchAssetCounts(), 0);
    });
  }

  private fetchAssetCounts() {
    this.assets.forEach(asset => {
      this.databaseService.getAssetCount(asset.title.toLowerCase()).subscribe(
        count => {
          // Run the update inside Angular's zone to trigger change detection
          this.ngZone.run(() => {
            asset.count = count;
          });
        },
        error => console.error(`Error fetching count for ${asset.title}:`, error)
      );
    });
  }
}
