import { app, BrowserWindow, ipcMain, shell, protocol, net } from "electron";
import { autoUpdater } from "electron-updater";
import { spawn } from "child_process";
import { join, dirname, resolve } from "path";
import { pathToFileURL } from "url";

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

let mainWindow;

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

// Registry of running idlers. Each idler.exe is spawned directly and hidden
// (no console), tracked by an internal id so it can be stopped, and tied to the
// app's lifetime (killed on quit). The appid goes via the SteamAppId env var
// (no shared steam_appid.txt race); the untrusted name via IDLER_NAME, so
// neither touches the command line. The renderer mirrors this registry through
// idler:started / idler:stopped events and renders the timers itself.
const idlers = new Map(); // id -> { child, appid, name, durationMs, startTime }
let nextIdlerId = 1;

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function startIdler(appid, durationMs, name) {
  // Dedupe: at most one idler per appid.
  for (const entry of idlers.values()) {
    if (entry.appid === appid) return;
  }
  const id = nextIdlerId++;
  const safeName = name || String(appid);
  const startTime = Date.now();
  const child = spawn(idlerPath, [String(durationMs)], {
    cwd: dirname(idlerPath),
    env: { ...process.env, SteamAppId: String(appid), IDLER_NAME: safeName },
    windowsHide: true,
    stdio: "ignore"
  });
  idlers.set(id, { child, appid, name: safeName, durationMs, startTime });
  sendToRenderer("idler:started", { id, appid, name: safeName, durationMs, startTime });

  child.on("error", err => console.error("idler launch failed:", err));
  child.on("exit", () => {
    idlers.delete(id);
    sendToRenderer("idler:stopped", { id });
  });
}

function stopIdler(id) {
  // The exit handler does the registry cleanup + idler:stopped event.
  idlers.get(id)?.child.kill();
}

ipcMain.on("idler:launch", (event, games) => {
  games.forEach(game => startIdler(game.appid, game.time, game.name));
});

ipcMain.on("idler:stop", (event, id) => stopIdler(id));

ipcMain.on("idler:stop-all", () => {
  for (const id of [...idlers.keys()]) stopIdler(id);
});

ipcMain.handle("idler:list", () =>
  [...idlers.entries()].map(([id, e]) => ({
    id,
    appid: e.appid,
    name: e.name,
    durationMs: e.durationMs,
    startTime: e.startTime
  }))
);

app.on("before-quit", () => {
  for (const entry of idlers.values()) entry.child.kill();
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
