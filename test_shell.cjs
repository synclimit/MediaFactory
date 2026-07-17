const { exec } = require('child_process');
const psCommand = `$app = New-Object -ComObject Shell.Application; $folder = $app.BrowseForFolder(0, 'Select Folder', 0, 0); if ($folder) { Write-Output $folder.Self.Path }`;
exec(`powershell -sta -command "${psCommand}"`, (err, stdout, stderr) => {
    console.log('err:', err);
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);
});
