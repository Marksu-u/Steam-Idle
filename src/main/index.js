import { app, BrowserWindow, ipcMain, shell, protocol, net } from "electron";
import { autoUpdater } from "electron-updater";
import { spawn } from "child_process";
import { join, dirname, resolve } from "path";
import { pathToFileURL } from "url";

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

let mainWindow, aboutWindow;

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

ipcMain.on("open-about", () => {
  createAboutWindow();
});

ipcMain.handle("app:get-version", () => app.getVersion());

ipcMain.handle("steam:search", async (event, term) => {
  const query = String(term || "").trim();
  if (!query) return [];
  const response = await net.fetch(
    `https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(query)}`
  );
  if (!response.ok) throw new Error(`SearchApps responded ${response.status}`);
  const results = await response.json();
  return results.map(r => ({
    appid: Number(r.appid),
    name: r.name,
    icon: r.icon
  }));
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

// Each idler is a console app that shows its own status window. To get a real
// per-game window we go through `cmd /c start`, which allocates a new console
// (Node's `detached` uses DETACHED_PROCESS, which gives no console at all).
// Only the numeric appid/duration go on the command line; the (untrusted) game
// name is passed via the IDLER_NAME env var so it never reaches the shell.
function spawnIdler(appid, durationMs, name) {
  const child = spawn(
    "cmd.exe",
    ["/c", "start", "", "idler.exe", String(appid), String(durationMs)],
    {
      cwd: dirname(idlerPath),
      env: { ...process.env, IDLER_NAME: name ?? String(appid) },
      windowsHide: false,
      stdio: "ignore"
    }
  );
  child.on("error", err => console.error("idler launch failed:", err));
  child.unref();
}

ipcMain.on("idler:launch", (event, games) => {
  games.forEach(game => {
    spawnIdler(game.appid, game.time, game.name);
  });
});

function onReady() {
  if (!process.env["ELECTRON_RENDERER_URL"]) {
    protocol.handle("app", async request => {
      const { pathname } = new URL(request.url);
      const relative = pathname.replace(/^\//, "");
      try {
        return await net.fetch(
          pathToFileURL(join(rendererDir, relative)).toString()
        );
      } catch {
        // e.g. the browser's automatic /favicon.ico probe — don't spam errors.
        return new Response(null, { status: 404 });
      }
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
