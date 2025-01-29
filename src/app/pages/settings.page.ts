import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { settingsLinks } from '~/app/constants/navigation-links';
import { SupabaseService } from '~/app/services/supabase.service';
import { ProfilePictureComponent } from '~/app/components/misc/profile-picture.component';
import { FeatureService } from '../services/features.service';
import { FeatureNotEnabledComponent } from '~/app/components/misc/feature-not-enabled.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterOutlet, PrimeNgModule, ProfilePictureComponent, FeatureNotEnabledComponent],
  templateUrl: './settings/index.page.html',
})
export default class SettingsIndexPage implements OnInit {
  items: MenuItem[] | undefined;
  hideSideBar = false;
  @ViewChild('sidebarNav', { static: false }) sidebarNav!: ElementRef;
  hideTextLabels = false;

  settingsEnabled$ = this.featureService.isFeatureEnabled('accountSettings');

  constructor(
    private router: Router,
    private featureService: FeatureService,
    public supabaseService: SupabaseService,
  ) {}

  ngOnInit() {
    this.items = settingsLinks;
  }

  isActive(link: string): boolean {
    return this.router.url === link;
  }

  async logout() {
    await this.supabaseService.signOut();
    window.location.href = '/login';
  }
}
