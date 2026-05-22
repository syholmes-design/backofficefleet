param(
  [string]$BackupRoot,
  [switch]$ExcludeGeneratedArtifacts
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

function Get-RelativePath {
  param(
    [string]$Root,
    [string]$Path
  )
  $rootFull = [System.IO.Path]::GetFullPath($Root).TrimEnd('\', '/') + [System.IO.Path]::DirectorySeparatorChar
  $pathFull = [System.IO.Path]::GetFullPath($Path)
  return $pathFull.Substring($rootFull.Length).Replace('\', '/')
}

function Test-ExcludedPath {
  param([string]$RelativePath)
  $rel = $RelativePath.Replace('\', '/')
  $baseExcludedPrefixes = @(
    "node_modules/",
    ".next/",
    ".vercel/",
    ".git/",
    "coverage/",
    "playwright-report/",
    "test-results/",
    ".codex/reports/visual-smoke/"
  )
  $generatedPrefixes = @(
    "public/generated/",
    "public/documents/",
    "public/proof/",
    "public/evidence/",
    "public/reference/",
    "public/actual_docs/",
    "lib/generated/"
  )

  foreach ($prefix in $baseExcludedPrefixes) {
    if ($rel.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
  }
  if ($ExcludeGeneratedArtifacts) {
    foreach ($prefix in $generatedPrefixes) {
      if ($rel.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
    }
  }
  if ([System.IO.Path]::GetFileName($rel).Equals("tsconfig.tsbuildinfo", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
  if ($rel.EndsWith(".log", [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
  return $false
}

function Invoke-PruneBackups {
  param([string]$Root)
  $pruned = New-Object System.Collections.Generic.List[string]

  while ($true) {
    $backups = @(Get-ChildItem -LiteralPath $Root -Filter "bof-backup-*.zip" -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime)
    $total = [long](($backups | Measure-Object -Property Length -Sum).Sum)
    if ($backups.Count -le $MaxBackups -and $total -le $MaxTotalBytes) { break }
    if ($backups.Count -eq 0) { break }
    $oldest = $backups[0]
    $pruned.Add($oldest.Name) | Out-Null
    Remove-Item -LiteralPath $oldest.FullName -Force
  }

  return $pruned
}

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not $BackupRoot) {
  $BackupRoot = Join-Path (Split-Path $ProjectRoot -Parent) "BackOfficeFleet-Backups"
}
$BackupRoot = [System.IO.Path]::GetFullPath($BackupRoot)

if ($BackupRoot.TrimEnd('\', '/').StartsWith($ProjectRoot.TrimEnd('\', '/'), [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "BackupRoot must be outside the project root. Requested: $BackupRoot"
}

if (-not (Test-Path -LiteralPath $BackupRoot)) {
  New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$backupName = "bof-backup-$timestamp.zip"
$archivePath = Join-Path $BackupRoot $backupName
$warnings = New-Object System.Collections.Generic.List[string]
$skipped = 0
$entryCount = 0

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($archivePath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  $files = Get-ChildItem -LiteralPath $ProjectRoot -Recurse -File -Force -ErrorAction SilentlyContinue
  foreach ($file in $files) {
    $relative = Get-RelativePath -Root $ProjectRoot -Path $file.FullName
    if (Test-ExcludedPath -RelativePath $relative) { continue }

    try {
      $entry = $zip.CreateEntry($relative, [System.IO.Compression.CompressionLevel]::Optimal)
      $entryStream = $entry.Open()
      try {
        $sourceStream = [System.IO.File]::Open($file.FullName, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite -bor [System.IO.FileShare]::Delete)
        try {
          $sourceStream.CopyTo($entryStream)
        } finally {
          $sourceStream.Dispose()
        }
      } finally {
        $entryStream.Dispose()
      }
      $entryCount++
    } catch {
      $skipped++
      if ($warnings.Count -lt 5) {
        $warnings.Add("Skipped $relative ($($_.Exception.Message))") | Out-Null
      }
    }
  }
} finally {
  $zip.Dispose()
}

$verification = "Failed"
try {
  $verifyZip = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
  try {
    $verifyCount = $verifyZip.Entries.Count
    if ($verifyCount -gt 0) {
      $verification = "Passed ($verifyCount entries readable)"
    }
  } finally {
    $verifyZip.Dispose()
  }
} catch {
  $verification = "Failed ($($_.Exception.Message))"
}

$backupItem = Get-Item -LiteralPath $archivePath
if ($backupItem.Length -gt $MaxTotalBytes) {
  Remove-Item -LiteralPath $archivePath -Force
  throw "Backup exceeded the 15 GB retention limit and was deleted: $backupName"
}

$pruned = Invoke-PruneBackups -Root $BackupRoot
$backups = @(Get-ChildItem -LiteralPath $BackupRoot -Filter "bof-backup-*.zip" -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending)
$totalBytes = [long](($backups | Measure-Object -Property Length -Sum).Sum)
$currentBackup = Get-Item -LiteralPath $archivePath -ErrorAction SilentlyContinue
$backupSize = if ($currentBackup) { Format-Bytes $currentBackup.Length } else { "Pruned" }
$excluded = "node_modules, .next, .vercel, .git, tsconfig.tsbuildinfo, *.log, .codex/reports/visual-smoke, coverage, playwright-report, test-results"
if ($ExcludeGeneratedArtifacts) {
  $excluded = "$excluded, public/generated, public/documents, public/proof, public/evidence, public/reference, public/actual_docs, lib/generated"
}

$warningText = if ($warnings.Count -or $skipped -gt 0) {
  "Skipped unreadable files: $skipped. " + ($warnings -join "; ")
} else {
  "None"
}
$prunedText = if ($pruned.Count) { $pruned -join ", " } else { "None" }

$report = @(
  "## Backup Report",
  "Action: Create backup",
  "Backup created: $archivePath",
  "Backup size: $backupSize",
  "Backup count: $($backups.Count) / $MaxBackups",
  "Total backup storage: $(Format-Bytes $totalBytes) / $(Format-Bytes $MaxTotalBytes)",
  "Old backups pruned: $prunedText",
  "Excluded folders: $excluded",
  "Verification: $verification",
  "Warnings: $warningText",
  "Next recommended action: Run scripts/bof-list-backups.ps1 to confirm retained restore points."
)

$reportText = $report -join [Environment]::NewLine
Set-Content -LiteralPath (Join-Path $BackupRoot "last-backup-report.md") -Value $reportText -Encoding UTF8
Write-Output $reportText
