import { effect, Injectable, signal } from '@angular/core';
import {
  pairKey,
  ReceiveCommands,
  SendCommands,
  SerialService,
} from './serial.service';
import { openDB } from 'idb';
import { BehaviorSubject, filter, firstValueFrom, min } from 'rxjs';
import { dnrSeverity, LEDState, Podium } from '../../values/podium.values';
import { NavigationEnd, NavigationStart, Route, Router } from '@angular/router';
import { constrain } from '../common-utils';
import {
  PointsSystemReceiveCommands,
  PointsSystemSendCommands,
  PointsSystemSendCommandsType,
} from './scoring.service';
import { SoundEffects, SoundFXService } from './soundFX.service';
import { IndexedDbService } from './indexed-db.service';
import { Channel } from '../channelHelper';
export enum GameState {
  // used when nothing is happening, resets the podium interface
  Idle,
  // use to lock podium actions, podium light status is kept
  Lock,
  // ready for podium actions
  QuizReady,
  // button as been pressed, spotlights the podium
  QuizAnswered,
  CorrectAns,
  WrongAns,
  SuspenseAns,
  OffAllPodium,
  Spotlight,
}
export const gameStateTitles: { [key in GameState]: string } = {
  [GameState.Idle]: 'Idle',
  [GameState.Lock]: 'Lock',
  [GameState.QuizReady]: 'Ready',
  [GameState.QuizAnswered]: 'Answered',
  [GameState.CorrectAns]: 'Correct',
  [GameState.WrongAns]: 'Wrong',
  [GameState.SuspenseAns]: 'Suspense',
  [GameState.OffAllPodium]: 'Off Podiums',
  [GameState.Spotlight]: 'Spotlight',
};
export interface PointsConfig {
  autoSelect: boolean;
  selectedPodiumIndex: any;
  pointsPreset: number[];
  pointsInput: number;
  allowNegatives: boolean;
}
export interface Command<T extends SendCommands | ReceiveCommands> {
  command: T;
  payload: string;
}

@Injectable({
  providedIn: 'root',
})
export class GameManagerService {
  channel: Channel<PointsSystemReceiveCommands>;
  channelRec: Channel<PointsSystemSendCommands>;
  pointsConfig: PointsConfig = {
    autoSelect: true,
    selectedPodiumIndex: null,
    pointsPreset: [50, 100, 150, 200, 250, 300],
    pointsInput: 0,
    allowNegatives: true,
  };
  toggleNegativePts() {
    this.pointsConfig.allowNegatives = !this.pointsConfig.allowNegatives;
    this.savePointsConfig();
  }
  toggleAutoSelect() {
    this.pointsConfig.autoSelect = !this.pointsConfig.autoSelect;
    this.pointsConfig.selectedPodiumIndex = this.podiumInSpotlightIndex.value;
    this.savePointsConfig();
  }
  podiums = signal<Map<number, Podium>>(new Map());
  /* podiums: BehaviorSubject<Map<number, Podium>> = new BehaviorSubject(
    new Map(),
  ); */
  curentGameState = new BehaviorSubject<GameState>(GameState.Idle);
  podiumInSpotlightIndex = new BehaviorSubject<number>(null);
  podiumInSpotlight = new BehaviorSubject<Podium>(null);
  buttonPlacing: number[] = [];
  brightnessBtn = 255;
  brightnessFce = 255;
  firmwareVersion = 'Unknown';
  logoMode = false;
  private _isEdit = false;
  public get isEdit() {
    return this._isEdit;
  }
  private set isEdit(value) {
    this._isEdit = value;
  }
  summarizing = false;
  constructor(
    private serial: SerialService,
    private soundFX: SoundFXService,
    private indexedDb: IndexedDbService,
  ) {
    /* router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        this.editorMode(false);
      }
    }); */
    this.init();
    this.channel = new Channel('sync_channel_points-' + pairKey);
    this.channelRec = new Channel('sync_channel_points-send-' + pairKey);
    this.podiumInSpotlightIndex.subscribe((index) => {
      if (this.pointsConfig.autoSelect)
        this.pointsConfig.selectedPodiumIndex = index ?? null;
      this.channel.postMessage({
        command: 'spotlight',
        payload: index,
      });
    });
    effect(() => {
      for (let podium of this.podiums()) {
        this.savePodiumState(podium[1]);
        this.channel.postMessage({
          command: 'setPodium',
          payload: { key: podium[0], podium: podium[1] },
        } as PointsSystemReceiveCommands);
      }
      this.channel.postMessage({
        command: 'update',
      } as PointsSystemReceiveCommands);
    });
    this.channelRec.onmessage = (msg) => {
      console.log(msg?.data);
      const { command, podium } = msg?.data as {
        command: PointsSystemSendCommandsType;
        podium: Podium;
      };
      if (command == null) return;
      switch (command) {
        case 'summary':
          if (this.summarizing) return;
          this.summarizing = true;
          this.podiums().forEach((p, key) => {
            this.channel.postMessage({
              command: 'setPodium',
              payload: { key, podium: p },
            } as PointsSystemReceiveCommands);
          });
          this.channel.postMessage({
            command: 'update',
          });
          this.channel.postMessage({
            command: 'editor',
            payload: this.isEdit,
          });
          if (this.podiumInSpotlightIndex.value != null) {
            this.channel.postMessage({
              command: 'spotlight',
              payload: this.podiumInSpotlightIndex.value,
            });
          }
          this.summarizing = false;
          break;
      }
    };
  }
  addPoints(value: number) {
    const points = value;
    const index =
      Number.parseInt(this.pointsConfig.selectedPodiumIndex) ?? null;
    if (points == null || points == 0 || isNaN(points)) return;
    if (index == null || index < 0 || isNaN(index)) return;
    this.setPodiumPoints(
      +index,
      points,
      this.pointsConfig.allowNegatives,
      true,
    );
    this.pointsConfig.pointsInput = null;
  }
  setLogoMode(value: boolean) {
    if (!value && this.isEdit) return;
    this.logoMode = value;
    this.channel.postMessage({
      command: 'editor',
      payload: this.isEdit || this.logoMode,
    });
  }
  editorMode(value: boolean) {
    this.isEdit = value;
    this.logoMode = value;
    this.channel.postMessage({
      command: 'editor',
      payload: this.isEdit,
    });
  }
  pointsChange(index: number, value: number) {
    this.setPodiumPoints(
      +index,
      value,
      this.pointsConfig.allowNegatives,
      false,
    );
  }

  refresh(previewMode: boolean = false) {
    this.channel.postMessage({
      command: 'refresh',
      payload: previewMode,
    } as PointsSystemReceiveCommands);
  }
  forceSync() {
    this.podiums().forEach((p, key) => {
      this.channel.postMessage({
        command: 'setPodium',
        payload: { key, podium: p },
      } as PointsSystemReceiveCommands);
    });
    this.channel.postMessage({
      command: 'update',
    } as PointsSystemReceiveCommands);
  }
  private async init() {
    this.loadPointsConfig();
    await firstValueFrom(
      this.serial.connectionStatus.pipe(filter((s) => s == 'connected')),
    );
    this.serial.stream.subscribe((s) => {
      if (!s) return;
      this.processCommand(s);
    });

    this.sendSummary();
    if (this.serial.headlessMode) {
      //load all podiums in storage, but cannot due to not having index
    }
  }
  summaryMode = false;
  sendSummary() {
    this.summaryMode = true;
    this.podiums.set(new Map());
    this.buttonPlacing = [];
    this.podiumInSpotlight.next(null);
    this.podiumInSpotlightIndex.next(null);
    this.serial.write(SendCommands.Summary);
  }
  swapPodium(currentIndex: number, targetIndex: number) {
    if (currentIndex == targetIndex) return;
    this.podiums.update((podiums) => {
      const currentPodium = podiums.get(currentIndex);
      if (!currentPodium) return podiums;

      const nextPodiumsv2 = new Map(podiums);
      const shiftLeft = currentIndex < targetIndex;
      if (!shiftLeft) {
        for (let i = currentIndex; i > targetIndex; i--) {
          const shiftedPodium = podiums.get(i - 1);
          if (!shiftedPodium) continue;
          nextPodiumsv2.set(i, shiftedPodium);
        }
      } else {
        for (let i = currentIndex; i < targetIndex; i++) {
          const shiftedPodium = podiums.get(i + 1);
          if (!shiftedPodium) continue;
          nextPodiumsv2.set(i, shiftedPodium);
        }
      }
      nextPodiumsv2.set(targetIndex, currentPodium);
      return nextPodiumsv2;
    });
    this.serial.write(
      SendCommands.SwapPodium,
      [currentIndex, targetIndex].join(','),
    );
  }

  spotLightPodium(index: number) {
    this.sendRevealAns(null);
    this.podiumInSpotlightIndex.next(index);
    this.serial.write(SendCommands.SpotLightPodium, '' + index);
    this.setToAllPodiums({ ledState: LEDState.OFF }, { exclude: [index] });
    this.setToAllPodiums(
      { ledState: LEDState.SpotLight },
      { include: [index] },
    );
  }
  ansReveal = new BehaviorSubject<boolean>(null);
  resetGame() {
    this.setToAllPodiums({ ledState: LEDState.StandBy });
    this.serial.write(SendCommands.ResetGameState);
    this.buttonPlacing = [];
    this.podiumInSpotlightIndex.next(null);
    this.sendRevealAns(null);
    this.soundFX.stopAudio();
  }
  sendRevealAns(value: boolean) {
    this.ansReveal.next(value);
    this.channel.postMessage({
      command: 'ansReveal',
      payload: value,
    });
  }
  clearRevealAns() {
    this.sendRevealAns(null);
  }
  readyGame() {
    this.setToAllPodiums({ ledState: LEDState.StandBy });
    this.serial.write(SendCommands.ReadyGameState);
    this.buttonPlacing = [];
    this.podiumInSpotlightIndex.next(null);

    this.sendRevealAns(null);
    this.soundFX.stopAudio();
  }
  correctAns() {
    this.sendRevealAns(null);
    this.setToAllPodiums({ ledState: LEDState.CorrectAnswer });
    this.serial.write(SendCommands.CorrectAnswer);
    this.soundFX.playAudio('correct');

    this.sendRevealAns(true);
  }
  suspenseAns() {
    this.setToAllPodiums({ ledState: LEDState.SuspenseAnswer });
    this.serial.write(SendCommands.SuspenseGame);
    this.soundFX.playAudio('suspense');
  }
  wrongAns() {
    this.sendRevealAns(null);
    this.setToAllPodiums({ ledState: LEDState.WrongAnswer });
    this.serial.write(SendCommands.WrongAnswer);

    this.soundFX.playAudio('wrong');

    this.sendRevealAns(false);
  }

  clearPodiumPoints() {
    this.sendRevealAns(null);
    //this.setToAllPodiums({ scoring: { points: 0, streak: 0 } });
    //cannot use setToAllPodiums at it links all scoring, tried removing link, but failed
    this.podiums.update((podiums) => {
      podiums.forEach((p, key) => {
        p.scoring = { points: 0, streak: 0 };
        //this.savePodiumState(p);
      });
      return podiums;
    });
  }
  addPoidumConfigPoints(value: number) {
    if (value == null || isNaN(value)) return;
    this.pointsConfig.pointsPreset.push(value);
    this.savePointsConfig();
  }
  removePodiumConfigPoints(index: number) {
    this.pointsConfig.pointsPreset.splice(index, 1);
    this.savePointsConfig();
  }
  setPodiumPoints(
    index: number,
    value: number,
    allowNegatives: boolean,
    addPoints: boolean = true,
  ) {
    this.sendRevealAns(null);
    this.podiums.update((podiums) => {
      const targetPodium = podiums.get(index);
      if (!targetPodium) return podiums;
      const scoring: {
        points: number;
        streak: number;
      } = { ...(targetPodium.scoring ?? { points: 0, streak: 0 }) };
      if (addPoints) scoring.points += value;
      else scoring.points = value;
      if (!allowNegatives) scoring.points = Math.max(scoring.points, 0);
      podiums.set(index, { ...targetPodium, scoring });
      return podiums;
    });
  }
  async loadPointsConfig() {
    const json = await this.indexedDb.getItem('pointsConfig');
    if (!json) return;
    const { pointsPreset, ...other } = JSON.parse(json) as PointsConfig;
    if (other) {
      this.pointsConfig = { ...this.pointsConfig, ...other };
    }
    if (pointsPreset) {
      this.pointsConfig.pointsPreset = pointsPreset;
    }
  }
  savePointsConfig() {
    const { allowNegatives, pointsPreset, autoSelect } = this.pointsConfig;
    this.indexedDb.setItem(
      'pointsConfig',
      JSON.stringify({ allowNegatives, pointsPreset, autoSelect }),
    );
  }
  addStreak(index: number) {
    this.podiums.update((podiums) => {
      const targetPodium = podiums.get(index);
      if (!targetPodium) return podiums;
      const scoring = { ...(targetPodium.scoring ?? { points: 0, streak: 0 }) };
      scoring.streak += 1;
      podiums.set(index, { ...targetPodium, scoring });
      return podiums;
    });
  }
  /**from 0 to 255 */
  setPodiumBrightness(
    brightnessFce: number,
    brightnessBtn: number,
    sendToSerial = true,
  ) {
    this.brightnessBtn = constrain(+brightnessBtn, 0, 255);
    this.brightnessFce = constrain(+brightnessFce, 0, 255);
    if (!sendToSerial) return;
    this.serial.write(
      SendCommands.PodiumBrightness,
      [brightnessFce, brightnessBtn].join(','),
    );
  }

  sendDeviceInfo() {
    this.serial.write(SendCommands.SendDeviceInfo);
  }
  private setToAllPodiums(
    podium: Partial<Podium>,
    options: { include?: number[]; exclude?: number[] } = {},
  ) {
    const filterKeys = (keys: number[]) => {
      if (!options.exclude?.length) return keys;
      const excluded = new Set(options.exclude);
      return keys.filter((key) => !excluded.has(key));
    };

    if (this.podiums() == null) return;
    this.podiums.update((podiums) => {
      const keys = filterKeys(options.include ?? Array.from(podiums.keys()));
      const nextPodiumsv2 = new Map(podiums);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const targetPodium = nextPodiumsv2.get(key);
        if (!targetPodium) continue;
        nextPodiumsv2.set(key, { ...targetPodium, ...podium });
      }
      return nextPodiumsv2;
    });
  }
  addPodiumHeadlessMode() {
    if (this.podiums().size >= 5) return;

    const nextPodiumsv2 = new Map<number, Podium>();
    for (let index = 0; index < 5; index++) {
      nextPodiumsv2.set(index, new Podium(index + ''));
    }

    this.podiums.set(nextPodiumsv2);
  }
  clearMemory() {
    this.podiums.set(new Map());
    this.serial.write(SendCommands.ClearPodium);
    this.indexedDb.clear();
    localStorage.clear();
    this.pointsConfig = {
      autoSelect: true,
      selectedPodiumIndex: null,
      pointsPreset: [50, 100, 150, 200, 250, 300],
      pointsInput: 0,
      allowNegatives: true,
    };
  }
  setVersion(cmdP: string) {
    const payload = this.splitPayload(cmdP, 1);
    this.firmwareVersion = payload[0] ?? 'Unknown';
  }
  processCommand(command: Command<ReceiveCommands>) {
    switch (command.command) {
      case ReceiveCommands.Dnr:
        const cmd = this.splitPayload(command.payload, 2);
        const index = +cmd[0];
        const status = dnrSeverity[+cmd[1]];
        this.podiums.update((podiums) => {
          const targetPodium = podiums.get(index);
          if (!targetPodium) return podiums;
          podiums.set(index, { ...targetPodium, dnr: status });
          return podiums;
        });
        break;
      case ReceiveCommands.PodiumAdded:
        this.podiumAdded(command.payload);
        return;
      case ReceiveCommands.PodiumPlacement:
        this.podiumPlacement(command.payload);
        return;
      case ReceiveCommands.BattStat:
        this.battStat(command.payload);
        return;
      case ReceiveCommands.DeviceInfo:
        this.setVersion(command.payload);
        return;
      case ReceiveCommands.GameState:
        if (this.summaryMode) {
          this.summaryMode = false;
          this.channel.postMessage({
            command: 'update',
          } as PointsSystemReceiveCommands);
        }
        this.setgameState(command.payload);
        return;
      case ReceiveCommands.PodiumBrightness:
        const payload = this.splitPayload(command.payload, 2);
        this.setPodiumBrightness(
          Number.parseInt(payload[0]),
          Number.parseInt(payload[1]),
          false,
        );
        return;
      default:
        break;
    }
  }
  splitPayload(payload: string, count: number) {
    if (!payload) {
      throw new Error('Payload is empty or undefined');
    }
    const cmd = payload.split(',');

    if (cmd.length != count) {
      throw new Error(
        `Invalid command length of ${cmd.length}, requred:${count} command: ${payload}`,
      );
    }
    return cmd;
  }
  setgameState(payload: string) {
    const cmd = this.splitPayload(payload, 1);
    const state = Number.parseInt(cmd[0]) ?? null;
    if (state == null || isNaN(state)) return;
    this.curentGameState.next(state);
  }
  battStat(payload: string) {
    const cmd = this.splitPayload(payload, 4);
    const index = +cmd[0];
    const battLevel = +cmd[1];
    const battVoltage = +cmd[2];
    const isCharging = +cmd[3] == 1;
    this.podiums.update((podiums) => {
      const targetPodium = podiums.get(index);
      if (!targetPodium) return podiums;
      podiums.set(index, {
        ...targetPodium,
        battLevel,
        battVoltage,
        isCharging,
      });
      return podiums;
    });
  }

  onBtnPress(index: number) {
    //making a bypass, not optimizing code
    let highestNum = -1;
    this.buttonPlacing.forEach((e) => {
      if (e > highestNum) highestNum = e;
    });
    highestNum++;
    this.podiumPlacement([index, highestNum].join(','));
  }
  podiumPlacement(payload: string) {
    const cmd = this.splitPayload(payload, 2);
    const index = +cmd[0];
    const placing = +cmd[1];
    this.buttonPlacing[index] = placing;
    if (placing != 0) return;
    this.soundFX.playAudio('answer');
    this.podiumInSpotlightIndex.next(index);
    this.setToAllPodiums({ ledState: LEDState.OFF }, { exclude: [index] });
  }
  async podiumAdded(payload: string) {
    const cmd = this.splitPayload(payload, 3);
    const index = +cmd[0];
    console.log(`processing podium ${index}`);
    const status = dnrSeverity[+cmd[1]];
    const macAddr = cmd[2];
    const localStrPod = await this.indexedDb.getItem(macAddr);
    const podium = JSON.parse(localStrPod);
    this.podiums.update((podiums) => {
      return podiums.set(index, { ...podium, dnr: status, macAddr });
    });
  }
  onPodiumUpdate(podium: Podium, index: number, macAddr: string = null) {
    this.savePodiumState(podium, macAddr);
    this.channel.postMessage({
      command: 'setPodium',
      payload: { key: index, podium },
    } as PointsSystemReceiveCommands);
    this.channel.postMessage({
      command: 'update',
    } as PointsSystemReceiveCommands);
  }
  savePodiumState(podium: Podium, macAddr: string = null) {
    if (this.serial.headlessMode) return;
    if (macAddr) podium.macAddr = macAddr;
    this.indexedDb.setItem(macAddr ?? podium.macAddr, JSON.stringify(podium));
  }
  dnrState() {}
}
