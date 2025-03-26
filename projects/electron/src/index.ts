import {
  app,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  ipcMain,
} from 'electron';
import path from 'path';
import * as url from 'url';
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    height: 720,
    width: 1080,
    webPreferences: {
      nodeIntegration: true,
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
    ? url.format({
        pathname: path.join(
          __dirname,
          'buzzer-control-center',
          'browser',
          'index.html'
        ),
        protocol: 'file:',
        slashes: true,
      })
    : 'http://localhost:4200';

  // Important: Use loadURL with additional options
  /* mainWindow.loadURL(startURL, {
    userAgent: 'Chrome',
    extraHeaders: 'pragma: no-cache\n',
  }); */
  mainWindow.webContents.setWindowOpenHandler(({ url: externalUrl }) => {
    /* if (externalUrl.startsWith('http://') || externalUrl.startsWith('https://')) {
      // Open external URLs in default browser
      require('electron').shell.openExternal(url);
      return { action: 'deny' };
    } */
    if (externalUrl.includes('sec_scr')) {
      const startURL = app.isPackaged
        ? `file://${path.join(
            __dirname,
            'buzzer-control-center',
            'browser',
            'index.html'
          )}`
        : 'http://localhost:4200';
      // Parse the URL to extract potential query parameters or hash
      const parsedUrl = new url.URL(externalUrl);

      // Create a new BrowserWindow with specified options
      const newWindowOptions: BrowserWindowConstructorOptions = {
        height: 720,
        width: 1080,
        frame: false,
        webPreferences: {
          nodeIntegration: true,
          webSecurity: false, // Disable web security for local file loading
          allowRunningInsecureContent: true,
        },
      };

      // Create the new window
      const newWindow = new BrowserWindow(newWindowOptions);

      // Construct the route-specific URL
      const routeUrl = new url.URL(startURL);
      routeUrl.hash = `/sec_scr${parsedUrl.search}`;

      // Key change: Load the base index.html and let Angular handle routing
      newWindow.loadURL(routeUrl.toString());

      // Handle all navigation events to ensure proper routing
      newWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        // Prevent default navigation
        event.preventDefault();

        // Parse the navigation URL
        const navUrl = new url.URL(navigationUrl);

        // Reconstruct the URL with the correct hash
        const finalUrl = new url.URL(startURL);
        finalUrl.hash = navUrl.hash || navUrl.pathname;

        // Load the reconstructed URL
        newWindow.loadURL(finalUrl.toString());
      });

      // Optional: Dev tools for debugging
      if (!app.isPackaged) {
        newWindow.webContents.openDevTools();
      }

      return { action: 'deny' }; // Prevent default window opening
    }

    // Open external URLs in default browser
    require('electron').shell.openExternal(externalUrl);
    return { action: 'deny' };
  });
  // Enable DevTools in development
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
  ipcMain.on('set-fullscreen', (event, shouldBeFullscreen) => {
    const window = BrowserWindow.getFocusedWindow();

    if (window) {
      // Explicitly set fullscreen immediately
      window.setFullScreen(shouldBeFullscreen);
    }
  });
  // Alternative method for maximizing (if needed)
  ipcMain.on('maximize', (event, windowId) => {
    const window = BrowserWindow.fromId(windowId);

    if (window) {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    }
  });
  mainWindow.webContents.on('did-fail-load', () => {
    console.error('Failed to load the app');
    mainWindow?.loadURL(startURL);
  });
  mainWindow.on('close', () => {
    // Store the maximized state if needed
    const isMaximized = mainWindow.isMaximized();
    // You could save this to a config file if you want to restore across sessions
  });
  mainWindow.loadURL(startURL);
};

/* const createWindow = (): void => {
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
}; */

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
