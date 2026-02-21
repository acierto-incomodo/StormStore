!macro customInit
  ; Carpeta de instalación
  StrCpy $INSTDIR "$APPDATA\StormGamesStudios\StormStore"

  ; Crear el shortcut principal (StormStore)
  CreateShortCut "$SMPROGRAMS\StormGamesStudios\StormStore.lnk" "$INSTDIR\StormStore.exe"

  ; Crear el segundo shortcut (StormVortex)
  CreateShortCut "$SMPROGRAMS\StormGamesStudios\StormVortex.lnk" "$INSTDIR\StormStore.exe" "--StormVortex"
!macroend