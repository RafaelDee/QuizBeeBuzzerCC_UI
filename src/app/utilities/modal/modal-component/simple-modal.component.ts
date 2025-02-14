import { AfterViewInit, Component, Input, OnInit, SecurityContext, ViewChild } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ButtonParams, SimpleModalFooterComponent } from '../modal-footer/simple-modal-footer.component';
import { SimpleModalHeaderComponent } from '../modal-header/simple-header.component';
import { ModalComponent, ModalService } from '../../services/modal.service';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'simple-modal',
  standalone: true,
  imports: [CommonModule, SimpleModalFooterComponent, SimpleModalHeaderComponent],
  template: `
    <simple-modal-header></simple-modal-header>
    <div class="modal-body">
      <div [innerHTML]="content"></div>
    </div>
    <simple-modal-footer></simple-modal-footer>
  `,
})
export class SimpleModalComponent extends ModalComponent {
  @Input() content;
  @ViewChild(SimpleModalFooterComponent, { static: true })
  footer: SimpleModalFooterComponent;
  @ViewChild(SimpleModalHeaderComponent, { static: true })
  header: SimpleModalHeaderComponent;

  constructor(public activeModal: NgbActiveModal, private sfc: DomSanitizer) {
    super();
  }

  Set(title: string, content: any) {
    this.header.title = title;
    this.content = content;
  }
  static showMessage(
    modal: ModalService,
    title: string,
    content: string,
    positiveButton?: { title: string; params: ButtonParams },
    negativeButton?: { title: string; params: ButtonParams }
  ) {
    return new Promise<void>((resolve, reject) => {
      const modalRef = modal.open(SimpleModalComponent);
      const comp = modalRef.componentInstance;
      comp.Set(title, comp.sfc.sanitize(SecurityContext.HTML, content));
      if (positiveButton)
        comp.footer.setPositiveButton(positiveButton?.title, positiveButton?.params, () => {
          resolve();
          modalRef.close();
        });
      if (negativeButton)
        comp.footer.setNegativeButton(negativeButton?.title, negativeButton?.params, () => {
          reject('user cancelled the operation');
          modalRef.dismiss();
        });
      let disSub = modalRef.dismissed.subscribe(() => {
        reject('user dismissed the operation');
        disSub.unsubscribe();
      });
    });
  }
}
