import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
} from '@angular/core';
import { delay } from 'rxjs';
import { Dropdown } from 'src/app/bootstrap_plus/bootstrap.js';
//import { Dropdown as Drop } from 'bootstrap';

const CLASS_NAME = 'has-child-dropdown-show';

@Directive({
  selector: '[DropdownHover]',
})
export class DropdownHoverDirective implements AfterViewInit {
  //dropdown: Drop;
  toggle:ElementRef["nativeElement"];
  dropdown:Dropdown;
  constructor(private el: ElementRef) {}
  ngAfterViewInit(): void {
    console.log(this.el.nativeElement);
    this.dropdown = new Dropdown(this.el.nativeElement);
    this.toggle = this.el.nativeElement;
    //this.dropdown = Dropdown(this.toggle);
  }
  //Shows the dropdown menu when hovered
  @HostListener('mouseenter', ['$event']) onMouseEnter(e: any) {
            if (!this.toggle?.classList?.contains('show')) {
                this.dropdown.show();
                this.el.nativeElement.classList.add(CLASS_NAME);
            }
  }

  //Toggles the dropdown menu and get it ready to hide
  @HostListener('mouseleave', ['$event']) onMouseLeave(e: any) {
    const isHoveringOverDropdown = this.el.nativeElement.contains(document.activeElement);
    if (!isHoveringOverDropdown) {
      this.dropdown.hide();
    }
  }

  /*//Hides the dropdown menu when bootstrap hide dropdown event occured
  @HostListener('hide.bs.dropdown',['$event']) onHideDropdown(e: any){
    let toggle = this.el.nativeElement;
    if (toggle.classList.contains(CLASS_NAME)) {
      toggle.classList.remove(CLASS_NAME);
      e.preventDefault();
    }
    e.stopPropagation(); // do not need pop in multi level mode
  }*/
}