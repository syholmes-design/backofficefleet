param(
  [string]$CheckpointRoot,
  [Int64]$MaxTotalBytes = 15GB,
  [switch]$ExcludeGeneratedArtifacts
)

$ErrorActionPreference = "Stop"

function Format-Bytes {
  param([long]$Bytes)
  if ($Bytes -ge 1GB) { return ("{0:N2} GB" -f ($Bytes / 1GB)) }
  if ($Bytes -ge 1MB) { return ("{0:N2} MB" -f ($Bytes / 1MB)) }
  if ($Bytes -ge 1KB) { return ("{0:N2} KB" -f ($Bytes / 1KB)) }
  return "$Bytes B"
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

function Invoke-PruneSharedCheckpoints {
  param(
    [string]$Root,
    [Int64]$StorageLimit
  )
  $pruned = New-Object System.Collections.Generic.List[string]

  while ($true) {
    $checkpoints = @(Get-ChildItem -LiteralPath $Root -Filter "bof-shared-checkpoint-*.zip" -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime)
    $total = [long](($checkpoints | Measure-Object -Property Length -Sum).Sum)
    if ($total -le $StorageLimit) { break }
    if ($checkpoints.Count -eq 0) { break }
    $oldest = $checkpoints[0]
    $pruned.Add($oldest.Name) | Out-Null
    Remove-Item -LiteralPath $oldest.FullName -Force
  }

  return $pruned
}

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not $CheckpointRoot) {
  $CheckpointRoot = Get-DefaultCheckpointRoot
}
$CheckpointRoot = [System.IO.Path]::GetFullPath($CheckpointRoot)

if ($CheckpointRoot.TrimEnd('\', '/').StartsWith($ProjectRoot.TrimEnd('\', '/'), [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "CheckpointRoot must be outside the project root. Requested: $CheckpointRoot"
}

if (-not (Test-Path -LiteralPath $CheckpointRoot)) {
  New-Item -ItemType Directory -Path $CheckpointRoot -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$checkpointName = "bof-shared-checkpoint-$timestamp.zip"
$archivePath = Join-Path $CheckpointRoot $checkpointName
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

$checkpointItem = Get-Item -LiteralPath $archivePath
if ($checkpointItem.Length -gt $MaxTotalBytes) {
  Remove-Item -LiteralPath $archivePath -Force
  throw "Checkpoint exceeded the shared rollback storage limit and was deleted: $checkpointName"
}

$pruned = Invoke-PruneSharedCheckpoints -Root $CheckpointRoot -StorageLimit $MaxTotalBytes
$checkpoints = @(Get-ChildItem -LiteralPath $CheckpointRoot -Filter "bof-shared-checkpoint-*.zip" -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending)
$totalBytes = [long](($checkpoints | Measure-Object -Property Length -Sum).Sum)
$currentCheckpoint = Get-Item -LiteralPath $archivePath -ErrorAction SilentlyContinue
$checkpointSize = if ($currentCheckpoint) { Format-Bytes $currentCheckpoint.Length } else { "Pruned" }
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
  "## Shared Rollback Checkpoint Report",
  "Action: Create shared rollback checkpoint",
  "Checkpoint created: $archivePath",
  "Checkpoint size: $checkpointSize",
  "Total shared rollback storage: $(Format-Bytes $totalBytes) / $(Format-Bytes $MaxTotalBytes)",
  "Retention count limit: None",
  "Old checkpoints pruned by size: $prunedText",
  "Excluded folders: $excluded",
  "Verification: $verification",
  "Warnings: $warningText",
  "Next recommended action: Run scripts/bof-list-shared-checkpoints.ps1 to confirm available shared rollback checkpoints."
)

$reportText = $report -join [Environment]::NewLine
Set-Content -LiteralPath (Join-Path $CheckpointRoot "last-shared-checkpoint-report.md") -Value $reportText -Encoding UTF8
Write-Output $reportText
