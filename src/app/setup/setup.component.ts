import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { SerialService } from '../utilities/services/serial.service';
import { CommonModule } from '@angular/common';
import { filter, first, firstValueFrom } from 'rxjs';
/**TODO:
 * detect browser WebSerial support
 *
 */
@Component({
  selector: 'app-setup',
  imports: [CommonModule],
  templateUrl: './setup.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetupComponent {
  constructor(public serialServ: SerialService, private router: Router) {
    this.initialize(true);
    this.waitForConnection();
  }
  async waitForConnection() {
    await firstValueFrom(
      this.serialServ.connectionStatus.pipe(first((f) => f == 'connected'))
    );
    this.router.navigate(['main']);
  }
  async initialize(auto:boolean = false) {
    if(auto && this.serialServ.connectionStatus.value == 'disconnected-no-recon')return;
    this.serialServ.initializeSerial();
  }
}
