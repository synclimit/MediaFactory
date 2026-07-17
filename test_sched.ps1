$taskName = "MediaFactoryPickerTest"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File D:\MediaFactory\picker.ps1 'Video Files|*.mp4' D:\MediaFactory\out_path.txt"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddSeconds(2)
Register-ScheduledTask -TaskName $taskName -Action $action -User $env:USERNAME -Force | Out-Null
Start-ScheduledTask -TaskName $taskName | Out-Null
Write-Output "Scheduled task started"
while((Get-ScheduledTask -TaskName $taskName).State -eq 'Running') { Start-Sleep -Milliseconds 200 }
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false | Out-Null
if (Test-Path "D:\MediaFactory\out_path.txt") {
    $content = Get-Content "D:\MediaFactory\out_path.txt"
    Write-Output "Result: $content"
}
