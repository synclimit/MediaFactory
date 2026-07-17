Add-Type -AssemblyName System.Windows.Forms
$OpenFileDialog = New-Object System.Windows.Forms.OpenFileDialog
$OpenFileDialog.ValidateNames = $false
$OpenFileDialog.CheckFileExists = $false
$OpenFileDialog.CheckPathExists = $true
$OpenFileDialog.FileName = "Folder Selection"
$OpenFileDialog.Title = "Select a Folder (File Explorer Style)"
$form = New-Object System.Windows.Forms.Form
$form.TopMost = $true
$form.Add_Shown({$form.Hide()})
if ($OpenFileDialog.ShowDialog($form) -eq 'OK') {
    $path = $OpenFileDialog.FileName
    if ([System.IO.File]::Exists($path)) {
        Split-Path $path | Out-File -FilePath $args[0] -Encoding utf8
    } elseif ([System.IO.Directory]::Exists($path)) {
        $path | Out-File -FilePath $args[0] -Encoding utf8
    } else {
        Split-Path $path | Out-File -FilePath $args[0] -Encoding utf8
    }
} else {
    "" | Out-File -FilePath $args[0] -Encoding utf8
}
