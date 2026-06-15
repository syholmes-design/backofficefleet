param(
  [Parameter(Mandatory = $true)]
  [string]$BackupZip,
  [string]$WebsitePath = "Website",
  [switch]$ConfirmRestore,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Resolve-ProjectPath {
  param([string]$PathValue)
  if ([System.IO.Path]::IsPathRooted($PathValue)) {
    return [System.IO.Path]::GetFullPath($PathValue)
  }
  return [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot $PathValue))
}

$ProjectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\..\..\.."))
$WebsiteFull = Resolve-ProjectPath $WebsitePath
$BackupFull = Resolve-ProjectPath $BackupZip
$TempRoot = [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot ".codex\tmp"))
$TempRestore = Join-Path $TempRoot ("website-restore-" + (Get-Date -Format "yyyyMMdd-HHmmss"))

$projectWithSep = $ProjectRoot.TrimEnd("\", "/") + [System.IO.Path]::DirectorySeparatorChar
$websiteExpected = [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot "Website"))

if (-not (Test-Path -LiteralPath $BackupFull -PathType Leaf)) {
  throw "Backup zip not found: $BackupFull"
}

if ($WebsiteFull -ne $websiteExpected) {
  throw "Restore target must be this project's Website folder. Resolved target: $WebsiteFull"
}

if (-not $WebsiteFull.StartsWith($projectWithSep, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Restore target resolves outside the project root: $WebsiteFull"
}

if (-not $DryRun -and -not $ConfirmRestore) {
  throw "Restore is destructive. Re-run with -ConfirmRestore after confirming the backup path."
}

if ($DryRun) {
  [ordered]@{
    dryRun = $true
    backup = $BackupFull
    target = $WebsiteFull
    temp = $TempRestore
    requiresConfirmRestore = $true
  } | ConvertTo-Json -Depth 5
  exit 0
}

$backupScript = Join-Path $PSScriptRoot "backup-website.ps1"
$safety = & $backupScript -Label "before-restore" | ConvertFrom-Json

New-Item -ItemType Directory -Force -Path $TempRoot | Out-Null
New-Item -ItemType Directory -Force -Path $TempRestore | Out-Null
Expand-Archive -LiteralPath $BackupFull -DestinationPath $TempRestore -Force

$expandedWebsite = Join-Path $TempRestore "Website"
if (Test-Path -LiteralPath $expandedWebsite -PathType Container) {
  $RestoreSource = $expandedWebsite
} else {
  $RestoreSource = $TempRestore
}

if (-not (Test-Path -LiteralPath $RestoreSource -PathType Container)) {
  throw "Expanded backup does not contain a restorable Website folder."
}

if (-not (Test-Path -LiteralPath $WebsiteFull -PathType Container)) {
  New-Item -ItemType Directory -Force -Path $WebsiteFull | Out-Null
}

$resolvedTarget = [System.IO.Path]::GetFullPath($WebsiteFull)
if ($resolvedTarget -ne $websiteExpected) {
  throw "Refusing to clear unexpected target: $resolvedTarget"
}

Get-ChildItem -LiteralPath $WebsiteFull -Force | Remove-Item -Recurse -Force
Get-ChildItem -LiteralPath $RestoreSource -Force | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $WebsiteFull -Recurse -Force
}

Remove-Item -LiteralPath $TempRestore -Recurse -Force

[ordered]@{
  restoredFrom = $BackupFull
  target = $WebsiteFull
  safetyBackup = $safety.backup
  safetyManifest = $safety.manifest
} | ConvertTo-Json -Depth 5
