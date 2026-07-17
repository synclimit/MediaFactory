import { exec } from 'child_process';
const psCommand = `Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.OpenFileDialog; $f.Filter = 'Video Files|*.mp4;*.mov;*.mkv;*.avi;*.webm'; $f.ShowHelp = $true; $form = New-Object System.Windows.Forms.Form; $form.TopMost = $true; $form.Add_Shown({$form.Hide()}); if($f.ShowDialog($form) -eq 'OK'){ $f.FileName }`;
exec(`powershell -sta -command "${psCommand}"`, { timeout: 10000 }, (err, stdout, stderr) => {
  console.log('ERR:', err?.message);
  console.log('STDERR:', stderr);
  console.log('STDOUT:', stdout);
});
