// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld('electron', {
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  on: (channel, func) => {
    const newFunc = (event, ...args) => func(...args);
    ipcRenderer.on(channel, newFunc);
  },
  sendSync: (channel, data) => {
    return ipcRenderer.sendSync(channel, data);
  },
  removeListener: (channel, func) => {
    ipcRenderer.removeListener(channel, func);
  },
});
