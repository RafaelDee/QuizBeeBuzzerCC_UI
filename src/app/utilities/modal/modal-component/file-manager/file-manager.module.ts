import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileManagerModalComponent } from './file-managerModal.component';
import { NgbModule, NgbNav, NgbNavItem } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [FileManagerModalComponent],
  imports: [
    CommonModule,NgbModule,FormsModule
  ],exports:[FileManagerModalComponent]
})
export class FileManagerModule { }
