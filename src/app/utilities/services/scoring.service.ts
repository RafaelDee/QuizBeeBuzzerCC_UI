import { Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { InterConnectPacket, pairKey } from './serial.service';
import { Podium } from '../../values/podium.values';
import { SettingsConfig } from './game-manager.service';
import { IndexedDbService } from './indexed-db.service';
export class PodiumScore {
  title: string;
  score: { points: number; streak: number } = { points: 0, streak: 0 };
}
export type PointsSystemReceiveCommandsType =
  | 'setPodium'
  | 'update'
  | 'updateBkg'
  | 'updateTxt';
export interface PointsSystemReceiveCommands {
  command: PointsSystemReceiveCommandsType;
  payload?: any;
}
export type PointsSystemSendCommandsType = 'summary';
@Injectable({
  providedIn: 'root',

})
export class ScoringService {
  spotlitPodium = null;
  bkgImg = new BehaviorSubject<string>(null);
  textFormat = new BehaviorSubject<{ color: string }>({ color: 'black' });
  private _isLeader = new BehaviorSubject<boolean>(null);
  public get isLeader() {
    return this._isLeader;
  }
  private set isLeader(value) {
    this._isLeader = value;
  }
  channel: BroadcastChannel;
  channelSend: BroadcastChannel;
  _podiums: Map<number, Podium> = new Map();
  podiums = new BehaviorSubject<Map<number, Podium>>(null);
  constructor(private indexedDb: IndexedDbService) {
    this.channel = new BroadcastChannel('sync_channel_points-' + pairKey);
    this.channelSend = new BroadcastChannel(
      'sync_channel_points-send-' + pairKey
    );
    this.channel.onmessage = (msg) => {
      console.log(msg?.data);
      const { command, payload } = msg?.data as {
        command: PointsSystemReceiveCommandsType;
        payload: any;
      };
      if (command == null) return;
      switch (command) {
        case 'setPodium':
          const { key, podium } = payload;
          this._podiums.set(key, podium);
          break;
        case 'update':
          this.podiums.next(this._podiums);
          break;
        case 'updateBkg':
          this.bkgImg.next(payload.secondScrBkg);
          break;
        case 'updateTxt':
          this.textFormat.next(payload.textFormat);
          break;
      }
    };
    this.channelSend.postMessage({ command: 'summary' });
  }
  async init() {
    const index = await this.indexedDb.getItem('settings');
    const settingsConfig = JSON.parse(index) as SettingsConfig;
    console.log(settingsConfig);
    if (settingsConfig) {
      this.bkgImg.next(settingsConfig.secondScrBkg);
      this.textFormat.next({ color: settingsConfig.secondScrTxtColor });
    }
  }
}
