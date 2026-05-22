param(
  [string]$CheckpointName,
  [string]$CheckpointRoot,
  [string[]]$Paths,
  [switch]$SkipSafetyCheckpoint,
  [switch]$List
)

$ErrorActionPreference = "Stop"

function Format-Bytes {
  param([long]$Bytes)
  if ($Bytes -ge 1GB) { return ("{0:N2} GB" -f ($Bytes / 1GB)) }
  if ($Bytes -ge 1MB) { return ("{0:N2} MB" -f ($Bytes / 1MB)) }
  if ($Bytes -ge 1KB) { return ("{0:N2} KB" -f ($Bytes / 1KB)) }
  return "$Bytes B"
}

function Convert-ToArchivePath {
  param([string]$Path)
  $normalized = $Path.Replace('\', '/').TrimStart('/')
  while ($normalized.StartsWith("./")) {
    $normalized = $normalized.Substring(2)
  }
  return $normalized
}

function Test-SelectedArchivePath {
  param(
    [string]$EntryPath,
    [string[]]$SelectedPaths
  )
  if (-not $SelectedPaths -or $SelectedPaths.Count -eq 0) { return $true }
  $entryNormalized = Convert-ToArchivePath -Path $EntryPath
  foreach ($selected in $SelectedPaths) {
    $selectedNormalized = Convert-ToArchivePath -Path $selected
    if (-not $selectedNormalized) { continue }
    if ($entryNormalized.Equals($selectedNormalized, [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
    if ($entryNormalized.StartsWith($selectedNormalized.TrimEnd('/') + "/", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
  }
  return $false
}

function Get-DefaultCheckpointRoot {
  if ($env:BOF_SHARED_CHECKPOINT_ROOT) {
    return $env:BOF_SHARED_CHECKPOINT_ROOT
  }

  $localAppData = $env:LOCALAPPDATA
  if (-not $localAppData) {
    $localAppData = [Environment]::GetFolderPath([Environment+SpecialFolder]::LocalApplicationData)
  }
  if (-not $localAppData) {
    $localAppData = Join-Path $HOME "AppData\Local"
  }

  return (Join-Path (Join-Path $localAppData "BackOfficeFleet") "SharedRollback")
}

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not $CheckpointRoot) {
  $CheckpointRoot = Get-DefaultCheckpointRoot
}
$CheckpointRoot = [System.IO.Path]::GetFullPath($CheckpointRoot)

if ($List -or -not $CheckpointName) {
  & (Join-Path $PSScriptRoot "bof-list-shared-checkpoints.ps1") -CheckpointRoot $CheckpointRoot
  exit $LASTEXITCODE
}

if ($CheckpointName -notmatch '^bof-shared-checkpoint-\d{4}-\d{2}-\d{2}-\d{6}\.zip$') {
  throw "Invalid checkpoint name. Use the exact file name format bof-shared-checkpoint-YYYY-MM-DD-HHMMSS.zip."
}

$checkpointPath = [System.IO.Path]::GetFullPath((Join-Path $CheckpointRoot $CheckpointName))
$checkpointRootWithSeparator = $CheckpointRoot.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
if (-not $checkpointPath.StartsWith($checkpointRootWithSeparator, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to restore a checkpoint outside the shared rollback folder."
}
if (-not (Test-Path -LiteralPath $checkpointPath)) {
  throw "Checkpoint not found: $CheckpointName"
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$verification = "Failed"
$entryCount = 0
try {
  $verifyZip = [System.IO.Compression.ZipFile]::OpenRead($checkpointPath)
  try {
    $entryCount = $verifyZip.Entries.Count
    if ($entryCount -gt 0) {
      $verification = "Passed ($entryCount entries readable)"
    }
  } finally {
    $verifyZip.Dispose()
  }
} catch {
  throw "Checkpoint is not readable: $($_.Exception.Message)"
}

Write-Warning "Restore may overwrite current project files in $ProjectRoot."

$safetyCheckpointCreated = "No"
if (-not $SkipSafetyCheckpoint) {
  & (Join-Path $PSScriptRoot "bof-shared-checkpoint.ps1") -CheckpointRoot $CheckpointRoot | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Safety shared checkpoint failed. Restore aborted."
  }
  $safetyCheckpointCreated = "Yes"
}

$created = 0
$replaced = 0
$skippedBySelection = 0
$warnings = New-Object System.Collections.Generic.List[string]
$projectRootFull = [System.IO.Path]::GetFullPath($ProjectRoot).TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar

$zip = [System.IO.Compression.ZipFile]::OpenRead($checkpointPath)
try {
  foreach ($entry in $zip.Entries) {
    if (-not $entry.FullName -or $entry.FullName.EndsWith("/")) { continue }
    if (-not (Test-SelectedArchivePath -EntryPath $entry.FullName -SelectedPaths $Paths)) {
      $skippedBySelection++
      continue
    }

    $targetPath = [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot ($entry.FullName.Replace('/', [System.IO.Path]::DirectorySeparatorChar))))
    if (-not $targetPath.StartsWith($projectRootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
      $warnings.Add("Skipped unsafe archive path: $($entry.FullName)") | Out-Null
      continue
    }

    $targetDir = Split-Path $targetPath -Parent
    if (-not (Test-Path -LiteralPath $targetDir)) {
      New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }

    if (Test-Path -LiteralPath $targetPath) { $replaced++ } else { $created++ }
    $entryStream = $entry.Open()
    try {
      $targetStream = [System.IO.File]::Open($targetPath, [System.IO.FileMode]::Create, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
      try {
        $entryStream.CopyTo($targetStream)
      } finally {
        $targetStream.Dispose()
      }
    } finally {
      $entryStream.Dispose()
    }
  }
} finally {
  $zip.Dispose()
}

$checkpointItem = Get-Item -LiteralPath $checkpointPath
$selectionText = if ($Paths -and $Paths.Count -gt 0) { $Paths -join ", " } else { "Full checkpoint" }
$warningText = if ($warnings.Count) { $warnings -join "; " } else { "Restore overlays files from the checkpoint; files not present in the checkpoint are not deleted." }

Write-Output "## Shared Rollback Restore Report"
Write-Output "Checkpoint restored: $CheckpointName ($(Format-Bytes $checkpointItem.Length))"
Write-Output "Restore target: $ProjectRoot"
Write-Output "Selection: $selectionText"
Write-Output "Files replaced: $replaced"
Write-Output "Files created: $created"
Write-Output "Entries skipped by selection: $skippedBySelection"
Write-Output "Pre-restore safety checkpoint created: $safetyCheckpointCreated"
Write-Output "Verification: $verification"
Write-Output "Warnings: $warningText"
Write-Output "Next recommended action: Run npm run codex:registry-sync if operating-layer files were restored, then add a short handoff note if others are working."
