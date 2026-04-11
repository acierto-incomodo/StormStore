import sys
import os
import tempfile
import subprocess
import time
import requests
from PySide6.QtWidgets import QApplication, QWidget, QVBoxLayout, QLabel, QProgressBar
from PySide6.QtCore import Qt, QThread, Signal
from PySide6.QtGui import QIcon

# Configuración
REPO = "acierto-incomodo/StormStore"
API_URL = f"https://api.github.com/repos/{REPO}/releases/latest"

# Ruta base (compatible con PyInstaller)
def resource_path(relative_path):
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

class DownloadWorker(QThread):
    progress = Signal(int, str)
    finished = Signal(str)
    error = Signal(str)

    def run(self):
        try:
            # Obtener release
            data = requests.get(API_URL, timeout=10).json()

            asset = next(
                (a for a in data.get("assets", [])
                 if a["name"].startswith("StormStore-Setup-") and a["name"].endswith(".exe")),
                None
            )

            if not asset:
                self.error.emit("No se encontró el instalador")
                return

            url = asset["browser_download_url"]
            path = os.path.join(tempfile.gettempdir(), asset["name"])

            # Descargar
            with requests.get(url, stream=True, timeout=30) as r:
                total = int(r.headers.get("content-length", 0))
                done = 0
                start = time.time()

                with open(path, "wb") as f:
                    for chunk in r.iter_content(16384):
                        if not chunk:
                            continue

                        f.write(chunk)
                        done += len(chunk)

                        if total:
                            perc = int(done * 100 / total)

                            # calcular cada ~0.2s para optimizar
                            if time.time() - start > 0.2:
                                elapsed = time.time() - start
                                speed = done / elapsed if elapsed > 0 else 0
                                eta = (total - done) / speed if speed > 0 else 0

                                info = f"{done/1048576:.1f}/{total/1048576:.1f} MB - {speed/1048576:.1f} MB/s"
                                self.progress.emit(perc, info)
                                start = time.time()

            self.finished.emit(path)

        except Exception as e:
            self.error.emit(str(e))


class SetupUI(QWidget):
    def __init__(self):
        super().__init__()

        self.setWindowTitle("StormStore Downloader")
        self.setFixedSize(400, 110)
        self.setWindowFlags(Qt.Window | Qt.WindowTitleHint | Qt.WindowCloseButtonHint)

        # ICONO (elige automáticamente)
        ico = resource_path("app.ico")
        png = resource_path("app.png")

        if os.path.exists(ico):
            self.setWindowIcon(QIcon(ico))
        elif os.path.exists(png):
            self.setWindowIcon(QIcon(png))

        # Estilo optimizado
        self.setStyleSheet("""
            QWidget { background:#121212; color:#eee; }
            QProgressBar {
                border:1px solid #333;
                border-radius:4px;
                text-align:center;
            }
            QProgressBar::chunk {
                background:#fdd835;
            }
        """)

        layout = QVBoxLayout(self)

        self.lbl = QLabel("Preparando descarga...")
        self.bar = QProgressBar()
        self.inf = QLabel("")
        self.inf.setAlignment(Qt.AlignRight)

        layout.addWidget(self.lbl)
        layout.addWidget(self.bar)
        layout.addWidget(self.inf)

        # Worker
        self.wk = DownloadWorker()
        self.wk.progress.connect(self.update_progress)
        self.wk.finished.connect(self.finish)
        self.wk.error.connect(self.show_error)
        self.wk.start()

    def update_progress(self, p, info):
        self.bar.setValue(p)
        self.lbl.setText(f"Descargando... {p}%")
        self.inf.setText(info)

    def finish(self, path):
        subprocess.Popen(path, shell=True)
        QApplication.quit()

    def show_error(self, e):
        self.lbl.setText(f"Error: {e}")


if __name__ == "__main__":
    app = QApplication(sys.argv)
    ui = SetupUI()
    ui.show()
    sys.exit(app.exec())