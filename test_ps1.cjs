const { exec } = require('child_process');
exec(`powershell -ExecutionPolicy Bypass -File folder_picker.ps1 "temp_output.txt"`, (err, stdout, stderr) => {
    console.log('err:', err);
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);
});
