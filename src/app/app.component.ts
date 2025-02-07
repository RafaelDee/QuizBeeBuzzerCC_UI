import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BrowserSerial } from 'browser-serial';
import { SerialService } from './services/serial.service';
import { CommonModule } from '@angular/common';
import { PodiumItemComponent } from './templates/podium-item/podium-item.component';
import { dnrSeverity } from './values/podium.values';
import { GameManagerService } from './services/game-manager.service';
import {CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray} from '@angular/cdk/drag-drop';

const filters = [{ usbVendorId: 4292, usbProductId: 60000 }];
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, PodiumItemComponent,CdkDropList, CdkDrag],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'BuzzerControlCenter';
  dnrStatus = dnrSeverity;
  constructor(
    public serialServ: SerialService,
    public gameManager: GameManagerService
  ) {}

  resetState() {
    this.gameManager.resetGame();
  }
  ready() {
    this.gameManager.readyGame();
  }
  identify(index, item) {
    return index;
  }
  items = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  drop(event: CdkDragDrop<string[]>) {
    this.gameManager.swapPodium(event.previousIndex,event.currentIndex);
  }
  async requestPort() {
    /* if ('serial' in navigator) {
      console.log('SERIAL SUPPORT');
      //const port = await (navigator.serial as any).getPorts();
      const serial = await (navigator.serial as any);
      let port = null;
      try {
        port = await serial.requestPort();
      } catch (err) {
        console.error(err);
        const ports = await serial.getPorts();
        port = ports[1];
      }
      const serialB = new BrowserSerial();
      //await port.open();
      try {
        await serialB.connect();
      } catch (err) {}
      serialB.port = port;
      serialB.readLoop(this.test);
    } */
  }
}
