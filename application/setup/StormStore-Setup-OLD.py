import sys
import os
import tempfile
import subprocess
import time
import requests
from PySide6.QtWidgets import QApplication, QWidget, QVBoxLayout, QLabel, QProgressBar
from PySide6.QtCore import Qt, QThread, Signal

# Configuración del repositorio
REPO = "acierto-incomodo/StormStore"
API_URL = f"https://api.github.com/repos/{REPO}/releases/latest"

class DownloadWorker(QThread):
    progress = Signal(int, str)  # porcentaje, texto informativo
    finished = Signal(str)
    error = Signal(str)

    def run(self):
        try:
            # 1. Obtener URL del asset
            resp = requests.get(API_URL, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            
            asset = next((a for a in data.get("assets", []) 
                         if a["name"].startswith("StormStore-Setup-") and a["name"].endswith(".exe")), None)
            
            if not asset:
                self.error.emit("No se encontró el instalador.")
                return

            path = os.path.join(tempfile.gettempdir(), asset["name"])
            
            # 2. Descargar con streaming para el progreso
            with requests.get(asset["browser_download_url"], stream=True, timeout=30) as r:
                r.raise_for_status()
                total = int(r.headers.get('content-length', 0))
                done = 0
                start = time.time()
                
                with open(path, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=16384):
                        f.write(chunk)
                        done += len(chunk)
                        elapsed = time.time() - start
                        if total > 0 and elapsed > 0:
                            speed = done / elapsed
                            eta = (total - done) / speed
                            perc = int(done * 100 / total)
                            info = f"{done/1024/1024:.1f} / {total/1024/1024:.1f} MB ({speed/1024/1024:.1f} MB/s) - {int(eta)}s"
                            self.progress.emit(perc, info)
            
            self.finished.emit(path)
        except Exception as e:
            self.error.emit(str(e))

class SetupUI(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("StormStore Downloader")
        self.setFixedSize(400, 110)
        self.setWindowFlags(Qt.Window | Qt.CustomizeWindowHint | Qt.WindowTitleHint | Qt.WindowCloseButtonHint)
        self.setStyleSheet("QWidget{background:#121212;color:#eee;font-family:sans-serif;} QProgressBar{border:1px solid #333;border-radius:4px;text-align:center;} QProgressBar::chunk{background:#fdd835;}")
        
        layout = QVBoxLayout(self)
        self.lbl = QLabel("Iniciando descarga...")
        self.bar = QProgressBar()
        self.inf = QLabel("")
        self.inf.setAlignment(Qt.AlignRight)
        for w in [self.lbl, self.bar, self.inf]: layout.addWidget(w)

        self.wk = DownloadWorker()
        self.wk.progress.connect(lambda p, i: (self.bar.setValue(p), self.inf.setText(i), self.lbl.setText(f"Descargando... {p}%")))
        self.wk.finished.connect(lambda p: (subprocess.Popen([p], shell=True), sys.exit()))
        self.wk.error.connect(lambda e: self.lbl.setText(f"Error: {e}"))
        self.wk.start()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    ui = SetupUI()
    ui.show()
    sys.exit(app.exec())