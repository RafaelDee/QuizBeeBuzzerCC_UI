import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
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
  gameStateTitles,
} from '../../utilities/services/game-manager.service';
import { NavBarComponent } from '../../templates/nav-bar/nav-bar.component';
import { SimpleModalComponent } from '../../utilities/modal/modal-component/simple-modal.component';
import { ModalService } from '../../utilities/services/modal.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../utilities/services/toast/toast.service';
import { drop } from '../../utilities/cdkHelper';
import {
  SoundEffects,
  SoundFXService,
} from '../../utilities/services/soundFX.service';
import { EmptyContentComponent } from '../../templates/async/empty/empty/empty-content.component';

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
    NavBarComponent,
    FormsModule,
    EmptyContentComponent,
  ],
  templateUrl: './main-screen.component.html',
  styleUrls: ['./main-screen.component.scss'],
})
export class MainScreenComponent implements OnInit {
  static onetime = false;
  title = 'BuzzerControlCenter';
  batteryWarningTreshold = 75;
  brightnessAlertTreshold = 5;
  gameStateTitles = gameStateTitles;
  debugMode = false;
  disableSafteyReveal = false;
  private _edit = false;
  public get edit() {
    return this._edit;
  }
  public set edit(value) {
    this._edit = value;
    this.gameManager.editorMode(value);
  }
  move = false;
  dnrStatus = dnrSeverity;
  GameState = GameState;
  constructor(
    public serialServ: SerialService,
    public gameManager: GameManagerService,
    public sfx: SoundFXService,
    private modal: ModalService,
    private toast: ToastService,private router:Router
  ) {}
  ngOnInit(): void {
    if(!MainScreenComponent.onetime){
      this.gameManager.sendSummary();
      MainScreenComponent.onetime = true;
    }
    //send summary transfered to app component
    this.serialServ.connectionStatus.subscribe((c) => {
      if (c == 'disconnected') {
        this.router.navigate(['/']);
      }
    });
    this.gameManager.editorMode(false);
  }

  setBrightness(event: Event) {
    const brightness = +event.target['value'];
    if (brightness == null) return;
    this.gameManager.setPodiumBrightness(brightness, brightness);
  }
  addPoints(value: number) {
    this.gameManager.addPoints(value);
  }
  isNumberKey(evt) {
    var charCode = evt.which ? evt.which : evt.keyCode;
    if (
      charCode > 31 &&
      (charCode < 48 || charCode > 57) &&
      !['e', 'E', '+', '-'].includes(evt.key)
    )
      return false;
    return true;
  }
  resetState() {
    this.gameManager.resetGame();
  }
  onPodiumChange(podium: Podium, index: number) {
    this.gameManager.onPodiumUpdate(podium, index);
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
  async confirmClearPoints() {
    await SimpleModalComponent.showMessage(
      this.modal,
      'Clearing Points',
      `are you sure you want to <b class="text-danger">Clear Points</b>?`,
      { title: 'Yes', params: { color: 'danger', dismiss: true } },
      { title: 'No', params: { dismiss: true } }
    );
    this.gameManager.clearPodiumPoints();
  }
  async disconnect() {
    await SimpleModalComponent.showMessage(
      this.modal,
      'Disconnecting',
      `are you sure you want to <b class="text-danger">disconnect</b>?`,
      { title: 'Disconnect', params: { color: 'danger', dismiss: true } },
      { title: 'No', params: { dismiss: true } }
    );
    if(this.serialServ.headlessMode){
      this.router.navigate(['/']);
    }
    this.serialServ.disconnect(false);

  }
  pointsChange(index: number, value: number) {
    this.gameManager.pointsChange(index, value);
  }
  alertDimmedPodium() {
    const brightnessPrc = Math.round(this.gameManager.brightnessFce / 2.55);
    if (brightnessPrc <= this.brightnessAlertTreshold) {
      this.toast.showSimple(
        'Reminder',
        `The Podium Brightness is Dim! (at ${brightnessPrc}%)`,
        'warning'
      );
    }
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
