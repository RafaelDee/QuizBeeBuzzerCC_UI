// app.js

const { app, BrowserWindow } = require("electron");
const url = require("url");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame:false,
    fullscreen: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  mainWindow.loadURL(
    url.format({
      pathname: path.join(
        __dirname,
        `/dist/buzzer-control-center/browser/index.html`
      ),
      protocol: "file:",
      slashes: true,
    })
  );

  mainWindow.on("closed", function () {
    mainWindow = null;
  });
  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    console.log(
      "ALLOWING DEVICE " +
        details.deviceType +
        "|" +
        (details.deviceType == "serial")
    );
    if (details.deviceType == "serial") {
      return true;
    }
    return false;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function () {
  if (mainWindow === null) createWindow();
});
