const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getApps: () => ipcRenderer.invoke("get-apps"),
  installApp: (app) => ipcRenderer.invoke("install-app", app),
  openApp: (path) => ipcRenderer.invoke("open-app", path),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"), // nueva función para versión
});
