Add-Type -AssemblyName System.Windows.Forms
$OpenFileDialog = New-Object System.Windows.Forms.OpenFileDialog
$OpenFileDialog.Filter = $args[0]
$OpenFileDialog.ShowHelp = $true
$form = New-Object System.Windows.Forms.Form
$form.TopMost = $true
$form.Add_Shown({$form.Hide()})
if ($OpenFileDialog.ShowDialog($form) -eq 'OK') {
    $OpenFileDialog.FileName | Out-File -FilePath $args[1] -Encoding utf8
} else {
    "" | Out-File -FilePath $args[1] -Encoding utf8
}
