import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnInit,
} from '@angular/core';
import { environment } from 'src/environments/environment.prod';
const defaults = {
  profile: '../assets/images/placeholders/default-user.png',
  image: '../assets/images/placeholders/placeholder-image.png',
  tire: '../assets/images/placeholders/default-tire.png',
  website: '../assets/images/placeholders/favicon.png',
} as const;

export type DefaultImage = keyof typeof defaults;
@Directive({
  selector: 'img',
  standalone: true,
})
export class AdvancedImgDirective implements OnInit {
  constructor(private el: ElementRef<HTMLImageElement>) {}
  @Input() defaultImage: DefaultImage = 'image';
  ngOnInit(): void {}
  @HostListener('error', ['$event'])
  error(element: HTMLImageElement, ev: ErrorEvent) {
    this.el.nativeElement.src = environment.defaults[this.defaultImage];
  }
}
