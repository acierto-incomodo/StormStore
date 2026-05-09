document.addEventListener("DOMContentLoaded", () => {
  const nextStepBtn = document.getElementById("next-step-btn");
  const finishSetupBtn = document.getElementById("finish-setup-btn");
  const steps = Array.from(document.querySelectorAll(".step"));
  const dots = Array.from(document.querySelectorAll(".dot"));

  const autoUpdatesCheckbox = document.getElementById("auto_updates");
  const startWithWindowsCheckbox = document.getElementById("start_with_windows");
  const showTrayCheckbox = document.getElementById("show_tray");
  const startMinimizedCheckbox = document.getElementById("start_minimized");

  let currentStep = 1;

  function showStep(stepNumber) {
    steps.forEach((s, i) => {
      s.classList.toggle("active", i === stepNumber - 1);
    });
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === stepNumber - 1);
    });
    currentStep = stepNumber;
  }

  // Navegación genérica
  document.querySelectorAll(".next-btn").forEach(btn => {
    btn.onclick = () => showStep(currentStep + 1);
  });
  document.querySelectorAll(".prev-btn").forEach(btn => {
    btn.onclick = () => showStep(currentStep - 1);
  });
  nextStepBtn.onclick = () => showStep(2);

  finishSetupBtn.addEventListener("click", async () => {
    const settings = {
      auto_updates: autoUpdatesCheckbox.checked,
      start_with_windows: startWithWindowsCheckbox.checked,
      show_tray: showTrayCheckbox.checked,
      start_minimized: startMinimizedCheckbox.checked,
      has_completed_first_launch: true, // Marcar como completado
    };

    try {
      await window.api.saveSettings(settings);
      // Redirigir a la vista principal de la aplicación
      window.location.href = "../index.html";
    } catch (error) {
      console.error("Error al guardar la configuración inicial:", error);
      // Opcional: mostrar un toast o mensaje de error al usuario
      if (window.api.showToast) {
        window.api.showToast(
          "Error al guardar la configuración. Inténtalo de nuevo.",
        );
      }
    }
  });

  // Cargar ajustes por defecto (o los que ya existan si se ha iniciado antes)
  window.api.getSettings().then((settings) => {
    autoUpdatesCheckbox.checked = settings.auto_updates !== false; // Default a true
    startWithWindowsCheckbox.checked = settings.start_with_windows === true;
    showTrayCheckbox.checked = settings.show_tray !== false;
    startMinimizedCheckbox.checked = settings.start_minimized === true;
  });
});