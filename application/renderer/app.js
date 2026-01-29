const appsContainer = document.getElementById("apps");
const catContainer = document.getElementById("categories");
const title = document.getElementById("current-category");
const versionElem = document.getElementById("app-version");

let allApps = [];

// Mostrar versión automáticamente
if (versionElem) {
  window.api.getAppVersion().then((v) => {
    versionElem.textContent = "v" + v;
  });
}

// Cargar apps y renderizar
async function load() {
  allApps = await window.api.getApps();
  renderCategories();
  renderApps("Todas");
}

// Renderizar categorías
function renderCategories() {
  const cats = ["Todas", ...new Set(allApps.map((a) => a.category))];
  cats.forEach((cat) => {
    const li = document.createElement("li");
    li.textContent = cat;
    li.onclick = () => renderApps(cat);
    catContainer.appendChild(li);
  });
}

// Renderizar apps
function renderApps(category) {
  title.textContent = category;
  appsContainer.innerHTML = "";

  allApps
    .filter((a) => category === "Todas" || a.category === category)
    .forEach((app) => {
      const card = document.createElement("div");
      card.className = "card";

      const icon = document.createElement("img");
      icon.src = app.icon;

      const name = document.createElement("h3");
      name.textContent = app.name;

      const desc = document.createElement("p");
      desc.textContent = app.description;

      const btn = document.createElement("button");

      if (app.installed) {
        const openBtn = document.createElement("button");
        openBtn.textContent = "Abrir";
        openBtn.onclick = () => window.api.openApp(app.paths[0]);

        card.append(icon, name, desc, openBtn);

        if (app.uninstall) {
          const uninstallBtn = document.createElement("button");
          uninstallBtn.textContent = "Desinstalar";
          uninstallBtn.style.background = "#d9534f";

          uninstallBtn.onclick = async () => {
            const overlay = document.getElementById("install-overlay");
            overlay.style.display = "flex";

            await window.api.uninstallApp(app.uninstall);

            overlay.style.display = "none";
            load(); // refresca lista
          };

          card.append(uninstallBtn);
        }

        appsContainer.appendChild(card);
        return;
      } else {
        btn.textContent = "Instalar";
        btn.onclick = async () => {
          const overlay = document.getElementById("install-overlay");

          btn.disabled = true;
          overlay.style.display = "flex";

          btn.innerHTML = `<span class="button-loading">
    <img src="../assets/icons/loading.svg">
    Instalando...
  </span>`;

          try {
            await window.api.installApp(app);
          } catch (e) {
            console.error(e);
          }

          overlay.style.display = "none";

          const installedApps = await window.api.getApps();
          const updatedApp = installedApps.find((a) => a.id === app.id);

          if (updatedApp?.installed) {
            btn.textContent = "Abrir";
            btn.onclick = () => window.api.openApp(updatedApp.paths[0]);
          } else {
            btn.textContent = "Instalar";
          }

          btn.disabled = false;
        };
      }

      card.append(icon, name, desc, btn);
      appsContainer.appendChild(card);
    });
}

// Inicializar
load();

// Footer links
document
  .querySelectorAll(".sidebar-footer button[data-link]")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-link");
      window.open(url);
    });
  });

// Overlay internet
function updateInternetStatus() {
  const overlay = document.getElementById("no-internet-overlay");
  fetch("https://www.google.com", { mode: "no-cors" })
    .then(() => (overlay.style.display = "none"))
    .catch(() => (overlay.style.display = "flex"));
}

updateInternetStatus();
setInterval(updateInternetStatus, 5000);
