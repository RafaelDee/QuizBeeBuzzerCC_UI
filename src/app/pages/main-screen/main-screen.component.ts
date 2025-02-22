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
  gameStateTitles,
} from '../../utilities/services/game-manager.service';
import { NavBarComponent } from '../../templates/nav-bar/nav-bar.component';
import { SimpleModalComponent } from '../../utilities/modal/modal-component/simple-modal.component';
import { ModalService } from '../../utilities/services/modal.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../utilities/services/toast/toast.service';
export class SoundFX {}
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
  ],
  templateUrl: './main-screen.component.html',
  styleUrls: ['./main-screen.component.scss'],
})
export class MainScreenComponent implements OnInit {
  pointsConfig: {
    autoSelect: boolean;
    selectedPodiumIndex: any;
    pointsPreset: number[];
    pointsInput: number;
    editAll: boolean;
    allowNegatives: boolean;
  } = {
    autoSelect: true,
    selectedPodiumIndex: null,
    pointsPreset: [50, 100, 150, 200, 250, 300],
    pointsInput: 0,
    editAll: false,
    allowNegatives: true,
  };
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
    if (!this.edit) {
    }
  }
  move = false;
  dnrStatus = dnrSeverity;
  GameState = GameState;
  constructor(
    public serialServ: SerialService,
    public gameManager: GameManagerService,
    private modal: ModalService,
    private toast: ToastService
  ) {}
  ngOnInit(): void {
    this.gameManager.sendSummary();
    this.gameManager.podiumInSpotlightIndex.subscribe((index) => {
      if (this.pointsConfig.autoSelect)
        this.pointsConfig.selectedPodiumIndex = index ?? null;
    });
  }
  toggleAutoSelect() {
    this.pointsConfig.autoSelect = !this.pointsConfig.autoSelect;
    this.pointsConfig.selectedPodiumIndex =
      this.gameManager.podiumInSpotlightIndex.value;
  }
  setBrightness(event: Event) {
    const brightness = +event.target['value'];
    if (brightness == null) return;
    this.gameManager.setPodiumBrightness(brightness, brightness);
  }
  addPoints(value: number) {
    const points = value;
    const index = this.pointsConfig.selectedPodiumIndex ?? null;
    if (points == null || points == 0) return;
    if (index == null || index < 0) return;
    this.gameManager.setPodiumPoints(
      +index,
      points,
      this.pointsConfig.allowNegatives,
      true
    );
    this.pointsConfig.pointsInput = null;
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
    this.serialServ.disconnect(false);
  }
  pointsChange(index: number, value: number) {
    this.gameManager.setPodiumPoints(
      +index,
      value,
      this.pointsConfig.allowNegatives,
      false
    );
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
