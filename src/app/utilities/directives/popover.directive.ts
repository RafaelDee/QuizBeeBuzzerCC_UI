import { Directive, ElementRef } from '@angular/core';
import {Popover} from 'src/app/bootstrap_plus/bootstrap.js'
@Directive({
  selector: '[data-bs-toggle="popover"]',standalone:true,
})
export class PopoverDirective{
  private instance:Popover;

  constructor(elementRef: ElementRef) {
    const element = elementRef.nativeElement;
    this.instance = new Popover(element, this.getPopoverOptions(element))
  }

  private getPopoverOptions(element: Element): object {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = {};
    // Add popover options based on element attributes
    const title = element.getAttribute('data-bs-title');
    if (title) {
      options.title = title;
    }
    const dismiss = element.getAttribute('data-bs-toggle');
    if (dismiss == 'popover') {
      options.trigger = 'focus';
    }

    const content = element.getAttribute('data-bs-content');
    if (content) {
      options.content = content;
    }

    const placement = element.getAttribute('data-bs-placement');
    if (placement) {
      options.placement = placement;
    }

    // Add more options as needed

    return options;
  }

  ngOnDestroy() {
    this.instance.dispose();
  }
}