import { Injectable } from '@angular/core';
import { AudioSettings, SoundEffectsSettings } from './settings-config.service';
export class SoundFX {
  private _volume: number = 1;
  public get volume(): number {
    return this._volume;
  }
  public set volume(value: number) {
    this._volume = value;
    this.audio.volume = value;
  }
  public muted;
  constructor(public audio: HTMLAudioElement, volume: number) {
    this.audio.volume = volume;
  }
  play(masterVolume = 1) {
    this.audio.volume = this.volume * masterVolume;
    this.audio.play();
  }
}

export type SoundEffects = 'wrong' | 'correct' | 'suspense' | 'answer';
@Injectable({
  providedIn: 'root',
})
export class SoundFXService {
  audioEffects: { [key in SoundEffects]: SoundFX } = {
    correct: new SoundFX(new Audio('assets/sounds/correct.mp3'), 1),
    wrong: new SoundFX(new Audio('assets/sounds/wrong.mp3'), 1),
    suspense: new SoundFX(new Audio('assets/sounds/suspense.mp3'), 1),
    answer: new SoundFX(new Audio('assets/sounds/answer.mp3'), 1),
  };
  private _masterVolume = 1;
  public get masterVolume() {
    return this._masterVolume;
  }
  public set masterVolume(value) {
    this._masterVolume = value;
    if (this.currentPlayingAudio) {
      const volume = this.audioEffects[this.currentPlayingAudio].volume;
      this.audioEffects[this.currentPlayingAudio].audio.volume = volume * value;
    }
  }
  currentPlayingAudio: SoundEffects;
  constructor() {
    for (const key in this.audioEffects) {
      if (Object.prototype.hasOwnProperty.call(this.audioEffects, key)) {
        const element = this.audioEffects[key];
        element.audio.load();
      }
    }

  }
  setAudioVolume(key: SoundEffects | string, volume: number) {
    this.audioEffects[key].volume = volume;
    if (this.currentPlayingAudio == key) {
      this.audioEffects[this.currentPlayingAudio].audio.volume =
        volume * this.masterVolume;
    }
  }
  applyAllAudioVolume(volume:Partial<AudioSettings & SoundEffectsSettings>){
    if(!volume)return;
    this.masterVolume = volume.master??1;
    this.audioEffects.answer.volume = volume.answer??1;
    this.audioEffects.correct.volume = volume.correct??1;
    this.audioEffects.suspense.volume = volume.suspense??1;
    this.audioEffects.wrong.volume = volume.wrong??1;
  }
  playAudio(key: SoundEffects) {
    if (this.currentPlayingAudio) {
      this.audioEffects[this.currentPlayingAudio].audio.pause();
      this.audioEffects[this.currentPlayingAudio].audio.currentTime = 0;
    }
    this.audioEffects[key].play(this.masterVolume);
    this.currentPlayingAudio = key;
  }
  /* togglePauseResumeAudio() {
    if(!this.currentPlayingAudio)return;
    const currAudio = this.audioEffects[this.currentPlayingAudio].audio;

    if(!currAudio.currentTime)return;
    if (this.currentPlayingAudio) {
      this.audioEffects[this.currentPlayingAudio].audio.pause();
      this.audioEffects[this.currentPlayingAudio].audio.currentTime = 0;
    }
  } */
  async stopAudio() {
    if (!this.currentPlayingAudio) return;
    const audio = this.audioEffects[this.currentPlayingAudio].audio;
    const originalVolume = audio.volume;
    const steps = 10;
    const duration = 500; // fade out over 500ms

    for (let i = steps; i >= 0; i--) {
      audio.volume = originalVolume * (i / steps);
      await new Promise(resolve => setTimeout(resolve, duration / steps));
    }

    audio.pause();
    audio.currentTime = 0;
    audio.volume = originalVolume; // restore original volume
  }
}
