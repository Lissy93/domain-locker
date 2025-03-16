
import {
  Component,
  ChangeDetectorRef,
  ViewChild,
  OnInit,
  OnDestroy,
  Inject,
  Input
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { GalleriaModule, Galleria } from 'primeng/galleria';
import { ButtonModule } from 'primeng/button';

export interface Screenshot {
  screenshot: string; // The URL to the screenshot
  title: string;      // Short title
  description: string; // Longer description
}

@Component({
  selector: 'app-screenshots',
  standalone: true,
  imports: [
    CommonModule,
    GalleriaModule,
    ButtonModule
  ],
  templateUrl: './screenshots.component.html',
  styleUrls: ['./screenshots.component.scss']
})
export class ScreenshotsComponent implements OnInit, OnDestroy {
  /**
   * The array of screenshots to display.
   */
  @Input() screenshots: Screenshot[] = [];

  // Galleria references
  @ViewChild('galleria') galleria: Galleria | undefined;

  // State / config
  activeIndex = 0;
  showThumbnails = true;
  fullscreen = false;

  // used to store the event listener reference
  onFullScreenListener: any;

  // Some example responsive breakpoints if you wish:
  responsiveOptions = [
    {
      breakpoint: '1024px',
      numVisible: 5
    },
    {
      breakpoint: '768px',
      numVisible: 3
    },
    {
      breakpoint: '560px',
      numVisible: 1
    }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Bind for listening to when the user toggles browser fullscreen
    this.bindDocumentListeners();
  }

  ngOnDestroy() {
    this.unbindDocumentListeners();
  }

  /**
   * Toggle thumbnail visibility
   */
  onThumbnailButtonClick() {
    this.showThumbnails = !this.showThumbnails;
  }

  /**
   * Fullscreen icon for toggling
   */
  fullScreenIcon() {
    return `pi ${this.fullscreen ? 'pi-window-minimize' : 'pi-window-maximize'}`;
  }

  /**
   * Dynamically set the Galleria container class
   */
  galleriaClass() {
    return `custom-galleria ${this.fullscreen ? 'fullscreen' : ''}`;
  }

  /**
   * Toggle in/out of fullscreen
   */
  toggleFullScreen() {
    if (this.fullscreen) {
      this.closePreviewFullScreen();
    } else {
      this.openPreviewFullScreen();
    }
    // Because entering/leaving fullscreen can happen asynchronously,
    // we detach/reattach to avoid "changed after checked" errors.
    this.cd.detach();
  }

  openPreviewFullScreen() {
    const elem = this.galleria?.element.nativeElement.querySelector('.p-galleria');
    if (!elem) {
      return;
    }

    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem['mozRequestFullScreen']) {
      /* Firefox */
      elem['mozRequestFullScreen']();
    } else if (elem['webkitRequestFullscreen']) {
      /* Chrome, Safari & Opera */
      elem['webkitRequestFullscreen']();
    } else if (elem['msRequestFullscreen']) {
      /* IE/Edge */
      elem['msRequestFullscreen']();
    }
  }

  closePreviewFullScreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  }

  onFullScreenChange() {
    // Flip the fullscreen flag
    this.fullscreen = !this.fullscreen;
    // Re-run change detection
    this.cd.detectChanges();
    this.cd.reattach();
  }

  bindDocumentListeners() {
    this.onFullScreenListener = this.onFullScreenChange.bind(this);
    document.addEventListener('fullscreenchange', this.onFullScreenListener);
    document.addEventListener('mozfullscreenchange', this.onFullScreenListener);
    document.addEventListener('webkitfullscreenchange', this.onFullScreenListener);
    document.addEventListener('msfullscreenchange', this.onFullScreenListener);
  }

  unbindDocumentListeners() {
    document.removeEventListener('fullscreenchange', this.onFullScreenListener);
    document.removeEventListener('mozfullscreenchange', this.onFullScreenListener);
    document.removeEventListener('webkitfullscreenchange', this.onFullScreenListener);
    document.removeEventListener('msfullscreenchange', this.onFullScreenListener);
    this.onFullScreenListener = null;
  }
}
