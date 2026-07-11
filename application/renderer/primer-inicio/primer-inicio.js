document.addEventListener("DOMContentLoaded", () => {
  const nextStepBtn = document.getElementById("next-step-btn");
  const finishSetupBtn = document.getElementById("finish-setup-btn");
  const steps = Array.from(document.querySelectorAll(".step"));
  const dots = Array.from(document.querySelectorAll(".dot"));

  const autoUpdatesCheckbox = document.getElementById("auto_updates");
  const startWithWindowsCheckbox = document.getElementById("start_with_windows");
  const showTrayCheckbox = document.getElementById("show_tray");
  const startMinimizedCheckbox = document.getElementById("start_minimized");
  const startMaximizedCheckbox = document.getElementById("start_maximized");

  let currentStep = 1;

  const getCheckboxValue = (checkbox, fallback = false) => {
    if (!checkbox) return fallback;
    return checkbox.checked;
  };

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
  document.querySelectorAll(".next-btn").forEach((btn) => {
    btn.onclick = () => showStep(currentStep + 1);
  });
  document.querySelectorAll(".prev-btn").forEach((btn) => {
    btn.onclick = () => showStep(currentStep - 1);
  });

  if (nextStepBtn) {
    nextStepBtn.onclick = () => {
      window.api.saveSettings({
        auto_updates: false,
        start_with_windows: false,
        show_tray: true,
        start_minimized: false,
        start_maximized: true,
        has_completed_first_launch: false,
      });
      showStep(2);
    };
  }

  if (finishSetupBtn) {
    finishSetupBtn.addEventListener("click", async () => {
      const settings = {
        auto_updates: getCheckboxValue(autoUpdatesCheckbox, false),
        start_with_windows: getCheckboxValue(startWithWindowsCheckbox, false),
        show_tray: getCheckboxValue(showTrayCheckbox, true),
        start_minimized: getCheckboxValue(startMinimizedCheckbox, false),
        start_maximized: getCheckboxValue(startMaximizedCheckbox, true),
        has_completed_first_launch: true,
      };

      try {
        await window.api.saveSettings(settings);
        window.location.href = "../index.html";
      } catch (error) {
        console.error("Error al guardar la configuración inicial:", error);
        if (window.api.showToast) {
          window.api.showToast(
            "Error al guardar la configuración. Inténtalo de nuevo.",
          );
        }
      }
    });
  }

  window.api.getSettings().then((settings) => {
    if (autoUpdatesCheckbox) {
      autoUpdatesCheckbox.checked = settings.auto_updates !== false;
    }
    if (startWithWindowsCheckbox) {
      startWithWindowsCheckbox.checked = settings.start_with_windows === true;
    }
    if (showTrayCheckbox) {
      showTrayCheckbox.checked = settings.show_tray !== false;
    }
    if (startMinimizedCheckbox) {
      startMinimizedCheckbox.checked = settings.start_minimized === true;
    }
    if (startMaximizedCheckbox) {
      startMaximizedCheckbox.checked = settings.start_maximized !== false;
    }
  });
});