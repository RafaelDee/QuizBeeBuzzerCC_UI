import {
  Directive,
  Input,
  Output,
  EventEmitter,
  HostListener,
} from '@angular/core';
import { PopoverDirective } from './popover.directive';

@Directive({
  selector: '[copy-clipboard]',
  standalone: true,
  hostDirectives: [PopoverDirective],
  host: {
    'data-bs-container': 'body',
    'data-bs-toggle': 'popover',
    'data-bs-placement': 'top',
    'data-bs-content': 'Copied!',
    'style':'pointer-events: all'
  },
})
export class CopyClipboardDirective {
  @Input('copy-clipboard')
  public payload: string;

  @Output('copied')
  public copied: EventEmitter<string> = new EventEmitter<string>();

  @HostListener('click', ['$event'])
  public onClick(event: MouseEvent): void {
    event.preventDefault();
    if (!this.payload) return;

    const listener = (e: ClipboardEvent) => {
      const clipboard = e.clipboardData || window['clipboardData'];
      clipboard.setData('text', this.payload.toString());
      e.preventDefault();

      this.copied.emit(this.payload);
    };

    document.addEventListener('copy', listener, false);
    document.execCommand('copy');
    document.removeEventListener('copy', listener, false);
  }
}
