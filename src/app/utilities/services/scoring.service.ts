import {
  ChangeDetectorRef,
  EventEmitter,
  Injectable,
  OnInit,
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { InterConnectPacket, pairKey } from './serial.service';
import { Podium } from '../../values/podium.values';
import { IndexedDbService } from './indexed-db.service';
import { SettingsConfigService } from './settings-config.service';
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
  | 'refresh'
  | 'spotlight'
  | 'ansReveal';
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
  bkgImg = new BehaviorSubject<string>(null);
  prepImg = new BehaviorSubject<string>(null);
  textFormat = new BehaviorSubject<{
    secondScrTxtColor: string;
    imgBorderColor: string;
    imgBkgColor: string;
  }>({
    secondScrTxtColor: '#FFFFFF',
    imgBorderColor: '#FFFFFF',
    imgBkgColor: '#000000',
  });
  private _isLeader = new BehaviorSubject<boolean>(null);
  onRefresh = new EventEmitter<boolean>(null);
  public get isLeader() {
    return this._isLeader;
  }
  private set isLeader(value) {
    this._isLeader = value;
  }
  channel: BroadcastChannel;
  channelSend: BroadcastChannel;
  podiums = new BehaviorSubject<Map<number, Podium>>(new Map());
  selectedPodium = new BehaviorSubject<number>(null);
  logoMode = new BehaviorSubject<boolean>(false);
  onAnsReveal = new BehaviorSubject<boolean>(null);
  constructor(
    private indexedDb: IndexedDbService,
    private settingsServ: SettingsConfigService
  ) {
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
          this.podiums.value.set(key, podium);
          break;
        case 'update':
          this.podiums.next(this.podiums.value);
          break;
        case 'updateBkg':
          this.bkgImg.next(payload.secondScrBkg);
          break;
        case 'prepImg':
          this.prepImg.next(payload.prepImg);
          break;
        case 'spotlight':
          this.selectedPodium.next(payload);
          break;
        case 'refresh':
          this.onRefresh.emit(payload);
          break;
        case 'ansReveal':
          this.onAnsReveal.next(payload);
          break;
        case 'updateTxt':
          this.textFormat.next({
            ...this.textFormat.value,
            ...payload.textFormat,
          });
          break;
        case 'editor':
          this.logoMode.next(payload ?? false);
          break;
      }
    };
    (async () => {
      const { secondScrBkg, prepImg, ...other } = {
        ...this.settingsServ.settings,
        ...JSON.parse(await this.indexedDb.getItem('settings')),
      };
      this.textFormat.next(other);
      this.bkgImg.next(secondScrBkg);
      this.prepImg.next(prepImg);
    })();
  }
  init() {
    this.channelSend.postMessage({ command: 'summary' });
  }
}
