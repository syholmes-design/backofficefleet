param(
  [string]$BackupRoot = ".codex\backups\website",
  [int]$Limit = 20
)

$ErrorActionPreference = "Stop"

function Convert-Bytes {
  param([long]$Bytes)
  if ($Bytes -ge 1GB) { return ("{0:N2} GB" -f ($Bytes / 1GB)) }
  if ($Bytes -ge 1MB) { return ("{0:N2} MB" -f ($Bytes / 1MB)) }
  if ($Bytes -ge 1KB) { return ("{0:N2} KB" -f ($Bytes / 1KB)) }
  return "$Bytes B"
}

$ProjectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\..\..\.."))
if ([System.IO.Path]::IsPathRooted($BackupRoot)) {
  $BackupFull = [System.IO.Path]::GetFullPath($BackupRoot)
} else {
  $BackupFull = [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot $BackupRoot))
}

if (-not (Test-Path -LiteralPath $BackupFull -PathType Container)) {
  [ordered]@{
    backupRoot = $BackupFull
    count = 0
    backups = @()
  } | ConvertTo-Json -Depth 5
  exit 0
}

$items = Get-ChildItem -LiteralPath $BackupFull -Filter "website-*.zip" -File |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First $Limit |
  ForEach-Object {
    $manifestPath = [System.IO.Path]::ChangeExtension($_.FullName, ".manifest.json")
    $manifest = $null
    if (Test-Path -LiteralPath $manifestPath) {
      try {
        $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
      } catch {
        $manifest = $null
      }
    }
    [ordered]@{
      file = $_.FullName
      manifest = if (Test-Path -LiteralPath $manifestPath) { $manifestPath } else { $null }
      created = $_.LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
      zipSize = Convert-Bytes ([long]$_.Length)
      files = if ($manifest) { $manifest.fileCount } else { $null }
      sourceSize = if ($manifest) { $manifest.totalSize } else { $null }
      sha256 = if ($manifest) { $manifest.sha256 } else { $null }
      label = if ($manifest) { $manifest.label } else { $null }
    }
  }

[ordered]@{
  backupRoot = $BackupFull
  count = @($items).Count
  backups = @($items)
} | ConvertTo-Json -Depth 5
