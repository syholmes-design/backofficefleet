param(
  [string]$BackupRoot
)

$ErrorActionPreference = "Stop"
$MaxBackups = 5
$MaxTotalBytes = 15GB

function Format-Bytes {
  param([long]$Bytes)
  if ($Bytes -ge 1GB) { return ("{0:N2} GB" -f ($Bytes / 1GB)) }
  if ($Bytes -ge 1MB) { return ("{0:N2} MB" -f ($Bytes / 1MB)) }
  if ($Bytes -ge 1KB) { return ("{0:N2} KB" -f ($Bytes / 1KB)) }
  return "$Bytes B"
}

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not $BackupRoot) {
  $BackupRoot = Join-Path (Split-Path $ProjectRoot -Parent) "BackOfficeFleet-Backups"
}
$BackupRoot = [System.IO.Path]::GetFullPath($BackupRoot)

if (-not (Test-Path -LiteralPath $BackupRoot)) {
  New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
}

$backups = @(Get-ChildItem -LiteralPath $BackupRoot -Filter "bof-backup-*.zip" -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending)
$totalBytes = [long](($backups | Measure-Object -Property Length -Sum).Sum)

Write-Output "## Backup List"
Write-Output "Backup folder: $BackupRoot"
Write-Output "Backup count: $($backups.Count) / $MaxBackups"
Write-Output "Total backup storage: $(Format-Bytes $totalBytes) / $(Format-Bytes $MaxTotalBytes)"

if ($backups.Count -eq 0) {
  Write-Output "Backups: None found."
  Write-Output "Next recommended action: Run scripts/bof-backup.ps1 after a stable project state."
  exit 0
}

Write-Output "Backups:"
foreach ($backup in $backups) {
  Write-Output "- $($backup.Name) | Created: $($backup.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')) | Size: $(Format-Bytes $backup.Length)"
}

Write-Output "Next recommended action: Restore only by exact backup name, after confirming current work can be overwritten."
