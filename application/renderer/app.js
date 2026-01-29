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

      const actions = document.createElement("div");
      actions.style.display = "flex";
      actions.style.gap = "8px";
      actions.style.marginTop = "auto";

      if (app.installed) {
        // ABRIR
        const openBtn = document.createElement("button");
        openBtn.textContent = "Abrir";
        openBtn.onclick = () => window.api.openApp(app.paths[0]);
        actions.appendChild(openBtn);

        // DESINSTALAR
        if (app.uninstall) {
          const uninstallBtn = document.createElement("button");
          uninstallBtn.textContent = "Desinstalar";
          uninstallBtn.style.background = "#d9534f";

          uninstallBtn.onclick = async (e) => {
            e.stopPropagation(); // 🔥 CLAVE
            const overlay = document.getElementById("install-overlay");
            overlay.style.display = "flex";

            await window.api.uninstallApp(app.uninstall);

            overlay.style.display = "none";
            await load();
          };

          actions.appendChild(uninstallBtn);
        }
      } else {
        // INSTALAR
        const installBtn = document.createElement("button");
        installBtn.textContent = "Instalar";

        installBtn.onclick = async () => {
          const overlay = document.getElementById("install-overlay");
          installBtn.disabled = true;
          overlay.style.display = "flex";

          installBtn.innerHTML = `
            <span class="button-loading">
              <img src="../assets/icons/loading.svg">
              Instalando...
            </span>
          `;

          await window.api.installApp(app);

          overlay.style.display = "none";
          await load();
        };

        actions.appendChild(installBtn);
      }

      card.append(icon, name, desc, actions);
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
