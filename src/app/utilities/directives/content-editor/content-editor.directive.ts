import { style } from '@angular/animations';
import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';

@Directive({
  selector: '[contentEditor]',
  standalone: true,
  host:{style:'width:100%'}
})
export class ContentEditorDirective {
  @Input() set value(val: string) {
    this.el.nativeElement.textContent = val;
  }
  @Output() valueChange = new EventEmitter<string>();
  constructor(public el: ElementRef) {}
  /* @HostListener('input')
  onInput() {
    this.valueChange.emit(this.el.nativeElement.textContent);
  } */
  //Workaround for gekko browsers resetting cursor to the begining
  @HostListener('focusout')
  onFocusOut() {
    this.valueChange.emit(this.el.nativeElement.textContent);
  }
}
