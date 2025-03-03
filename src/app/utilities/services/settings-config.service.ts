import { Injectable } from '@angular/core';
import { IndexedDbService } from './indexed-db.service';
import { ScoringService } from './scoring.service';
import { SoundEffects, SoundFXService } from './soundFX.service';
import { pairKey } from './serial.service';
export class SettingsConfig {
  secondScrBkg: string = 'assets/images/sec_scr_bkg.jpg';
  secondScrTxtColor: string = '#FFFFFF';
  imgBorderColor: string = '#FFFFFF';
  imgBkgColor: string = '#00000';
  prepTxt: string;
  prepImg: string;
  audio: Partial<AudioSettings & SoundEffectsSettings>;
}
export interface AudioSettings {
  master: number;
}

export type SoundEffectsSettings = {
  [key in SoundEffects]: number;
};
@Injectable({
  providedIn: 'root',
})
export class SettingsConfigService {
  private _settings: SettingsConfig = new SettingsConfig();
  setSettings(settings: Partial<SettingsConfig>) {
    this._settings = { ...this._settings, ...settings };
    this.indexedDb.setItem('settings', JSON.stringify(this._settings));
    this.sendSettingsConfig(settings);
  }
  public get settings() {
    return this._settings;
  }
  channel: BroadcastChannel;
  constructor(
    private indexedDb: IndexedDbService,
    private scoringService: ScoringService,
    private soundFX: SoundFXService
  ) {
    this.init();
    this.channel = new BroadcastChannel('sync_channel_points-' + pairKey);
  }
  init() {
    (async () => {
      this._settings = {
        ...this._settings,
        ...JSON.parse(await this.indexedDb.getItem('settings')),
      };
      this.soundFX.applyAllAudioVolume(this._settings?.audio);
      const { audio, secondScrBkg, prepImg, ...other } = this._settings;
      this.scoringService.textFormat.next(other);
      this.scoringService.bkgImg.next(secondScrBkg);
      this.scoringService.prepImg.next(prepImg);
    })();
  }
  setAudioSettings(key: string, volume: number) {
    const combined = {
      ...this.settings.audio,
      ...{ [key]: volume },
    };
    this.setSettings({ audio: combined });
  }
  removeSettingConfig(key: keyof SettingsConfig) {
    const { [key]: _, ...other } = this._settings;
    if (key == 'secondScrBkg') {
      this.channel.postMessage({
        command: 'updateBkg',
        payload: { secondScrBkg: this._settings.secondScrBkg },
      });
    }
    if (key == 'prepImg') {
      this.channel.postMessage({
        command: 'prepImg',
        payload: { prepImg: null },
      });
    }
    //i just want to end my suffering, no optimizations
    this._settings = { ...new SettingsConfig(), ...(other as SettingsConfig) };

    this.indexedDb.setItem('settings', JSON.stringify(this._settings));
    this.sendSettingsConfig(this._settings);
  }
  sendSettingsConfig(settings: Partial<SettingsConfig>) {
    if (settings?.secondScrBkg != null) {
      this.channel.postMessage({
        command: 'updateBkg',
        payload: { secondScrBkg: settings.secondScrBkg },
      });
    }
    if (settings.prepImg) {
      this.channel.postMessage({
        command: 'prepImg',
        payload: { prepImg: settings.prepImg },
      });
    }
    const payload = {};

    if (settings.secondScrTxtColor)
      payload['secondScrTxtColor'] = settings.secondScrTxtColor;
    if (settings.imgBkgColor) payload['imgBkgColor'] = settings.imgBkgColor;
    if (settings.imgBorderColor)
      payload['imgBorderColor'] = settings.imgBorderColor;
    this.channel.postMessage({
      command: 'updateTxt',
      payload: { textFormat: payload },
    });
  }
}
