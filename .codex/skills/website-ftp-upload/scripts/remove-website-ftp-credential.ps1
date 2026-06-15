[CmdletBinding()]
param(
    [string]$CredentialPath,
    [string]$CredentialPassphrasePath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Resolve-FullPath {
    param([Parameter(Mandatory = $true)][string]$Path)
    return [System.IO.Path]::GetFullPath((Resolve-Path -LiteralPath $Path).Path)
}

$projectRoot = Resolve-FullPath -Path (Join-Path $PSScriptRoot "..\..\..\..")
if ([string]::IsNullOrWhiteSpace($CredentialPath)) {
    $CredentialPath = Join-Path $projectRoot ".codex\secrets\website-ftps-credential.json"
}

if ([string]::IsNullOrWhiteSpace($CredentialPassphrasePath)) {
    $CredentialPassphrasePath = Join-Path $projectRoot ".codex\secrets\website-ftps-passphrase.txt"
}

if (Test-Path -LiteralPath $CredentialPath) {
    Remove-Item -LiteralPath $CredentialPath -Force
    $credentialRemoved = $true
}
else {
    $credentialRemoved = $false
}

if (Test-Path -LiteralPath $CredentialPassphrasePath) {
    Remove-Item -LiteralPath $CredentialPassphrasePath -Force
    $passphraseRemoved = $true
}
else {
    $passphraseRemoved = $false
}

[pscustomobject]@{
    Mode = "Removed"
    CredentialPath = $CredentialPath
    CredentialRemoved = $credentialRemoved
    CredentialPassphrasePath = $CredentialPassphrasePath
    CredentialPassphraseRemoved = $passphraseRemoved
} | Format-List
