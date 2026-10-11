; Custom NSIS script for MediaFactory
; Forcefully kill all MediaFactory processes and lingering tools so update is never blocked

!macro customInit
  nsExec::Exec 'taskkill /F /IM MediaFactory.exe'
  nsExec::Exec 'taskkill /F /IM ffmpeg.exe'
  nsExec::Exec 'taskkill /F /IM ffprobe.exe'
  nsExec::Exec 'taskkill /F /IM yt-dlp.exe'
  Sleep 1000
!macroend

!macro customUnInstall
  nsExec::Exec 'taskkill /F /IM MediaFactory.exe'
  Sleep 1000
!macroend

!macro customInstallMode
  ${if} ${Silent}
  ${orIf} ${isUpdated}
    StrCpy $isForceCurrentInstall "1"
  ${endif}
!macroend
