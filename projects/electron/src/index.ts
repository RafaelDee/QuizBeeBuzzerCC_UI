import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}
let mainWindow: BrowserWindow | null;

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 600,
    width: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  mainWindow.maximize();
  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    console.log(
      'ALLOWING DEVICE ' +
        details.deviceType +
        '|' +
        (details.deviceType == 'serial')
    );
    if (details.deviceType == 'serial') {
      return true;
    }
    return false;
  });

  const startURL = app.isPackaged
    ? `file://${path.join(
        __dirname,
        'buzzer-control-center',
        'browser',
        'index.html'
      )}`
    : `http://localhost:4200`;
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://localhost:')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          height: 600,
          width: 800,
          frame: false,
          // Add maximize flag
          maximize: true
        },
      };
    }
    // Open external URLs in default browser
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
  ipcMain.on('maximize', (event, data) => {
    if(mainWindow.isMaximized()){
      mainWindow.unmaximize();
    }else{
      mainWindow.maximize();
    }

  });
  mainWindow.loadURL(startURL);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
