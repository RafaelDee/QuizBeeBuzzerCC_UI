import { ChangeDetectorRef, EventEmitter, Injectable, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { InterConnectPacket, pairKey } from './serial.service';
import { Podium } from '../../values/podium.values';
import { IndexedDbService } from './indexed-db.service';
export class PodiumScore {
  title: string;
  score: { points: number; streak: number } = { points: 0, streak: 0 };
}
export type PointsSystemReceiveCommandsType =
  | 'setPodium'
  | 'update'
  | 'updateBkg'
  | 'updateTxt'
  | 'editor'
  | 'prepImg'
  | 'refresh';
export interface PointsSystemReceiveCommands {
  command: PointsSystemReceiveCommandsType;
  payload?: any;
}
export interface PointsSystemSendCommands {
  command: PointsSystemSendCommandsType;
  payload?: any;
}
export type PointsSystemSendCommandsType = 'summary';
@Injectable({
  providedIn: 'root',
})
export class ScoringService {
  spotlitPodium = null;
  bkgImg = new BehaviorSubject<string>(null);
  prepImg = new BehaviorSubject<string>(null);
  textFormat = new BehaviorSubject<{
    secondScrTxtColor: string;
    imgBorderColor: string;
    imgBkgColor: string;
  }>(null);
  private _isLeader = new BehaviorSubject<boolean>(null);
  onRefresh = new EventEmitter(null);
  public get isLeader() {
    return this._isLeader;
  }
  private set isLeader(value) {
    this._isLeader = value;
  }
  channel: BroadcastChannel;
  channelSend: BroadcastChannel;
  private _podiums: Map<number, Podium> = new Map();
  podiums = new BehaviorSubject<Map<number, Podium>>(null);
  editMode = new BehaviorSubject<boolean>(false);
  constructor(private indexedDb: IndexedDbService) {
    this.channel = new BroadcastChannel('sync_channel_points-' + pairKey);
    this.channelSend = new BroadcastChannel(
      'sync_channel_points-send-' + pairKey
    );
    this.channel.onmessage = (msg) => {
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
          console.log(this._podiums);
          this.podiums.next(this._podiums);
          break;
        case 'updateBkg':
          this.bkgImg.next(payload.secondScrBkg);
          break;
        case 'prepImg':
          this.prepImg.next(payload.prepImg);
          break;
        case 'refresh':
          this.onRefresh.emit(null);
          break;
        case 'updateTxt':
          this.textFormat.next({
            ...this.textFormat.value,
            ...payload.textFormat,
          });
          break;
        case 'editor':
          this.editMode.next(payload ?? false);
          break;
      }
    };
  }
  init() {
    this.channelSend.postMessage({ command: 'summary' });
  }
}
