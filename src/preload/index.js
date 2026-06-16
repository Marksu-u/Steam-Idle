import { contextBridge, ipcRenderer } from "electron";

const api = {
  getVersion: () => ipcRenderer.invoke("app:get-version"),
  getAppList: () => ipcRenderer.invoke("steam:get-app-list"),
  openExternal: url => ipcRenderer.send("shell:open-external", url),
  closeWindow: () => ipcRenderer.send("window:close"),
  minimizeWindow: () => ipcRenderer.send("window:minimize"),
  openAbout: () => ipcRenderer.send("open-about"),
  openLegacy: () => ipcRenderer.send("open-legacy"),
  launch: games => ipcRenderer.send("idler:launch", games),
  legacyLaunch: appids => ipcRenderer.send("idler:legacy-launch", appids),
  downloadUpdate: () => ipcRenderer.send("DOWNLOAD_UPDATE"),
  acceptUpdate: () => ipcRenderer.send("ACCEPT_UPDATE"),
  onUpdateAvailable: callback => ipcRenderer.on("UPDATE_AVAILABLE", () => callback()),
  onUpdateReady: callback => ipcRenderer.on("UPDATE_READY", () => callback()),
  onDownloadProgress: callback =>
    ipcRenderer.on("DOWNLOAD_PROGRESS", (event, progress) => callback(progress))
};

contextBridge.exposeInMainWorld("api", api);
