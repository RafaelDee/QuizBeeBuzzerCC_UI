import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StopPropagationDirective } from './stop-propagation.directive';



@NgModule({
  declarations: [StopPropagationDirective],
  imports: [
    CommonModule
  ],exports:[StopPropagationDirective]
})
export class StopProgpagationModule { }
