import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ConnectionStatus,
  SerialService,
} from '../utilities/services/serial.service';
import { CommonModule } from '@angular/common';
import { filter, first, firstValueFrom, tap } from 'rxjs';
import { ToastService } from '../utilities/services/toast/toast.service';
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
export class SetupComponent implements OnInit {
  connMsg: { [key in ConnectionStatus]: string } = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected',
    'disconnected-no-recon': 'Disconnected',
  };
  constructor(
    public serialServ: SerialService,
    private router: Router,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {}
  ngOnInit(): void {
    this.waitForConnection();
    this.initialize(true);
  }
  async waitForConnection() {
    await firstValueFrom(
      this.serialServ.connectionStatus.pipe(
        tap((test) => console.log(test)),
        filter((status) => status === 'connected'),
        first()
      )
    );
    this.router.navigate([this.route.snapshot.queryParams?.['from'] ?? 'main']);
  }
  async initialize(auto: boolean = false) {
    if (
      auto &&
      this.serialServ.connectionStatus.value == 'disconnected-no-recon'
    )
      return;
    try {
      await this.serialServ.initializeSerial();
    } catch (err) {
      this.toast.showErrorOperation(err);
    }
  }
}
