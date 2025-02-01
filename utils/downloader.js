const fs = require('fs');
const { net } = require('electron');

async function downloadInstaller(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const request = net.request(url);

        request.on('response', (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(dest);
            });
        });

        request.on('error', (error) => {
            fs.unlink(dest, () => {});
            reject(error);
        });

        request.end();
    });
}

module.exports = { downloadInstaller };
