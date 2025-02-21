import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { LoadingViews } from '../../../utilities/async/async-views';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="h-100 d-flex align-items-center flex-column justify-content-center"
    >
      <div>
        <div class="spinner-border " role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div>
        <div
          #percentBar
          *ngIf="percentage"
          class="progress"
          role="progressbar"
          [attr.aria-valuenow]="_percentage"
          aria-label="Basic example"
          aria-valuemin="0"
          aria-valuemax="100"
          style="width: 50%;
    min-width: 200px;
    max-width: 350px;"
        >
          <div
            #percentage
            class="progress-bar"
            [style.width.%]="_percentage"
          ></div>
        </div>
      </div>
    </div>
  `,
})
export class LoadingComponent extends LoadingViews implements OnInit {
  /*  override set percentage(value: number) {
    this.cdr.detach(); // Detach the change detector
    this._percentage = value;
    this.cdr.detectChanges(); // Reattach and detect changes
  } */
  ngOnInit(): void {}
  constructor(private cdr: ChangeDetectorRef) {
    super();
  }
  updatePercentage(newPercentage: number) {
    this.cdr.detach(); // Detach the change detector
    this.percentage = newPercentage;
    this.cdr.detectChanges(); // Reattach and detect changes
  }
}
