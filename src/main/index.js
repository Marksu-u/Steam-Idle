import { app, BrowserWindow, ipcMain, shell, protocol, net } from "electron";
import { autoUpdater } from "electron-updater";
import { execFile } from "child_process";
import { join, dirname, resolve } from "path";
import { pathToFileURL } from "url";

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

let mainWindow, aboutWindow, legacyWindow;

const isProduction = app.isPackaged;

const idlerPath = isProduction
  ? join(dirname(app.getPath("exe")), "bin", "idler.exe")
  : join(process.cwd(), "bin", "idler.exe");

const rendererDir = resolve(__dirname, "../renderer");

function loadPage(window, page) {
  if (process.env["ELECTRON_RENDERER_URL"]) {
    window.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}/${page}`);
  } else {
    window.loadURL(`app://renderer/${page}`);
  }
}

function logToRender(msg) {
  mainWindow.webContents.send("log", msg);
}

function createWindow() {
  const browserOptions = {
    width: 500,
    height: 625,
    minWidth: 500,
    minHeight: 625,
    frame: !isProduction,
    backgroundColor: "#222",
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js")
    }
  };
  mainWindow = new BrowserWindow(browserOptions);
  loadPage(mainWindow, "index.html");
  mainWindow.webContents.on("console-message", e => {
    if (e.level >= 2) console.error(`[renderer] ${e.message} (${e.sourceUrl}:${e.lineNumber})`);
  });
  mainWindow.on("close", () => {
    mainWindow = null;
  });
  mainWindow.once("ready-to-show", () => {
    if (!isProduction) mainWindow.webContents.openDevTools();
    mainWindow.show();
  });
}

function createAboutWindow() {
  const browserOptions = {
    width: 485,
    height: 175,
    backgroundColor: "#222",
    show: false,
    parent: mainWindow,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js")
    }
  };
  aboutWindow = new BrowserWindow(browserOptions);
  loadPage(aboutWindow, "about.html");
  aboutWindow.on("close", () => {
    aboutWindow = null;
  });
  aboutWindow.once("ready-to-show", () => {
    aboutWindow.show();
  });
}

function createLegacyWindow() {
  const browserOptions = {
    width: 490,
    height: 225,
    backgroundColor: "#222",
    resizable: false,
    show: false,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js")
    }
  };
  legacyWindow = new BrowserWindow(browserOptions);
  loadPage(legacyWindow, "legacy.html");
  legacyWindow.on("close", () => {
    legacyWindow = null;
  });
  legacyWindow.once("ready-to-show", () => {
    legacyWindow.show();
  });
}

ipcMain.on("open-about", () => {
  createAboutWindow();
});

ipcMain.on("open-legacy", () => {
  createLegacyWindow();
});

ipcMain.handle("app:get-version", () => app.getVersion());

ipcMain.handle("steam:get-app-list", async () => {
  const response = await net.fetch(
    "http://api.steampowered.com/ISteamApps/GetAppList/v0001"
  );
  return response.json();
});

ipcMain.on("shell:open-external", (event, url) => {
  shell.openExternal(url);
});

ipcMain.on("window:close", event => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

ipcMain.on("window:minimize", event => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});

ipcMain.on("idler:launch", (event, games) => {
  games.forEach(game => {
    execFile(
      idlerPath,
      [String(game.appid), String(game.time), game.name],
      err => {
        if (err) console.log(err);
      }
    );
  });
});

ipcMain.on("idler:legacy-launch", (event, appids) => {
  appids.forEach(appid => {
    execFile(idlerPath, [appid]);
  });
});

function onReady() {
  if (!process.env["ELECTRON_RENDERER_URL"]) {
    protocol.handle("app", request => {
      const { pathname } = new URL(request.url);
      const relative = pathname.replace(/^\//, "");
      return net.fetch(pathToFileURL(join(rendererDir, relative)).toString());
    });
  }
  createWindow();
  if (isProduction) autoUpdater.checkForUpdates();
}

app.on("ready", onReady);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

autoUpdater.on("update-available", () => {
  logToRender("update-available");
  mainWindow.webContents.send("UPDATE_AVAILABLE");
});

autoUpdater.on("download-progress", progress => {
  logToRender("download-progress");
  mainWindow.webContents.send("DOWNLOAD_PROGRESS", progress);
});

autoUpdater.on("update-downloaded", () => {
  logToRender("update-downloaded");
  mainWindow.webContents.send("UPDATE_READY");
  ipcMain.on("ACCEPT_UPDATE", () => {
    autoUpdater.quitAndInstall();
  });
});

ipcMain.on("DOWNLOAD_UPDATE", () => {
  autoUpdater.downloadUpdate();
});
