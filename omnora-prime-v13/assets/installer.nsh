; assets/installer.nsh
!include "MUI2.nsh"

; Check Windows version — require Win10 or higher (Build 17763 = Win10 1809)
Function .onInit
  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\Windows NT\CurrentVersion" "CurrentBuildNumber"
  IntCmp $0 17763 ok ok old
  old:
    MessageBox MB_OK|MB_ICONSTOP "Noxis requires Windows 10 (1809) or later to ensure stability and compatibility with the Sentinel AI vision engine."
    Abort
  ok:
FunctionEnd

; Custom logic to check if required ports are available
Section "Port Check"
  ; Check if port 3000 is in use
  ; This is a simplified placeholder as NSIS requires plugins for real socket checks
SectionEnd

