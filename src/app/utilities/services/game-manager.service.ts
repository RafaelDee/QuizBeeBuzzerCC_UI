import { Injectable } from '@angular/core';
import {
  pairKey,
  ReceiveCommands,
  SendCommands,
  SerialService,
} from './serial.service';
import { openDB } from 'idb';
import { BehaviorSubject, filter, firstValueFrom, min } from 'rxjs';
import { dnrSeverity, LEDState, Podium } from '../../values/podium.values';
import { Router } from '@angular/router';
import { constrain } from '../common-utils';
import {
  PointsSystemReceiveCommands,
  PointsSystemSendCommandsType,
} from './scoring.service';
import { SoundEffects, SoundFXService } from './soundFX.service';
import { IndexedDbService } from './indexed-db.service';
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
export interface Command<T extends SendCommands | ReceiveCommands> {
  command: T;
  payload: string;
}
export interface AudioSettings {
  master: number;
}

export type SoundEffectsSettings = {
  [key in SoundEffects]: number;
};
export interface SettingsConfig {
  secondScrBkg: string;
  secondScrTxtColor: string;
  audio: Partial<AudioSettings & SoundEffectsSettings>;
}
@Injectable({
  providedIn: 'root',
})
export class GameManagerService {
  channel: BroadcastChannel;
  channelRec: BroadcastChannel;
  private _settings: SettingsConfig;
  public get settings() {
    return this._settings;
  }
  setSettings(settings: Partial<SettingsConfig>) {
    this._settings = { ...this._settings, ...settings };
    this.indexedDb.setItem('settings', JSON.stringify(this._settings));
    this.sendSettingsConfig(settings);
  }
  sendSettingsConfig(settings: Partial<SettingsConfig>) {
    if (settings?.secondScrBkg != null) {
      this.channel.postMessage({
        command: 'updateBkg',
        payload: { secondScrBkg: settings.secondScrBkg },
      });
    }
    if (settings?.secondScrTxtColor != null) {
      this.channel.postMessage({
        command: 'updateTxt',
        payload: { textFormat: { color: settings.secondScrTxtColor } },
      });
    }
  }
  podiums: Map<number, Podium> = new Map();
  curentGameState: GameState = GameState.Idle;
  podiumInSpotlightIndex = new BehaviorSubject<number>(null);
  podiumInSpotlight = new BehaviorSubject<Podium>(null);
  buttonPlacing: number[] = [];
  brightnessBtn = 255;
  brightnessFce = 255;

  constructor(
    private serial: SerialService,
    private router: Router,
    private soundFX: SoundFXService,
    private indexedDb: IndexedDbService
  ) {
    this.init();
    this.channel = new BroadcastChannel('sync_channel_points-' + pairKey);
    this.channelRec = new BroadcastChannel(
      'sync_channel_points-send-' + pairKey
    );
    this.channelRec.onmessage = (msg) => {
      console.log(msg?.data);
      const { command, podium } = msg?.data as {
        command: PointsSystemSendCommandsType;
        podium: Podium;
      };
      if (command == null) return;
      switch (command) {
        case 'summary':
          this.podiums.forEach((p, key) => {
            this.channel.postMessage({
              command: 'setPodium',
              payload: { key, podium: p },
            } as PointsSystemReceiveCommands);
          });
          this.channel.postMessage({
            command: 'update',
          } as PointsSystemReceiveCommands);
          break;
      }
    };
  }
  private async init() {
    (async () => {
      this._settings = JSON.parse(await this.indexedDb.getItem('settings'));
      console.log(this._settings);
    })();
    await firstValueFrom(
      this.serial.connectionStatus.pipe(filter((s) => s == 'connected'))
    );
    this.serial.stream.subscribe((s) => {
      if (!s) return;
      this.processCommand(s);
    });
    this.serial.connectionStatus.subscribe((c) => {
      if (c == 'disconnected') {
        this.router.navigate(['/']);
      }
    });
    this.sendSummary();
  }
  sendSummary() {
    this.podiums.clear();
    this.buttonPlacing = [];
    this.podiumInSpotlight.next(null);
    this.podiumInSpotlightIndex.next(null);
    this.serial.write(SendCommands.Summary);
  }
  swapPodium(podiumA: number, podiumB: number) {
    if (podiumA == podiumB) return;
    const podiumAData = this.podiums.get(podiumA);
    const podiumBData = this.podiums.get(podiumB);
    const podAMac = podiumAData.macAddr;
    const podBMac = podiumBData.macAddr;
    podiumAData.macAddr = podBMac;
    podiumBData.macAddr = podAMac;
    if (podiumAData && podiumBData) {
      this.updatePodiums(podiumA, podiumBData);
      this.updatePodiums(podiumB, podiumAData);
    }
    this.savePodiumState(podiumAData, podAMac);
    this.savePodiumState(podiumBData, podBMac);
    this.serial.write(SendCommands.SwapPodium, [podiumA, podiumB].join(','));
  }
  /* swapPodium(podiumA: number, podiumB: number) {
    if (podiumA == podiumB) return;
    const test = Array.from(this.podiums.keys());
    const podPosA = test[podiumA];
    const podPosB = test[podiumB];
    this.serial.write(SendCommands.SwapPodium, [podPosA, podPosB].join(','));
    const podiumAData = this.podiums.get(podiumA);
    const podiumBData = this.podiums.get(podiumB);
    if (podiumAData && podiumBData) {
      this.updatePodiums(podiumA, podiumBData);
      this.updatePodiums(podiumB, podiumAData);
    }
  } */

  spotLightPodium(index: number) {
    this.podiumInSpotlightIndex.next(index);
    this.serial.write(SendCommands.SpotLightPodium, '' + index);
    this.setToAllPodiums({ ledState: LEDState.OFF }, { exclude: [index] });
    this.setToAllPodiums(
      { ledState: LEDState.SpotLight },
      { include: [index] }
    );
  }

  resetGame() {
    this.setToAllPodiums({ ledState: LEDState.StandBy });
    this.serial.write(SendCommands.ResetGameState);
    this.buttonPlacing = [];
    this.podiumInSpotlightIndex.next(null);
  }
  readyGame() {
    this.setToAllPodiums({ ledState: LEDState.StandBy });
    this.serial.write(SendCommands.ReadyGameState);
    this.buttonPlacing = [];
    this.podiumInSpotlightIndex.next(null);
  }
  correctAns() {
    this.setToAllPodiums({ ledState: LEDState.CorrectAnswer });
    this.serial.write(SendCommands.CorrectAnswer);
    this.soundFX.playAudio('correct');
  }
  suspenseAns() {
    this.setToAllPodiums({ ledState: LEDState.SuspenseAnswer });
    this.serial.write(SendCommands.SuspenseGame);
    this.soundFX.playAudio('suspense');
  }
  wrongAns() {
    this.setToAllPodiums({ ledState: LEDState.WrongAnswer });
    this.serial.write(SendCommands.WrongAnswer);

    this.soundFX.playAudio('wrong');
  }
  updatePodiums(key: number, value: Podium) {
    this.podiums.set(key, value);
    this.channel.postMessage({
      command: 'setPodium',
      payload: { key, podium: value },
    } as PointsSystemReceiveCommands);
    this.channel.postMessage({
      command: 'update',
    } as PointsSystemReceiveCommands);
  }
  clearPodiumPoints() {
    //this.setToAllPodiums({ scoring: { points: 0, streak: 0 } });
    //cannot use setToAllPodiums at it links all scoring, tried removing link, but failed
    const keys = Array.from(this.podiums.keys());
    for (let i = 0; i < keys.length; i++) {
      const index = keys[i];
      /* const val = this.podiums.get(key);
      const p = { ...val, ...podium };
      this.updatePodiums(key, p);
      this.savePodiumState(p); */
      if (!this.podiums.has(index)) return;
      const podium = this.podiums.get(index);
      podium.scoring = { points: 0, streak: 0 };
      this.savePodiumState(podium);
      this.updatePodiums(index, podium);
    }
  }
  setPodiumPoints(
    index: number,
    value: number,
    allowNegatives: boolean,
    addPoints: boolean = true
  ) {
    const scoring: {
      points: number;
      streak: number;
    } = this.podiums.get(index)?.scoring ?? { points: 0, streak: 0 };
    if (addPoints) scoring.points += value;
    else scoring.points = value;
    if (!allowNegatives) scoring.points = Math.max(scoring.points, 0);
    this.setPodium(index, { scoring });
  }
  addStreak(index: number) {
    const scoring: {
      points: number;
      streak: number;
    } = this.podiums.get(index)?.scoring ?? { points: 0, streak: 0 };
    scoring.streak++;
    this.setPodium(index, { scoring });
  }
  /**from 0 to 255 */
  setPodiumBrightness(
    brightnessFce: number,
    brightnessBtn: number,
    sendToSerial = true
  ) {
    this.brightnessBtn = constrain(+brightnessBtn, 0, 255);
    this.brightnessFce = constrain(+brightnessFce, 0, 255);
    if (!sendToSerial) return;
    this.serial.write(
      SendCommands.PodiumBrightness,
      [brightnessFce, brightnessBtn].join(',')
    );
  }

  private setToAllPodiums(
    podium: Partial<Podium>,
    options: { include?: number[]; exclude?: number[] } = {}
  ) {
    if (this.podiums == null) return;
    const keys = options.include ?? Array.from(this.podiums.keys());
    if (options.exclude) {
      options.exclude.forEach((e) => {
        const index = keys.indexOf(e);
        if (index > -1) {
          keys.splice(index, 1);
        }
      });
    }
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      this.setPodium(+key, { ...podium });
      /* const val = this.podiums.get(key);
      const p = { ...val, ...podium };
      this.updatePodiums(key, p);
      this.savePodiumState(p); */
    }
  }
  setPodium(index: number, podium: Partial<Podium> = null) {
    if (!this.podiums.has(index)) this.updatePodiums(index, new Podium());
    if (podium == null) return;

    const pod = { ...this.podiums.get(index), ...podium };
    this.savePodiumState(pod);
    this.updatePodiums(index, pod);
  }

  processCommand(command: Command<ReceiveCommands>) {
    switch (command.command) {
      case ReceiveCommands.Dnr:
        const cmd = this.splitPayload(command.payload, 2);
        const index = +cmd[0];
        const status = dnrSeverity[+cmd[1]];
        this.setPodium(index, { dnr: status });
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
      case ReceiveCommands.GameState:
        this.setgameState(command.payload);
        return;
      case ReceiveCommands.PodiumBrightness:
        const payload = this.splitPayload(command.payload, 2);
        this.setPodiumBrightness(
          Number.parseInt(payload[0]),
          Number.parseInt(payload[1]),
          false
        );
        return;
      default:
        break;
    }
  }
  splitPayload(payload: string, count: number) {
    const cmd = payload.split(',');
    if (cmd.length != count) {
      throw new Error(
        `Invalid command length of ${cmd.length}, requred:${count} command: ${cmd}`
      );
    }
    return cmd;
  }
  setgameState(payload: string) {
    const cmd = this.splitPayload(payload, 1);
    const state = Number.parseInt(cmd[0]) ?? null;
    if (state == null || isNaN(state)) return;
    this.curentGameState = state;
  }
  battStat(payload: string) {
    const cmd = this.splitPayload(payload, 4);
    const index = +cmd[0];
    const battLevel = +cmd[1];
    const battVoltage = +cmd[2];
    const isCharging = +cmd[3] == 1;
    this.setPodium(index, { battLevel, battVoltage, isCharging });
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
    this.setPodium(index, { ...podium, dnr: status, macAddr });
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
    if (macAddr) podium.macAddr = macAddr;
    this.indexedDb.setItem(macAddr ?? podium.macAddr, JSON.stringify(podium));
  }
  dnrState() {}
}
