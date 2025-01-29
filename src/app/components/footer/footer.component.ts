import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LogoComponent} from '~/app/components/home-things/logo/logo.component';

@Component({
  standalone: true,
  selector: 'app-footer',
  imports: [ CommonModule, PrimeNgModule, LogoComponent ],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  styles: []
})
export class FooterComponent {
  @Input() public big: boolean = false;
  public year: number = new Date().getFullYear();

  public fc: any = {};

  constructor(private router: Router, private translate: TranslateService) {
    this.translate.get([
      'FOOTER.NAME',
      'FOOTER.DESCRIPTION',
      'FOOTER.CTAS.SIGN_UP',
      'FOOTER.CTAS.GET_CODE',
      'FOOTER.LINKS.LEFT.FEATURES',
      'FOOTER.LINKS.LEFT.PRICING',
      'FOOTER.LINKS.LEFT.SELF_HOSTING',
      'FOOTER.LINKS.LEFT.ALTERNATIVES',
      'FOOTER.LINKS.MIDDLE.GITHUB',
      'FOOTER.LINKS.MIDDLE.MORE_APPS',
      'FOOTER.LINKS.MIDDLE.SUPPORT',
      'FOOTER.LINKS.MIDDLE.ATTRIBUTIONS',
      'FOOTER.LINKS.RIGHT.LICENSE',
      'FOOTER.LINKS.RIGHT.SECURITY',
      'FOOTER.LINKS.RIGHT.PRIVACY_POLICY',
      'FOOTER.LINKS.RIGHT.TERMS_OF_SERVICE'
    ]).subscribe(translations => {
      this.fc = {
        name: translations['FOOTER.NAME'],
        description: translations['FOOTER.DESCRIPTION'],
        ctas: [
          {
            label: translations['FOOTER.CTAS.SIGN_UP'],
            link: '/login',
            queryParams: { newUser: 'true' },
            icon: 'pi pi-sparkles',
            isPrimary: true,
          },
          {
            label: translations['FOOTER.CTAS.GET_CODE'],
            click: () => window.open('https://github.com/lissy93/domain-locker', '_blank'),
            icon: 'pi pi-github',
            isPrimary: false,
          },
        ],
        left: [
          { label: translations['FOOTER.LINKS.LEFT.FEATURES'], link: '/about/features' },
          { label: translations['FOOTER.LINKS.LEFT.PRICING'], link: '/about/pricing' },
          { label: translations['FOOTER.LINKS.LEFT.SELF_HOSTING'], link: '/about/self-hosting' },
          { label: translations['FOOTER.LINKS.LEFT.ALTERNATIVES'], link: '/about/alternatives' },
        ],
        middle: [
          { label: translations['FOOTER.LINKS.MIDDLE.GITHUB'], link: 'https://github.com/lissy93/domain-locker' },
          { label: translations['FOOTER.LINKS.MIDDLE.MORE_APPS'], link: 'https://as93.net' },
          { label: translations['FOOTER.LINKS.MIDDLE.SUPPORT'], link: '/about/support' },
          { label: translations['FOOTER.LINKS.MIDDLE.ATTRIBUTIONS'], link: '/about/attributions' },
        ],
        right: [
          { label: translations['FOOTER.LINKS.RIGHT.LICENSE'], link: '/about/legal/license' },
          { label: translations['FOOTER.LINKS.RIGHT.SECURITY'], link: '/about/legal/security' },
          { label: translations['FOOTER.LINKS.RIGHT.PRIVACY_POLICY'], link: '/about/legal/privacy-policy' },
          { label: translations['FOOTER.LINKS.RIGHT.TERMS_OF_SERVICE'], link: '/about/legal/terms-of-service' },
        ],
      };
    });
  }
}
