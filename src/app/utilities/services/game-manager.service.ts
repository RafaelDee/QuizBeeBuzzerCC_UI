import { Injectable } from '@angular/core';
import { ReceiveCommands, SendCommands, SerialService } from './serial.service';
import { filter, firstValueFrom } from 'rxjs';
import { dnrSeverity, LEDState, Podium } from '../../values/podium.values';
import { Router } from '@angular/router';
import { constrain } from '../common-utils';
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
export interface Command<T extends SendCommands | ReceiveCommands> {
  command: T;
  payload: string;
}

@Injectable({
  providedIn: 'root',
})
export class GameManagerService {
  podiums: Map<number, Podium> = new Map();
  cuurentGameState: GameState = GameState.Idle;
  buttonPlacing: number[] = [];
  brightnessBtn = 255;
  brightnessFce = 255;
  constructor(private serial: SerialService, private router: Router) {
    this.init();
  }
  private async init() {
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
      this.podiums.set(podiumA, podiumBData);
      this.podiums.set(podiumB, podiumAData);
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
      this.podiums.set(podiumA, podiumBData);
      this.podiums.set(podiumB, podiumAData);
    }
  } */
  podiumInSpotlight = null;
  spotLightPodium(index: number) {
    this.podiumInSpotlight = index;
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
    this.podiumInSpotlight = null;
  }
  readyGame() {
    this.setToAllPodiums({ ledState: LEDState.StandBy });
    this.serial.write(SendCommands.ReadyGameState);
    this.buttonPlacing = [];
  }
  correctAns() {
    this.setToAllPodiums({ ledState: LEDState.CorrectAnswer });
    this.serial.write(SendCommands.CorrectAnswer);
  }
  suspenseAns() {
    this.setToAllPodiums({ ledState: LEDState.SuspenseAnswer });
    this.serial.write(SendCommands.SuspenseGame);
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
  wrongAns() {
    this.setToAllPodiums({ ledState: LEDState.WrongAnswer });
    this.serial.write(SendCommands.WrongAnswer);
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
      this.setPodium(key, podium);
      /* const val = this.podiums.get(key);
      const p = { ...val, ...podium };
      this.podiums.set(key, p);
      this.savePodiumState(p); */
    }
  }
  setPodium(index: number, podium: Partial<Podium> = null) {
    if (!this.podiums.has(index)) this.podiums.set(index, new Podium());
    if (podium == null) return;

    const pod = { ...this.podiums.get(index), ...podium };
    this.savePodiumState(pod);
    this.podiums.set(index, pod);
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
    this.cuurentGameState = state;
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
    if (placing == 0)
      this.setToAllPodiums({ ledState: LEDState.OFF }, { exclude: [index] });
  }
  podiumAdded(payload: string) {
    const cmd = this.splitPayload(payload, 3);
    const index = +cmd[0];
    console.log(`processing podium ${index}`);
    const status = dnrSeverity[+cmd[1]];
    const macAddr = cmd[2];
    const localStrPod = window.localStorage.getItem(macAddr);
    const podium = JSON.parse(localStrPod);
    this.setPodium(index, { ...podium, dnr: status, macAddr });
  }
  savePodiumState(podium: Podium, macAddr: string = null) {
    if (macAddr) podium.macAddr = macAddr;
    window.localStorage.setItem(
      macAddr ?? podium.macAddr,
      JSON.stringify(podium)
    );
  }
  dnrState() {}
}
