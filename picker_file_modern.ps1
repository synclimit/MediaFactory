Add-Type -AssemblyName System.Windows.Forms
$OpenFileDialog = New-Object System.Windows.Forms.OpenFileDialog
$OpenFileDialog.Filter = 'Audio Files|*.mp3;*.wav;*.flac;*.m4a'
$OpenFileDialog.ShowHelp = $true
$OpenFileDialog.Title = 'Select a File'
$form = New-Object System.Windows.Forms.Form
$form.TopMost = $true
$form.Add_Shown({$form.Hide()})
if ($OpenFileDialog.ShowDialog($form) -eq 'OK') {
    $OpenFileDialog.FileName | Out-File -FilePath $args[0] -Encoding utf8
} else {
    "" | Out-File -FilePath $args[0] -Encoding utf8
}
