param([Parameter(Mandatory=$true)][string]$Sender)
$ErrorActionPreference = 'Stop'
Write-Host "Heart to Heart email setup for $Sender"
Write-Host 'Enter a Google app password, not the normal Gmail password.'
Write-Host 'The value is masked and uploaded directly to Firebase Secret Manager.'
$secure = Read-Host 'Google app password' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
    $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) -replace '\s',''
    if ($password.Length -ne 16) { throw 'Expected the 16-character Google app password.' }
    $start = New-Object System.Diagnostics.ProcessStartInfo
    $start.FileName = (Get-Command node).Source
    $start.Arguments = '"' + (Join-Path $PSScriptRoot 'configure-gmail.mjs') + '"'
    $start.UseShellExecute = $false
    $start.RedirectStandardInput = $true
    $process = [System.Diagnostics.Process]::Start($start)
    $process.StandardInput.Write((@{sender=$Sender;password=$password} | ConvertTo-Json -Compress))
    $process.StandardInput.Close()
    $process.WaitForExit()
    if ($process.ExitCode -ne 0) { throw 'Email setup did not finish. See the message above.' }
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    $password = $null
    $secure.Dispose()
}
