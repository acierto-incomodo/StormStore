const fs = require('fs');
const path = require('path');

function checkInstalledVersion(exePath) {
    return new Promise((resolve) => {
        const fullPath = path.join(process.env.LOCALAPPDATA, exePath.replace('AppData\\Local\\', ''));
        if (fs.existsSync(fullPath)) {
            resolve('Instalado');
        } else {
            resolve(null);
        }
    });
}

module.exports = { checkInstalledVersion };
