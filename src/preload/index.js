import { contextBridge, ipcRenderer } from "electron";

const api = {
  getVersion: () => ipcRenderer.invoke("app:get-version"),
  searchApps: term => ipcRenderer.invoke("steam:search", term),
  openExternal: url => ipcRenderer.send("shell:open-external", url),
  closeWindow: () => ipcRenderer.send("window:close"),
  minimizeWindow: () => ipcRenderer.send("window:minimize"),
  launch: games => ipcRenderer.send("idler:launch", games),
  stopIdler: id => ipcRenderer.send("idler:stop", id),
  stopAllIdlers: () => ipcRenderer.send("idler:stop-all"),
  listIdlers: () => ipcRenderer.invoke("idler:list"),
  onIdlerStarted: callback =>
    ipcRenderer.on("idler:started", (event, entry) => callback(entry)),
  onIdlerStopped: callback =>
    ipcRenderer.on("idler:stopped", (event, payload) => callback(payload)),
  downloadUpdate: () => ipcRenderer.send("DOWNLOAD_UPDATE"),
  acceptUpdate: () => ipcRenderer.send("ACCEPT_UPDATE"),
  onUpdateAvailable: callback => ipcRenderer.on("UPDATE_AVAILABLE", () => callback()),
  onUpdateReady: callback => ipcRenderer.on("UPDATE_READY", () => callback()),
  onDownloadProgress: callback =>
    ipcRenderer.on("DOWNLOAD_PROGRESS", (event, progress) => callback(progress))
};

contextBridge.exposeInMainWorld("api", api);
