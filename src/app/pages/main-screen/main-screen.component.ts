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
import { dnrSeverity, Podium } from '../../values/podium.values';
import { SerialService } from '../../utilities/services/serial.service';
import {
  GameManagerService,
  GameState,
} from '../../utilities/services/game-manager.service';
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
    @media (min-width: 992px) {
  .row-cols-5 > .col-lg-sp {
    flex: 0 0 auto;
    width: 20%;
  }
}

.cdk-drag-preview {
  box-sizing: border-box;
  border-radius: 4px;
  box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
    0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);
}

.cdk-drag-placeholder {
  opacity: 0;
}
.cdk-item {
  overflow: hidden;
}
.cdk-drag-animating {
  transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
}

  `,
})
export class MainScreenComponent implements OnInit {
  title = 'BuzzerControlCenter';
  private _edit = false;
  public get edit() {
    return this._edit;
  }
  public set edit(value) {
    this._edit = value;
    if (!this.edit) {
    }
  }
  move = false;
  dnrStatus = dnrSeverity;
  GameState = GameState;
  constructor(
    public serialServ: SerialService,
    public gameManager: GameManagerService
  ) {}
  ngOnInit(): void {
    this.gameManager.sendSummary();
  }
  setBrightness(event: Event) {
    const brightness = +event.target['value'];
    if (brightness == null) return;
    this.gameManager.setPodiumBrightness(brightness, brightness);
  }
  resetState() {
    this.gameManager.resetGame();
  }
  onTitleChange(podium: Podium) {
    this.gameManager.savePodiumState(podium);
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
    this.gameManager.swapPodium(+event.previousIndex, +event.currentIndex);
  }
  /* drop(event: CdkDragDrop<string[]>) {
    const test = Array.from(this.gameManager.podiums.keys());
    this.gameManager.swapPodium(
      +test[event.previousIndex],
      +test[event.currentIndex]
    );
  } */
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
