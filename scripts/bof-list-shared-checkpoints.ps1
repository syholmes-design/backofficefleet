param(
  [string]$CheckpointRoot,
  [Int64]$MaxTotalBytes = 15GB
)

$ErrorActionPreference = "Stop"

function Format-Bytes {
  param([long]$Bytes)
  if ($Bytes -ge 1GB) { return ("{0:N2} GB" -f ($Bytes / 1GB)) }
  if ($Bytes -ge 1MB) { return ("{0:N2} MB" -f ($Bytes / 1MB)) }
  if ($Bytes -ge 1KB) { return ("{0:N2} KB" -f ($Bytes / 1KB)) }
  return "$Bytes B"
}

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not $CheckpointRoot) {
  $CheckpointRoot = Join-Path (Split-Path $ProjectRoot -Parent) "BackOfficeFleet-Shared-Rollback"
}
$CheckpointRoot = [System.IO.Path]::GetFullPath($CheckpointRoot)

if (-not (Test-Path -LiteralPath $CheckpointRoot)) {
  New-Item -ItemType Directory -Path $CheckpointRoot -Force | Out-Null
}

$checkpoints = @(Get-ChildItem -LiteralPath $CheckpointRoot -Filter "bof-shared-checkpoint-*.zip" -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending)
$totalBytes = [long](($checkpoints | Measure-Object -Property Length -Sum).Sum)

Write-Output "## Shared Rollback Checkpoint List"
Write-Output "Checkpoint folder: $CheckpointRoot"
Write-Output "Checkpoint count: $($checkpoints.Count) (no count limit)"
Write-Output "Total shared rollback storage: $(Format-Bytes $totalBytes) / $(Format-Bytes $MaxTotalBytes)"

if ($checkpoints.Count -eq 0) {
  Write-Output "Checkpoints: None found."
  Write-Output "Next recommended action: Run scripts/bof-shared-checkpoint.ps1 before meaningful shared edits."
  exit 0
}

Write-Output "Checkpoints:"
foreach ($checkpoint in $checkpoints) {
  Write-Output "- $($checkpoint.Name) | Created: $($checkpoint.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')) | Size: $(Format-Bytes $checkpoint.Length)"
}

Write-Output "Next recommended action: Restore only by exact checkpoint name, after confirming current work can be overwritten."
