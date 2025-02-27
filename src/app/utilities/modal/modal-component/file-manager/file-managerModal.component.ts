import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormControl, FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../../../services/modal.service';
import { SimpleModalFooterComponent } from '../../modal-footer/simple-modal-footer.component';
import { SimpleModalHeaderComponent } from '../../modal-header/simple-header.component';

@Component({
  selector: 'file-manager-modal',
  standalone: true,
  imports: [
    CommonModule,
    NgbModule,
    FormsModule,
    SimpleModalFooterComponent,
    SimpleModalHeaderComponent,
  ],
  template: `
    <simple-modal-header style="padding-bottom: 30px;"></simple-modal-header>
    <div class="modal-body" style="margin-top: -36px;pointer-events:none;">
      <div style="margin-left: -16px;margin-right: -16px;margin-top: -20px;">
        <ul
          ngbNav
          #nav="ngbNav"
          [(activeId)]="activeTab"
          class="nav nav-tabs"
          style="pointer-events:all;width:fit-content;"
        >
          <li [ngbNavItem]="1" *ngIf="onFileDrop.observed || onDrop.observed">
            <a ngbNavLink>Upload</a>
            <ng-template ngbNavContent>
              <div
                class="d-flex flex-column dropbox align-items-center justify-content-center position-relative"
                style="height: 200px;"
              >
                <input
                  type="file"
                  #uploader
                  class="dropboxInput position-absolute w-100 h-100 top-0 left-0"
                  [accept]="accept"
                  (change)="
                    onFileDrop.emit(uploader.files);
                    onDrop.emit(uploader.files);
                    uploader.value = ''
                  "
                  [multiple]="multiple ?? false"
                />
                <i class="fas fa-file-upload fa-2x mb-2 d-block"></i>
                <span class="small"
                  >drop file here <br />
                  (Click to Upload)</span
                >
              </div>
            </ng-template>
          </li>
          <li [ngbNavItem]="2" *ngIf="onURLDrop.observed || onDrop.observed">
            <a ngbNavLink>Link</a>
            <ng-template ngbNavContent>
              <div class="form-floating">
                <input
                  type="url"
                  class="form-control"
                  id="floatingUrl"
                  placeholder="URL"
                  [(ngModel)]="urlInput"
                />
                <label for="floatingUrl">URL</label>
              </div>
            </ng-template>
          </li>
        </ul>
        <div
          [ngbNavOutlet]="nav"
          class="mt-3 mx-3"
          style="pointer-events: all;"
        ></div>
      </div>
    </div>
    <simple-modal-footer
      *ngIf="activeTab != 1"
      positiveTitle="Upload"
      (onPositiveClick)="onURLDrop.emit(urlInput); onDrop.emit(urlInput)"
    ></simple-modal-footer>
  `,
  styles: [
    `
      .dropbox {
        border: 2px dashed var(--bs-body-color);
        border-radius: 0.5rem;
      }
      .dropboxInput {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        height: 100%;
        width: 100%;
        opacity: 0;
        cursor: pointer;
      }
    `,
  ],
})
export class FileManagerModalComponent
  extends ModalComponent
  implements OnInit
{
  @ViewChild('tabs') tabs: ElementRef;
  //TODO ADD: verify url link and add cloud file manager
  @Output() onFileDrop = new EventEmitter<FileList>();
  @Output() onURLDrop = new EventEmitter<string>();
  @Output() onDrop = new EventEmitter<string | FileList>();
  //add filetype selection, then string to other file type
  //assign modal title according to file type
  @Input() accept: string;
  @Input() multiple: boolean;
  urlInput;
  activeTab: number;
  ngOnInit(): void {}
  /*TODO: PROBLEM
    file manager needs a way to asynchronously upload the file then return the file,
    it must
    - alert user when exiting the page
    - handle multiple files
    - handle multiple instances

    Idea 1 (prefered)
      when file got dropped, the modal will hide and send return the info and the recipient will hande the upload

      create a class called uploadmanager
      will get a fileupload
      and expose parameters
      -percentage
      -fileuploader
      - onSend
      - onComplete
      - ...
      NOTE: for async task, this will run as service and the onSend will directly send the image to database, regardles if the other content got edited
    Idea 2
      when file got dropped, the modal will be static and wait until the file is completed and return the file URL
  */
}
