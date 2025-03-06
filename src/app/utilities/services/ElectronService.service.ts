// src/types/electron.d.ts
declare global {
  interface Window {
    electron?: any;
  }
}

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  private _isElectronApp = false;
  private _ipcRenderer: any = null;

  constructor() {
    if (window.electron) {
      this._isElectronApp = true;
      this._ipcRenderer = window.electron.ipcRenderer;
    }
  }

  get isElectronApp() {
    return this._isElectronApp;
  }

  get ipcRenderer() {
    return this._ipcRenderer;
  }
}
