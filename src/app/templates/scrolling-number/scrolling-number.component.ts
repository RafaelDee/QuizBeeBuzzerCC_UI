// scrolling-number.component.ts
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-scrolling-number',
  template: `
    <div class="scrolling-number-container">
      <div
        *ngFor="let digit of digits; let i = index"
        class="digit-column"
      >
        <div
          *ngFor="let num of allNumbers"
          class="digit"
          [@digitAnimation]="{ value: getAnimationState(i, num), params: { duration: animationDuration } }"
        >
          {{ num }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .scrolling-number-container {
      display: flex;
      font-family: monospace;
      overflow: hidden;
    }

    .digit-column {
      position: relative;
      width: 1em;
      height: 1.2em;
      overflow: hidden;
      margin: 0 2px;
    }

    .digit {
      position: absolute;
      width: 100%;
      text-align: center;
    }
  `],
  animations: [
    trigger('digitAnimation', [
      state('active', style({
        transform: 'translateY(0%)'
      })),
      state('inactive', style({
        transform: 'translateY(-1100%)'
      })),
      transition('inactive => active', [
        animate('{{duration}}ms ease-out')
      ])
    ])
  ]
})
export class ScrollingNumberComponent implements OnChanges {
  @Input() value: number = 0;
  @Input() digits: number = 4; // Number of digits to display
  @Input() animationDuration: number = 1000; // Animation duration in ms

  allNumbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  digitValues: number[] = [];

  ngOnInit() {
    this.updateDigitValues();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['value'] || changes['digits']) {
      this.updateDigitValues();
    }
  }

  updateDigitValues() {
    // Reset the digit values array
    this.digitValues = [];

    // Convert the value to a string and pad with leading zeros if necessary
    const valueStr = this.value.toString().padStart(this.digits, '0');

    // Extract each digit
    for (let i = 0; i < this.digits; i++) {
      if (i < valueStr.length) {
        this.digitValues.push(parseInt(valueStr[valueStr.length - 1 - i]));
      } else {
        this.digitValues.push(0);
      }
    }

    // Reverse the array so it displays correctly
    this.digitValues.reverse();
  }

  getAnimationState(digitIndex: number, num: number): string {
    // If this number is the current value for this digit position, make it active
    // Otherwise, make it inactive
    return num === this.digitValues[digitIndex] ? 'active' : 'inactive';
  }
}
