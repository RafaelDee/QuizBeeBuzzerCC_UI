import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'simple-modal-header',
  standalone:true,
  template: ` <div class="modal-header">
    <h4 class="modal-title">{{title}}</h4>
    <button
      type="button"
      class="btn-close"
      aria-label="Close"
      (click)="activeModal.dismiss()"
    ></button>
  </div>`,
})
export class SimpleModalHeaderComponent {
  @Input() title:string;

  constructor(public activeModal: NgbActiveModal) {}
}
