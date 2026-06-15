[CmdletBinding()]
param(
    [string]$CredentialPath
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

if (Test-Path -LiteralPath $CredentialPath) {
    Remove-Item -LiteralPath $CredentialPath -Force
    $removed = $true
}
else {
    $removed = $false
}

[pscustomobject]@{
    Mode = "Removed"
    CredentialPath = $CredentialPath
    Removed = $removed
} | Format-List
