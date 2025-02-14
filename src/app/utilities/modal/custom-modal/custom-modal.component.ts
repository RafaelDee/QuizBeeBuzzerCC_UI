import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { AsyncDirective } from "src/app/utilities/async/acync.directive";
import { ModalComponent } from "src/app/utilities/services/modal.service";
import { SimpleModalFooterComponent } from "../modal-footer/simple-modal-footer.component";
import { SimpleModalHeaderComponent } from "../modal-header/simple-header.component";

@Component({
  selector: 'app-custom-modal',
  standalone: true,
  imports: [
    CommonModule,
    SimpleModalFooterComponent, AsyncDirective,
    SimpleModalHeaderComponent
],
  template: `
  <simple-modal-header class="mb-3"></simple-modal-header>
  <ng-template async></ng-template>
  <simple-modal-footer></simple-modal-footer>
  `,
  styleUrls: ['./custom-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomModalComponent extends ModalComponent {
  @ViewChild(SimpleModalFooterComponent, { static: true })
  footer: SimpleModalFooterComponent;
  @ViewChild(SimpleModalHeaderComponent, { static: true })
  header: SimpleModalHeaderComponent;
  @ViewChild(AsyncDirective, { static: true }) templateRenderer!: AsyncDirective;
  private _template:Type<any> | TemplateRef<any>;
  set template(value:Type<any> | TemplateRef<any>) {
    this._template = value;
    if(this.template instanceof TemplateRef){
      this.templateRenderer.viewContainerRef.createEmbeddedView(this.template);
      }else{
        this.templateRenderer.viewContainerRef.createComponent(this.template);
      }
  }
  get template(){
    return this._template;
  }
}
