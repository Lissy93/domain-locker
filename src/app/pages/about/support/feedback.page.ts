import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModule } from '~/app/prime-ng.module';
import { ActivatedRoute } from '@angular/router';
import { GlobalMessageService } from '~/app/services/messaging.service';

@Component({
  standalone: true,
  imports: [CommonModule, PrimeNgModule],
  template: `
  <div style="position: relative; height:40dvh; overflow:auto;"> 
<iframe 
  src="https://app.formbricks.com/s/cm70l7z0s0000l103uiuf1y6m?embed=true" 
  frameborder="0" style="position: absolute; left:0; top:0; width:100%; height:100%; border:0;">
</iframe>
</div>
  `,
  styles: [``],
})
export default class SupportPage {
}
