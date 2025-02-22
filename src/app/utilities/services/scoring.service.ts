import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { InterConnectPacket, pairKey } from './serial.service';
import { Podium } from '../../values/podium.values';

@Injectable({
  providedIn: 'root',
})
export class ScoringService {
  private _isLeader = new BehaviorSubject<boolean>(null);
  public get isLeader() {
    return this._isLeader;
  }
  private set isLeader(value) {
    this._isLeader = value;
  }
  channel: BroadcastChannel;
  _podiums: Map<number, Podium> = new Map();
  podiums = new BehaviorSubject<Map<number, Podium>>(null);
  constructor() {
    this.channel = new BroadcastChannel('sync_channel_points-' + pairKey);
    this.channel.onmessage = (msg) => {
      console.log(msg?.data);
      const {key,podium} = msg?.data as {key:number,podium:Podium};
      if (key == null) return;
      this._podiums.set(key,podium);
      this.podiums.next(this._podiums);
    };
  }
}
