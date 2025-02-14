import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, Type } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { bsColor } from 'src/app/bootstrap_plus/ts/bootstrap';
export interface ButtonParams{
  color?:bsColor;
  dismiss?:boolean;
}
@Component({
  selector: 'simple-modal-footer',
  standalone:true,
  imports:[CommonModule],
  template: `
    <div [ngClass]="class" class="modal-footer" *ngIf="onNegativeClick.observers.length + onPositiveClick.observers.length > 0">
      <button *ngIf="onNegativeClick?.observers?.length > 0" (click)="negativeButtonClick()" type="button" class="btn" [ngClass]="'btn-'+(negativeParams?.color??'secondary')" data-bs-dismiss="modal">{{negativeTitle??'No'}}</button>
      <button *ngIf="onNeutralClick?.observers?.length > 0" (click)="neutralButtonClick()" type="button" class="btn" [ngClass]="'btn-'+(neutralParams?.color??'secondary')">{{neutralTitle??'Exit'}}</button>
      <button *ngIf="onPositiveClick?.observers?.length > 0" (click)="positiveButtonClick()" ngbAutofocus  type="button" class="btn" [ngClass]="'btn-'+(positiveParams?.color??'primary')">{{positiveTitle??'Yes'}}</button>
    </div>
  `,
})
export class SimpleModalFooterComponent {
  //TODO REFACTOR: combine name and listener to one method when calling onNegativeClick('cancel',result=>{});
  @Input() class;
  @Output() onPositiveClick = new EventEmitter();
  @Input() positiveTitle:string;
  @Input() positiveParams:ButtonParams;

  @Output() onNegativeClick = new EventEmitter();
  @Input() negativeTitle:string;
  @Input() negativeParams:ButtonParams;

  @Output() onNeutralClick = new EventEmitter();
  @Input() neutralTitle:string;
  @Input() neutralParams:ButtonParams;
  constructor(public activeModal: NgbActiveModal) {

  }
  negativeButtonClick(){
    if(this.negativeParams?.dismiss)this.activeModal.dismiss();
    this.onNegativeClick.emit()
  }
  positiveButtonClick(){
    if(this.positiveParams?.dismiss)this.activeModal.close();
    this.onPositiveClick.emit()
  }
  neutralButtonClick(){
    if(this.neutralParams?.dismiss)this.activeModal.close();
    this.onNeutralClick.emit()
  }
  setNegativeButton(title:string,prarams?:ButtonParams,event?:(value:any)=>any){
    this.negativeTitle = title;
    this.negativeParams = prarams;
    this.onNegativeClick.subscribe(()=>event?.call(null,null));
  }
  setPositiveButton(title:string,prarams?:ButtonParams,event?:(value:any)=>any){
    this.positiveTitle = title;
    this.positiveParams = prarams;
    this.onPositiveClick.subscribe(()=>event?.call(null,null))
  }
  setNeutralButton(title:string,prarams?:ButtonParams,event?:(value:any)=>any){
    this.neutralTitle = title;
    this.neutralParams = prarams;
    this.onNeutralClick.subscribe(()=>event?.call(null,null))
  }
}

