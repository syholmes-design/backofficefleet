param(
  [string]$BackupName,
  [string]$BackupRoot,
  [switch]$SkipSafetyBackup,
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

function Get-DefaultBackupRoot {
  if ($env:BOF_BACKUP_ROOT) {
    return $env:BOF_BACKUP_ROOT
  }

  $localAppData = $env:LOCALAPPDATA
  if (-not $localAppData) {
    $localAppData = [Environment]::GetFolderPath([Environment+SpecialFolder]::LocalApplicationData)
  }
  if (-not $localAppData) {
    $localAppData = Join-Path $HOME "AppData\Local"
  }

  return (Join-Path (Join-Path $localAppData "BackOfficeFleet") "Backups")
}

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not $BackupRoot) {
  $BackupRoot = Get-DefaultBackupRoot
}
$BackupRoot = [System.IO.Path]::GetFullPath($BackupRoot)

if ($List -or -not $BackupName) {
  & (Join-Path $PSScriptRoot "bof-list-backups.ps1") -BackupRoot $BackupRoot
  exit $LASTEXITCODE
}

if ($BackupName -notmatch '^bof-backup-\d{4}-\d{2}-\d{2}-\d{6}\.zip$') {
  throw "Invalid backup name. Use the exact file name format bof-backup-YYYY-MM-DD-HHMMSS.zip."
}

$backupPath = [System.IO.Path]::GetFullPath((Join-Path $BackupRoot $BackupName))
$backupRootWithSeparator = $BackupRoot.TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
if (-not $backupPath.StartsWith($backupRootWithSeparator, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to restore a backup outside the backup folder."
}
if (-not (Test-Path -LiteralPath $backupPath)) {
  throw "Backup not found: $BackupName"
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$verification = "Failed"
$entryCount = 0
try {
  $verifyZip = [System.IO.Compression.ZipFile]::OpenRead($backupPath)
  try {
    $entryCount = $verifyZip.Entries.Count
    if ($entryCount -gt 0) {
      $verification = "Passed ($entryCount entries readable)"
    }
  } finally {
    $verifyZip.Dispose()
  }
} catch {
  throw "Backup is not readable: $($_.Exception.Message)"
}

Write-Warning "Restore may overwrite current project files in $ProjectRoot."

$safetyBackupCreated = "No"
if (-not $SkipSafetyBackup) {
  & (Join-Path $PSScriptRoot "bof-backup.ps1") -BackupRoot $BackupRoot | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Safety backup failed. Restore aborted."
  }
  $safetyBackupCreated = "Yes"
}

$created = 0
$replaced = 0
$warnings = New-Object System.Collections.Generic.List[string]
$projectRootFull = [System.IO.Path]::GetFullPath($ProjectRoot).TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar

$zip = [System.IO.Compression.ZipFile]::OpenRead($backupPath)
try {
  foreach ($entry in $zip.Entries) {
    if (-not $entry.FullName -or $entry.FullName.EndsWith("/")) { continue }

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

$backupItem = Get-Item -LiteralPath $backupPath
$warningText = if ($warnings.Count) { $warnings -join "; " } else { "Restore overlays files from the archive; files not present in the archive are not deleted." }

Write-Output "## Restore Report"
Write-Output "Backup restored: $BackupName ($(Format-Bytes $backupItem.Length))"
Write-Output "Restore target: $ProjectRoot"
Write-Output "Files replaced: $replaced"
Write-Output "Files created: $created"
Write-Output "Pre-restore safety backup created: $safetyBackupCreated"
Write-Output "Verification: $verification"
Write-Output "Warnings: $warningText"
Write-Output "Next recommended action: Run npm run codex:registry-sync, then add a Project Integration Coordinator handoff note if others are working."
