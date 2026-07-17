Add-Type -AssemblyName System.Windows.Forms
$FolderBrowserDialog = New-Object System.Windows.Forms.FolderBrowserDialog
$form = New-Object System.Windows.Forms.Form
$form.TopMost = $true
$form.Add_Shown({$form.Hide()})
if ($FolderBrowserDialog.ShowDialog($form) -eq 'OK') {
    $FolderBrowserDialog.SelectedPath | Out-File -FilePath $args[0] -Encoding utf8
} else {
    "" | Out-File -FilePath $args[0] -Encoding utf8
}
