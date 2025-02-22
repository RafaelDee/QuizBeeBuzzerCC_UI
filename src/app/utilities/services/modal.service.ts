import { Injectable, TemplateRef, Type } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NgbModal, NgbModalOptions, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService extends NgbModal {
  // Override the open method
  override open<T extends ModalComponent>(content: Type<T> | TemplateRef<T>, options?: NgbModalOptions): ModalRef<T> {
    // Your custom implementation here, or call the parent method using super.open(...)
    // Make sure to have the same method signature as in NgbModal
    // Example:
    const modalRef = super.open(content, options);
    if (modalRef.componentInstance) modalRef.componentInstance.modal = modalRef;
    return modalRef;
  }
  constructor(router: Router, route: ActivatedRoute) {
    super();
    router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((url) => {
      super.dismissAll();
    });
  }
  // Add your additional methods or modifications here
}

export declare class ModalRef<T> extends NgbModalRef {
  override get componentInstance(): T;
}
// export class Modal {
//   static instance: ModalService;
//   //TODO OPTIMIZATION: Hacky way to get modal without injecting service and give autocomplete to contentRef
//   constructor(ngbModal: NgbModal) {
//     if (!Modal.instance) Modal.instance = ngbModal;
//   }
// }
export class ModalComponent {
  modal: ModalRef<this>;
  /* static showMessage(modal:ModalService,
    title: string,
    content: string,
    positiveButton?:{title:string,params:ButtonParams},negativeButton?:{title:string,params:ButtonParams}
  ); */
}
