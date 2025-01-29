import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { DlIconComponent } from '~/app/components/misc/svg-icon.component';
import { alternativeComparison, providerInfo, Has, type Providers, type FeatureComparison, ProviderInfo } from '../data/feature-comparison';
import { OnInit } from '@angular/core';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, PrimeNgModule, DlIconComponent],
  templateUrl: './index.page.html',
  styles: [`::ng-deep .p-datatable-wrapper { border-radius: 6px; } `],
})
export default class FeaturesPage implements OnInit {
  public alternativeComparison: FeatureComparison[] = alternativeComparison;
  public providerInfo: Record<Providers, ProviderInfo> = providerInfo;
  public columns: { field: string; header: string, icon?: string, url?: string, summary?: string }[] = [];
  public tableData: Record<string, string>[] = [];

  ngOnInit() {
    this.columns = [
      { field: 'feature', header: 'Feature' },
    ];
    for (const provider in this.providerInfo) {
      if (this.providerInfo.hasOwnProperty(provider)) {
      const info = this.providerInfo[provider as Providers];
      this.columns.push({
        field: provider,
        header: info.name,
        icon: info.icon,
        url: info.url,
        summary: info.summary,
      });
      }
    }
    this.tableData = this.transformData();
  }

  transformData() {
    return this.alternativeComparison.map((item) => {
      const transformedItem: Record<string, any> = { feature: item.feature };
      for (const key in item.comparison) {
        if (item.comparison.hasOwnProperty(key)) {
          const providerKey = key as Providers;
          // transformedItem[providerKey] = Has[item.comparison[providerKey].has];
          transformedItem[providerKey] = {
            value: Has[item.comparison[providerKey].has],
            description: item.comparison[providerKey].notes,
          };
        }
      }
      return transformedItem;
    });
  }
}
