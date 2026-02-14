const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getApps: () => ipcRenderer.invoke("get-apps"),
  installApp: (app) => ipcRenderer.invoke("install-app", app),
  openApp: (path) => ipcRenderer.invoke("open-app", path),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  uninstallApp: (path) => ipcRenderer.invoke("uninstall-app", path),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  getUpdateInfo: () => ipcRenderer.invoke("get-update-info"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  installUpdate: () => ipcRenderer.invoke("install-update"),
  onUpdateAvailable: (callback) => ipcRenderer.on("update-available", callback),
  onUpdateNotAvailable: (callback) => ipcRenderer.on("update-not-available", callback),
  onDownloadProgress: (callback) => ipcRenderer.on("download-progress", callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on("update-downloaded", callback),
  onUpdateError: (callback) => ipcRenderer.on("update-error", callback),
});