; assets/installer.nsh
; Completely unrestricted OS compatibility (supports Windows 7, 8, 10, 11)


; Seed installer into updater cache directory so future updates use differential downloads
!macro customInstall
  CreateDirectory "$LOCALAPPDATA\noxis-hub-updater"
  CopyFiles /SILENT "$EXEPATH" "$LOCALAPPDATA\noxis-hub-updater\installer.exe"
!macroend
