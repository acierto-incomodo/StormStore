const { ipcRenderer } = require('electron');

async function loadApps() {
    const list = document.getElementById('app-list');

    const apps = await ipcRenderer.invoke('get-apps');

    for (const app of apps) {
        const li = document.createElement('li');
        li.textContent = app.name;

        const version = await ipcRenderer.invoke('check-version', app.exePath);
        li.textContent += version ? ` - ${version}` : " - No instalado";

        const installBtn = document.createElement('button');
        installBtn.textContent = 'Descargar e instalar';
        installBtn.onclick = async () => {
            const filePath = `downloads/${app.name}.exe`;
            alert('Descargando...');
            await ipcRenderer.invoke('download-app', app.downloadUrl, filePath);
            alert('Descarga completada. Instalando con permisos de administrador...');
            try {
                await ipcRenderer.invoke('install-app', filePath);
                alert('Instalador ejecutado correctamente.');
            } catch (error) {
                alert('Error al ejecutar el instalador.');
                console.error(error);
            }
        };

        li.appendChild(installBtn);
        list.appendChild(li);
    }
}

loadApps();
