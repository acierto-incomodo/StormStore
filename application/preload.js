const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getApps: () => ipcRenderer.invoke("get-apps"),
  installApp: (app) => ipcRenderer.invoke("install-app", app),
  getSteamGames: () => ipcRenderer.invoke("get-steam-games"),
  getEpicGames: () => ipcRenderer.invoke("get-epic-games"),
  openApp: (path, requiresSteam) =>
    ipcRenderer.invoke("open-app", path, requiresSteam),
  openAppLocation: (path) => ipcRenderer.invoke("open-app-location", path),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  uninstallApp: (path) => ipcRenderer.invoke("uninstall-app", path),
  deleteAppFolder: (path) => ipcRenderer.invoke("delete-app-folder", path),
  checkTrailerExists: (id) => ipcRenderer.invoke("check-trailer-exists", id),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  getUpdateInfo: () => ipcRenderer.invoke("get-update-info"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  installUpdate: () => ipcRenderer.invoke("install-update"),
  onUpdateAvailable: (callback) => ipcRenderer.on("update-available", callback),
  onUpdateNotAvailable: (callback) =>
    ipcRenderer.on("update-not-available", callback),
  onDownloadProgress: (callback) =>
    ipcRenderer.on("download-progress", callback),
  onUpdateDownloaded: (callback) =>
    ipcRenderer.on("update-downloaded", callback),
  onUpdateError: (callback) => ipcRenderer.on("update-error", callback),
  onShowToast: (callback) => ipcRenderer.on("show-toast", callback),
  openBigPicture: () => ipcRenderer.invoke("open-big-picture"),
  openMainView: () => ipcRenderer.invoke("open-main-view"),
  minimizeWindow: () => ipcRenderer.send("window-minimize"),
  maximizeWindow: () => ipcRenderer.send("window-maximize"),
  closeWindow: () => ipcRenderer.send("window-close"),
  isMaximized: () => ipcRenderer.invoke("is-maximized"),
  onWindowMaximized: (callback) => ipcRenderer.on("window-maximized", callback),
  onWindowRestored: (callback) => ipcRenderer.on("window-restored", callback),
  quitApp: () => ipcRenderer.send("app-quit"),
  setDiscordActivity: (activity) =>
    ipcRenderer.send("set-discord-activity", activity),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => ipcRenderer.send("save-settings", settings),
  launchApp: () => ipcRenderer.send("launch-app"),
  onShowVirusAlert: (callback) => ipcRenderer.on("show-virus-alert", callback),
  sendVirusAlertResponse: (response) =>
    ipcRenderer.send("virus-alert-response", response),
  clearCache: () => ipcRenderer.invoke("clear-cache"),
  syncRemoteData: () => ipcRenderer.invoke("sync-remote-data"),

  // Descargas de archivos
  getFileApps: () => ipcRenderer.invoke("get-file-apps"),
  startFileDownload: (fileAppId) =>
    ipcRenderer.invoke("start-file-download", fileAppId),
  pauseDownload: (downloadId) =>
    ipcRenderer.invoke("pause-download", downloadId),
  cancelDownload: (downloadId) =>
    ipcRenderer.invoke("cancel-download", downloadId),
  getDownloadStatus: (downloadId) =>
    ipcRenderer.invoke("get-download-status", downloadId),
  getAllDownloads: () => ipcRenderer.invoke("get-all-downloads"),
  onDownloadStart: (callback) => ipcRenderer.on("download-start", callback),
  onDownloadProgress: (callback) =>
    ipcRenderer.on("download-progress", callback),
  onDownloadComplete: (callback) =>
    ipcRenderer.on("download-complete", callback),
  onDownloadError: (callback) => ipcRenderer.on("download-error", callback),
  onDownloadCancelled: (callback) => ipcRenderer.on("download-cancelled", callback),
  onMergingStart: (callback) => ipcRenderer.on("merging-start", callback),
  onExtractingStart: (callback) => ipcRenderer.on("extracting-start", callback),
  onVerifyingStart: (callback) => ipcRenderer.on("verifying-start", callback),
  onWindowUnmaximized: (callback) =>
    ipcRenderer.on("window-unmaximized", callback),
  openFolder: (path) => ipcRenderer.invoke("open-folder", path),
  retryDownload: (id) => ipcRenderer.invoke("retry-download", id),
  showToast: (message, duration) => ipcRenderer.send("show-toast", message, duration),
});
