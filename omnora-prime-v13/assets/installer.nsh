; assets/installer.nsh
; High-speed, unhindered installer script for Noxis Hub (Windows 7, 8, 10, 11)

; Cleanly close active processes to release file locks without delay
!macro customInit
  nsExec::Exec 'taskkill /F /IM "Noxis Hub.exe" /T'
  nsExec::Exec 'taskkill /F /IM "Noxis.exe" /T'
  nsExec::Exec 'taskkill /F /IM "electron.exe" /T'
  nsExec::Exec 'taskkill /F /IM "mediamtx.exe" /T'
!macroend

; Launch application automatically upon silent update completion
!macro customInstallEnd
  ${if} ${isSilent}
    ExecShell "" "$INSTDIR\Noxis Hub.exe"
  ${endif}
!macroend
