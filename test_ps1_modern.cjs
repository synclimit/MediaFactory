const { exec } = require('child_process');
exec(`powershell -sta -ExecutionPolicy Bypass -File picker_folder_modern.ps1 "temp_output2.txt"`, (err, stdout, stderr) => {
    console.log('err:', err);
});
