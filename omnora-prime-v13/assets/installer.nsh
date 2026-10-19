; assets/installer.nsh
; Completely unrestricted OS compatibility (supports Windows 7, 8, 10, 11)

; Ensure all running processes are cleanly terminated before extraction to prevent file lock sharing violations
!macro customInit
  nsExec::Exec 'taskkill /F /IM "Noxis Hub.exe" /T'
  nsExec::Exec 'taskkill /F /IM "Noxis.exe" /T'
  nsExec::Exec 'taskkill /F /IM "electron.exe" /T'
  nsExec::Exec 'taskkill /F /IM "mediamtx.exe" /T'
  Sleep 2000
!macroend

; Seed installer into updater cache directory so future updates use differential downloads
!macro customInstall
  CreateDirectory "$LOCALAPPDATA\noxis-hub-updater"
  CopyFiles /SILENT "$EXEPATH" "$LOCALAPPDATA\noxis-hub-updater\installer.exe"
!macroend
