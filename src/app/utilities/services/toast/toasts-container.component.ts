import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToastService } from './toast.service';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-toasts',
  templateUrl: './toasts-container.component.html',
  styleUrls:['./toasts-container.component.scss'],
  standalone: true,
  imports: [NgbToastModule, CommonModule],
  host: {
    class: 'toast-container position-fixed bottom-0 end-0 p-3',
    style: 'z-index: 1200;max-width:min(400px,100%)',
  },
})
export class ToastsContainer {
  toastDelay = 5000;
  constructor(public toastService:ToastService){}
}
