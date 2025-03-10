import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import { asyncDelay } from '../common-utils';

@Directive({
  selector: '[ScrollingNumbers]',
})
export class ScrollingNumbersDirective implements OnInit {
  init = false;
  ngOnInit(): void {
    this.setup();
    this.init = true;
    if (this.needUpdate) {
      this.update();
    }
  }
  currNum = '';
  needUpdate = false;
  constructor(private el: ElementRef<HTMLSpanElement>) {}
  private _value: string;
  public get value(): string {
    return this._value;
  }
  @Input() public set value(value: string) {
    this._value = value;
    console.log(this._value);
    if (this.init) this.update();
    else this.needUpdate = true;
  }
  async scrollNumber(digits) {
    const fontSize = this.getCssVariable('--scroll-font-size-w');
    this.el.nativeElement
      .querySelectorAll('span[data-value]')
      .forEach((tick, i) => {
        tick['style'].transform = `translateY(-${
          100 * (digits[i] == '-' ? 0 : parseInt(digits[i]) + 1)
        }%)`;
      });
    setTimeout(() => {
      this.el.nativeElement['style'].width = `calc(${digits.length}*${fontSize})`;
    }, 100);
  }

  addDigit(digit, fresh) {
    const spanList = ['-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
      .map((x) => `<span style="overflow:visible">${x}</span>`)
      .join('');

    this.el.nativeElement.insertAdjacentHTML(
      'beforeend',
      `<span style="transform: translateY(-1000%);overflow:visible" data-value="${digit}">
        ${spanList}
      </span>`
    );

    const firstDigit = this.el.nativeElement.lastElementChild;

    setTimeout(
      () => {
        firstDigit.className = 'visible';
      },
      fresh ? 0 : 1
    );

  }
  getCssVariable(variable: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  }
  removeDigit() {
    const firstDigit = this.el.nativeElement.lastElementChild;

    firstDigit.classList.remove('visible');
    setTimeout(() => {
      firstDigit.remove();
    }, 1);
    /* setTimeout(() => {
      firstDigit.classList.remove('visible');
    }, 1000);

    setTimeout(() => {
      firstDigit.remove();
    }, 1); */
  }

  setup() {
    /*
    if (this.currNum == this.value) return; */
    const digits = this.value.toString().split('');

    for (let i = 0; i < digits.length; i++) {
      this.addDigit('0', true);
    }


    setTimeout(() => this.scrollNumber(digits), 1);
    this.currNum = this.value;
  }

  /* rollToNumber(idx, num) {
    el.style.transform = `translateY(-${100 - num * 10}%)`;
  } */

  update() {
    if (this.currNum == this.value) {
      return;
    }
    if (!this.value) {
      this.value = '0';
    }
    const toDigits = this.value.toString().split('');
    const fromDigits = this.currNum.toString().split('');

    for (let i = fromDigits.length - toDigits.length; i > 0; i--) {
      this.removeDigit();
    }
    for (let i = toDigits.length - fromDigits.length; i > 0; i--) {
      this.addDigit(toDigits[i], false);
    }
    setTimeout(() => this.scrollNumber(toDigits), 1);

    this.currNum = this.value;
  }
}
