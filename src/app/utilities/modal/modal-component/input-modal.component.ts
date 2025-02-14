import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import {
  NgbActiveModal,
} from '@ng-bootstrap/ng-bootstrap';
import { SimpleModalFooterComponent } from '../modal-footer/simple-modal-footer.component';
import { SimpleModalHeaderComponent } from '../modal-header/simple-header.component';
import { ModalComponent } from '../../services/modal.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'simple-modal',
  standalone:true,
  imports:[CommonModule,FormsModule,SimpleModalFooterComponent,SimpleModalHeaderComponent],
  template: `
    <simple-modal-header></simple-modal-header>
    <div class="modal-body">
    <input ngbAutofocus [(ngModel)]="value" (keydown.enter)="footer.positiveButtonClick()" type="text" class="form-control" [attr.placeholder]="placeholder??''" aria-label="Username" aria-describedby="basic-addon1">
    </div>
    <simple-modal-footer></simple-modal-footer>
  `,
})
export class InputModalComponent extends ModalComponent{
  @Input() placeholder;
  @Input() value;
  @Output() valueChange = new EventEmitter();
  @ViewChild(SimpleModalFooterComponent,{static:true}) footer: SimpleModalFooterComponent;
  @ViewChild(SimpleModalHeaderComponent,{static:true}) header: SimpleModalHeaderComponent;

  constructor(public activeModal: NgbActiveModal) {
    super();
  }
  Set(title:string,value:string,placeholder?:string){
    this.header.title = title;
    this.placeholder = placeholder;
    this.value = value;
  }
}

