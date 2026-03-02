!macro customInit
  StrCpy $INSTDIR "$APPDATA\StormGamesStudios\StormStore"
!macroend

!macro customInstall
  SetShellVarContext all
  CreateDirectory "$SMPROGRAMS\StormGamesStudios"
  CreateShortCut "$SMPROGRAMS\StormGamesStudios\StormStore.lnk" "$INSTDIR\StormStore.exe"
  CreateShortCut "$SMPROGRAMS\StormGamesStudios\StormVortex.lnk" "$INSTDIR\StormStore.exe" "--StormVortex"
  SetShellVarContext current
!macroend

!macro customUnInstall
  SetShellVarContext all
  Delete "$SMPROGRAMS\StormGamesStudios\StormStore.lnk"
  Delete "$SMPROGRAMS\StormGamesStudios\StormVortex.lnk"
  RMDir "$SMPROGRAMS\StormGamesStudios"
  SetShellVarContext current
!macroend