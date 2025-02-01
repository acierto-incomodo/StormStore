const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const sudo = require('sudo-prompt');
const { checkInstalledVersion } = require('./utils/versionCheck');
const { downloadInstaller } = require('./utils/downloader');

let mainWindow;
let apps = [];

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    mainWindow.loadFile('index.html');

    // Cargar apps desde apps.json
    fs.readFile('apps.json', 'utf8', (err, data) => {
        if (!err) {
            apps = JSON.parse(data);
        }
    });

    ipcMain.handle('get-apps', async () => {
        return apps;
    });

    ipcMain.handle('check-version', async (_, exePath) => {
        return await checkInstalledVersion(exePath);
    });

    ipcMain.handle('download-app', async (_, url, dest) => {
        return await downloadInstaller(url, dest);
    });

    ipcMain.handle('install-app', async (_, filePath) => {
        return new Promise((resolve, reject) => {
            const options = { name: 'StormStore' };

            sudo.exec(`"${filePath}"`, options, (error) => {
                if (error) {
                    console.error('Error ejecutando el instalador:', error);
                    return reject(error);
                }
                resolve('Instalador ejecutado con permisos de administrador.');
            });
        });
    });
});
