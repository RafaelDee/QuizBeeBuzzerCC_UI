import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { BrowserSerial } from 'browser-serial';
import { CommonModule } from '@angular/common';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
  moveItemInArray,
  CdkDragHandle,
} from '@angular/cdk/drag-drop';
import { PodiumItemComponent } from '../../templates/podium-item/podium-item.component';
import { dnrSeverity } from '../../values/podium.values';
import { SerialService } from '../../utilities/services/serial.service';
import { GameManagerService } from '../../utilities/services/game-manager.service';
@Component({
  selector: 'app-main-screen',
  imports: [
    RouterOutlet,
    RouterLink,
    CommonModule,
    PodiumItemComponent,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
  ],
  templateUrl: './main-screen.component.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class MainScreenComponent {
  title = 'BuzzerControlCenter';
  edit = false;
  move = false;
  dnrStatus = dnrSeverity;
  constructor(
    public serialServ: SerialService,
    public gameManager: GameManagerService
  ) {
    this.gameManager.podiumsConnected
    this.gameManager.sendSummary();
  }

  resetState() {
    this.gameManager.resetGame();
  }
  ready() {
    this.gameManager.readyGame();
  }
  identify(index, item) {
    return index;
  }
  items = [
    'Zero',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
  ];
  drop(event: CdkDragDrop<string[]>) {
    this.gameManager.swapPodium(event.previousIndex, event.currentIndex);
  }
  async requestPort() {
    await this.serialServ.requestPort();
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
