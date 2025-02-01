async function loadApps() {
    const list = document.getElementById('app-list');

    // Usamos `window.electron` en lugar de `ipcRenderer`
    const apps = await window.electron.invoke('get-apps');

    for (const app of apps) {
        const li = document.createElement('li');
        li.textContent = app.name;

        const version = await window.electron.invoke('check-version', app.exePath);
        li.textContent += version ? ` - ${version}` : " - No instalado";

        const installBtn = document.createElement('button');
        installBtn.textContent = 'Descargar e instalar';
        installBtn.onclick = async () => {
            const filePath = `downloads/${app.name}.exe`;
            alert('Descargando...');
            await window.electron.invoke('download-app', app.downloadUrl, filePath);
            alert('Descarga completada. Instalando con permisos de administrador...');
            try {
                await window.electron.invoke('install-app', filePath);
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
