const { execSync } = require('child_process');
const fs = require('fs');
try {
  if (fs.existsSync('D:\\MediaFactory\\out_path.txt')) fs.unlinkSync('D:\\MediaFactory\\out_path.txt');
  const psCode = `
    $taskName = "MediaFactoryPickerTest"
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File D:\MediaFactory\picker.ps1 'Video Files|*.mp4' D:\MediaFactory\out_path.txt"
    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddSeconds(2)
    Register-ScheduledTask -TaskName $taskName -Action $action -User $env:USERNAME -Force | Out-Null
    Start-ScheduledTask -TaskName $taskName | Out-Null
  `;
  execSync(`powershell -sta -command "${psCode.replace(/\n/g, '; ')}"`);
  console.log("Scheduled task started");
} catch (e) {
  console.error("ERROR", e.message);
}
