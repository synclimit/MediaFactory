; Custom NSIS script for MediaFactory
; Fixes electron-builder silent/auto-update hang where PAGE_INSTALL_MODE
; is not skipped during --updated or /S in assisted installer (oneClick: false).

!macro customInstallMode
  ${if} ${Silent}
  ${orIf} ${isUpdated}
    StrCpy $isForceCurrentInstall "1"
  ${endif}
!macroend
