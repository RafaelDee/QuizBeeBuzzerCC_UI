import {
  Directive,
  ElementRef,
  HostBinding,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import { environment } from '../../../environment/environment.prod';

const defaults = {
  profile: '../assets/images/placeholders/default-user.png',
  image: '../assets/images/placeholders/placeholder-image.png',
  tire: '../assets/images/placeholders/default-tire.png',
  website: '../assets/images/placeholders/favicon.png',
} as const;

export type DefaultImage = keyof typeof defaults;

@Directive({
  selector: 'img[src]',
  standalone: true,
})
export class AdvancedImgDirective implements OnInit, OnChanges {
  private originalSrc: string | null = null;
  private isLoading = true;
  private hasError = false;

  @Input() src: string | null = null;
  @Input() defaultImage: DefaultImage = 'image';

  constructor(
    private el: ElementRef<HTMLImageElement>,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    // Capture original dimensions when available
    this.setDefaultIfNeeded();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['src']) {
      this.originalSrc = changes['src'].currentValue;
      this.hasError = false;
      this.setDefaultIfNeeded();
    }
  }

  private setDefaultIfNeeded(): void {
    const defaultSrc = environment.defaults[this.defaultImage];

    if (!this.originalSrc || this.originalSrc.trim().length === 0 || this.hasError) {
      // Apply default image if original is empty or had an error
      this.setSafeImageSource(defaultSrc);
    } else {
      // Apply the original source if it exists
      this.setSafeImageSource(this.originalSrc);
    }
  }

  private setSafeImageSource(src: string): void {
    if (!this.el.nativeElement) return;

    // Only update if necessary to prevent unnecessary reloads
    if (this.el.nativeElement.src !== src) {
      this.renderer.setAttribute(this.el.nativeElement, 'src', src);
    }
  }

  @HostListener('load')
  onLoad(): void {
    this.isLoading = false;
    // Update dimensions once the image has loaded
  }

  @HostListener('error')
  onError(): void {
    this.hasError = true;
    // Only apply default if we're not already showing it
    if (this.el.nativeElement.src !== environment.defaults[this.defaultImage]) {
      this.setSafeImageSource(environment.defaults[this.defaultImage]);
    }
  }
}
