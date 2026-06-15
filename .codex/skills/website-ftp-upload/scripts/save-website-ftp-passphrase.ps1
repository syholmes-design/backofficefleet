[CmdletBinding()]
param(
    [string]$CredentialPassphrasePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-FullPath {
    param([Parameter(Mandatory = $true)][string]$Path)
    return [System.IO.Path]::GetFullPath((Resolve-Path -LiteralPath $Path).Path)
}

function Convert-SecureStringToPlainText {
    param([Parameter(Mandatory = $true)][securestring]$SecureString)
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureString)
    try {
        return [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    }
    finally {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

$projectRoot = Resolve-FullPath -Path (Join-Path $PSScriptRoot "..\..\..\..")
if ([string]::IsNullOrWhiteSpace($CredentialPassphrasePath)) {
    $CredentialPassphrasePath = Join-Path $projectRoot ".codex\secrets\website-ftps-passphrase.txt"
}

$passphraseSecure = Read-Host -Prompt "Enter BOF encrypted FTP credential passphrase to save for unattended uploads" -AsSecureString
$passphraseConfirmSecure = Read-Host -Prompt "Confirm BOF encrypted FTP credential passphrase" -AsSecureString

$passphrase = Convert-SecureStringToPlainText -SecureString $passphraseSecure
$passphraseConfirm = Convert-SecureStringToPlainText -SecureString $passphraseConfirmSecure

if ([string]::IsNullOrWhiteSpace($passphrase) -or $passphrase -ne $passphraseConfirm) {
    throw "Credential-file passphrase is empty or does not match confirmation."
}

$secretFolder = Split-Path -Path $CredentialPassphrasePath -Parent
if (-not (Test-Path -LiteralPath $secretFolder)) {
    New-Item -ItemType Directory -Path $secretFolder -Force | Out-Null
}

Set-Content -LiteralPath $CredentialPassphrasePath -Value $passphrase -Encoding UTF8 -NoNewline

[pscustomobject]@{
    Mode = "Saved"
    CredentialPassphrasePath = $CredentialPassphrasePath
    PlaintextStored = $true
    GitIgnoredByProject = $true
    PortableToSyncedComputer = $true
    RequiresPassphraseAtUpload = $false
} | Format-List
