import { Injectable } from '@angular/core';
import { ReceiveCommands, SendCommands, SerialService } from './serial.service';
import { filter, firstValueFrom } from 'rxjs';
import { dnrSeverity, LEDState, Podium } from '../../values/podium.values';
import { Router } from '@angular/router';

export interface Command {
  command: SendCommands | ReceiveCommands;
  payload: string;
}

@Injectable({
  providedIn: 'root',
})
export class GameManagerService {
  podiumsConnected: boolean;
  podiums: Map<number, Podium> = new Map();
  buttonPlacing: number[] = [];
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
    this.serial.write(SendCommands.Summary);
  }
  swapPodium(podiumA: number, podiumB: number) {
    if (podiumA == podiumB) return;
    this.serial.write(SendCommands.SwapPodium, [podiumA, podiumB].join(','));
    const podiumAData = this.podiums.get(podiumA);
    const podiumBData = this.podiums.get(podiumB);
    if (podiumAData && podiumBData) {
      this.podiums.set(podiumA, podiumBData);
      this.podiums.set(podiumB, podiumAData);
    }
  }
  spotLightPodium(index: number) {
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
  wrongAns() {
    this.setToAllPodiums({ ledState: LEDState.WrongAnswer });
    this.serial.write(SendCommands.WrongAnswer);
  }
  setToAllPodiums(
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
      const val = this.podiums.get(key);
      this.podiums.set(key, { ...val, ...podium });
    }
  }
  setPodium(index: number, podium: Partial<Podium> = null) {
    if (!this.podiums.has(index)) this.podiums.set(index, new Podium());
    if (podium == null) return;

    const pod = { ...this.podiums.get(index), ...podium };
    this.podiums.set(index, pod);
  }

  processCommand(command: Command) {
    switch (command.command) {
      case ReceiveCommands.Dnr:
        const cmd = command.payload.split(',');
        if (cmd.length != 2) {
          console.error(`Invalid command length ${command.payload}`);
          return;
        }
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
      default:
        break;
    }
  }
  battStat(payload: string) {
    const cmd = payload.split(',');
    if (cmd.length != 4) {
      console.error('Invalid command length');
      return;
    }
    const index = +cmd[0];
    const battLevel = +cmd[1];
    const battVoltage = +cmd[2];
    const isCharging = +cmd[3] == 1;
    this.setPodium(index, { battLevel, battVoltage, isCharging });
  }
  podiumPlacement(payload: string) {
    const cmd = payload.split(',');
    if (cmd.length != 2) {
      console.error('Invalid command length');
      return;
    }
    const index = +cmd[0];
    const placing = +cmd[1];
    this.buttonPlacing[index] = placing;
    this.setToAllPodiums({ ledState: LEDState.OFF }, { exclude: [index] });
  }
  podiumAdded(payload: string) {
    const cmd = payload.split(',');
    if (cmd.length != 2) {
      console.error('Invalid command length');
      return;
    }
    const index = +cmd[0];
    console.log(`processing podium ${index}`);
    const status = dnrSeverity[+cmd[1]];
    this.setPodium(index, { dnr: status });
  }
  dnrState() {}
}
