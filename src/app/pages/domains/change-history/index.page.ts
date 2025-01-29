import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { DomainUpdatesComponent } from '~/app/components/domain-things/domain-updates/domain-updates.component';
import { ChangeHistoryChartComponent } from '~/app/components/charts/change-history/change-history.component';
import { FeatureService } from '~/app/services/features.service';
import { FeatureNotEnabledComponent } from '~/app/components/misc/feature-not-enabled.component';

@Component({
  standalone: true,
  selector: 'app-domain-details',
  imports: [CommonModule, PrimeNgModule, DomainUpdatesComponent, ChangeHistoryChartComponent, FeatureNotEnabledComponent ],
  templateUrl: './change-history.page.html',
})
export default class ChangeHistoryPage {
  changeHistoryEnabled$ = this.featureService.isFeatureEnabled('changeHistory');
  constructor(private featureService: FeatureService) {}
}
