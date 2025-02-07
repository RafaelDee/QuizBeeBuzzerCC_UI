import { ChangeDetectionStrategy, Component } from '@angular/core';
/**TODO:
 * detect browser WebSerial support
 *
 */
@Component({
  selector: 'app-setup',
  imports: [],
  templateUrl: './setup.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupComponent {
}
