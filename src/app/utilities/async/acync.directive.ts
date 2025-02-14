import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[async]',
  standalone:true
})
export class AsyncDirective {

  constructor(public viewContainerRef: ViewContainerRef) {}

}
