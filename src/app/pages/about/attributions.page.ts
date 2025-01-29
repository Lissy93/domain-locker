import { AfterViewInit, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-attributions',
  imports: [CommonModule, PrimeNgModule],
  template: `
    <h1>Attributions</h1>
    <p>The ongoing development of Domain Locker wouldn't be possible without these supporters.</p>

    <!-- Spinner while building links -->
    <p-progressSpinner *ngIf="loading" class="flex mx-auto my-4"></p-progressSpinner>

    <div class="" *ngIf="!loading">
      <div 
        *ngFor="let section of sections" 
        class="my-4 p-card p-3 pb-5"
      >
        <h2 class="mb-3 text-{{section.badge.color || 'primary'}}-400">{{ section.label }}</h2>
        
        <!-- Fallback image if iframe fails -->
        <img 
          *ngIf="section.showFallback"
          [src]="section.url"
          alt="{{ section.label }}"
          class="mx-auto my-2"
        />

        <!-- Iframe otherwise -->
        <iframe
          *ngIf="!section.showFallback"
          [src]="section.safeUrl"
          width="100%"
          [height]="frameHeight"
          frameborder="0"
          (error)="section.showFallback = true"
        ></iframe>

        <p class="my-2 opacity-70 italic">
          Want to be included here?
          <a href="{{ section.badge.click }}"
            class="text-{{section.badge.color || 'primary'}}-400 underline"
            target="_blank" rel="noopener noreferrer"
          >
            {{ section.badge.text }}
          </a>
        </p>

        <!-- Badge -->
        <a *ngIf="section.badge" [href]="section.badge.click" target="_blank">
          <img [src]="section.badge.img" alt="{{ section.label }}" class="badge" />
        </a>
      </div>
    </div>
  `,
  styles: [`
    .badge {  filter: invert(1) hue-rotate(45deg) saturate(5.5) opacity(0.5); float: right;}
  `],
})
export default class AttributionsPage implements AfterViewInit {
  loading = true;

  user = 'lissy93';
  repo = 'dashy';
  frameHeight = 300;
  githubLink = `https://github.com/${this.user}/${this.repo}`;

  // Array of sections for contributors, sponsors, stargazers, forkers, etc.
  sections = [
    {
      label: 'Sponsors',
      type: 'sponsors',
      url: '',
      safeUrl: '',
      showFallback: false,
      badge: {
        img: `https://img.shields.io/github/sponsors/${this.user}?style=social&logo=github&label=Sponsor%20Us%3A%20Domain%20Locker`,
        click: `https://github.com/sponsors/${this.user}`,
        text: 'Sponsor us on GitHub',
        color: 'pink',
      },
    },
    {
      label: 'Contributors',
      type: 'contributors',
      url: '',
      safeUrl: '',
      showFallback: false,
      badge: {
        img: `https://img.shields.io/github/contributors/${this.user}/${this.repo}?style=social&logo=github&label=Contribute%3A%20Domain%20Locker`,
        click: this.githubLink,
        text: 'Contribute on GitHub',
        color: 'green',
      },
    },
    {
      label: 'Stargazers',
      type: 'stargazers',
      url: '',
      safeUrl: '',
      showFallback: false,
      badge: {
        img: `https://img.shields.io/github/stars/${this.user}/${this.repo}?style=social&label=Star%20Us%3A%20Domain%20Locker`,
        click: this.githubLink,
        text: 'Star us on GitHub',
        color: 'yellow',
      },
    },
    {
      label: 'Forkers',
      type: 'forkers',
      url: '',
      safeUrl: '',
      showFallback: false,
      badge: {
        img: `https://img.shields.io/github/forks/${this.user}/${this.repo}?style=social&label=Fork%20Us%3A%20Domain%20Locker`,
        click: this.githubLink,
        text: 'Fork us on GitHub',
        color: 'blue',
      },
    },
    // {
    //   label: 'Followers',
    //   type: 'followers',
    //   url: '',
    //   safeUrl: '',
    //   showFallback: false,
    //   badge: {
    //     img: `https://img.shields.io/github/followers/${this.user}?label=Followers%3A%20Lissy93`,
    //     click: `https://github.com/${this.user}`,
    //   },
    // },
  ];

  constructor(private sanitizer: DomSanitizer) {}

  ngAfterViewInit() {
    // Build URLs for each section
    const bg = this.getColorVar('--surface-50', 'transparent').replace('#','');
    const fg = this.getColorVar('--text-color', '#000').replace('#','');

    // for each section
    this.sections.forEach((s) => {
      const builtUrl = this.buildUrl(s.type, bg, fg);
      s.url = builtUrl;
      s.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(builtUrl) as string;
    });

    this.loading = false;
  }

  private buildUrl(type: string, bg: string, fg: string): string {
    const endpoint = 'https://readme-contribs.as93.net';
    const shape = 'circle';
    const size = 64;
    let theRepo = (type === 'sponsors') ? '' : `/${this.repo}`;
    return `${endpoint}/${type}/${this.user}${theRepo}?`
      + `avatarSize=${size}&shape=${shape}&perRow=12&`
      + `textColor=${encodeURIComponent(fg)}&backgroundColor=${encodeURIComponent(bg)}`;
  }

  private getColorVar(variable: string, fallback: string): string {
    try {
      const val = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
      if (!val) throw new Error();
      if (val.startsWith('#')) return val;
      const rgb = val.match(/\d+/g)?.map(Number);
      return rgb ? `#${rgb.slice(0, 3).map(c => c.toString(16).padStart(2,'0')).join('')}` : fallback;
    } catch {
      return fallback;
    }
  }
}
