const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const sudo = require('sudo-prompt');
const { checkInstalledVersion } = require('./utils/versionCheck');
const { downloadInstaller } = require('./utils/downloader');

let mainWindow;
let apps = [];

app.on("ready", () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        webPreferences: { 
            nodeIntegration: false,
            contextIsolation: false,
            enableRemoteModule: false
        }
    });

    mainWindow.loadFile("index.html"); // Cargar index.html al iniciar
    mainWindow.maximize(); // Maximizar la ventana

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
