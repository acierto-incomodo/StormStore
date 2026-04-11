./Clear.ps1
python -m PyInstaller --onefile --windowed --noconsole --icon=app.ico --add-data "app.png;." --add-data "app.ico;." --strip StormStore-Setup.py