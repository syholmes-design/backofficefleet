param(
  [string]$WebsitePath = "Website",
  [string]$BackupRoot = ".codex\backups\website",
  [string]$Label = "",
  [int]$Keep = 20,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Convert-Bytes {
  param([long]$Bytes)
  if ($Bytes -ge 1GB) { return ("{0:N2} GB" -f ($Bytes / 1GB)) }
  if ($Bytes -ge 1MB) { return ("{0:N2} MB" -f ($Bytes / 1MB)) }
  if ($Bytes -ge 1KB) { return ("{0:N2} KB" -f ($Bytes / 1KB)) }
  return "$Bytes B"
}

function Resolve-ProjectPath {
  param([string]$PathValue)
  if ([System.IO.Path]::IsPathRooted($PathValue)) {
    return [System.IO.Path]::GetFullPath($PathValue)
  }
  return [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot $PathValue))
}

$ProjectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\..\..\.."))
$WebsiteFull = Resolve-ProjectPath $WebsitePath
$BackupFull = Resolve-ProjectPath $BackupRoot

if (-not (Test-Path -LiteralPath $WebsiteFull -PathType Container)) {
  throw "Website folder not found: $WebsiteFull"
}

$websiteWithSep = $WebsiteFull.TrimEnd("\", "/") + [System.IO.Path]::DirectorySeparatorChar
$backupWithSep = $BackupFull.TrimEnd("\", "/") + [System.IO.Path]::DirectorySeparatorChar
if ($backupWithSep.StartsWith($websiteWithSep, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Backup root must not be inside Website: $BackupFull"
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$safeLabel = ""
if ($Label.Trim()) {
  $safeLabel = "-" + (($Label.Trim() -replace "[^a-zA-Z0-9._-]+", "-").Trim("-"))
}

$zipName = "website-$timestamp$safeLabel.zip"
$manifestName = "website-$timestamp$safeLabel.manifest.json"
$zipPath = Join-Path $BackupFull $zipName
$manifestPath = Join-Path $BackupFull $manifestName

$files = Get-ChildItem -LiteralPath $WebsiteFull -Recurse -File -Force
$totalBytes = ($files | Measure-Object -Property Length -Sum).Sum
if ($null -eq $totalBytes) { $totalBytes = 0 }

$extensions = $files |
  Group-Object { if ($_.Extension) { $_.Extension.ToLowerInvariant() } else { "[none]" } } |
  Sort-Object Name |
  ForEach-Object {
    [ordered]@{
      extension = $_.Name
      count = $_.Count
      bytes = [long](($_.Group | Measure-Object -Property Length -Sum).Sum)
    }
  }

$gitStatus = $null
try {
  $gitOutput = & git -C $ProjectRoot status --short 2>$null
  if ($LASTEXITCODE -eq 0) {
    $gitStatus = @($gitOutput)
  }
} catch {
  $gitStatus = $null
}

if ($DryRun) {
  [ordered]@{
    dryRun = $true
    website = $WebsiteFull
    backup = $zipPath
    manifest = $manifestPath
    files = $files.Count
    bytes = [long]$totalBytes
    size = Convert-Bytes ([long]$totalBytes)
  } | ConvertTo-Json -Depth 5
  exit 0
}

New-Item -ItemType Directory -Force -Path $BackupFull | Out-Null

if (Test-Path -LiteralPath $zipPath) {
  throw "Backup already exists: $zipPath"
}

Compress-Archive -LiteralPath $WebsiteFull -DestinationPath $zipPath -CompressionLevel Optimal

$zipHash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash
$zipItem = Get-Item -LiteralPath $zipPath

$manifest = [ordered]@{
  createdAt = (Get-Date).ToString("o")
  projectRoot = $ProjectRoot
  website = $WebsiteFull
  backup = $zipPath
  label = $Label
  fileCount = $files.Count
  totalBytes = [long]$totalBytes
  totalSize = Convert-Bytes ([long]$totalBytes)
  zipBytes = [long]$zipItem.Length
  zipSize = Convert-Bytes ([long]$zipItem.Length)
  sha256 = $zipHash
  extensions = $extensions
  gitStatus = $gitStatus
}

$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

$pruned = @()
if ($Keep -gt 0) {
  $existing = Get-ChildItem -LiteralPath $BackupFull -Filter "website-*.zip" -File |
    Sort-Object LastWriteTime -Descending
  $toPrune = @($existing | Select-Object -Skip $Keep)
  foreach ($old in $toPrune) {
    $oldManifest = [System.IO.Path]::ChangeExtension($old.FullName, ".manifest.json")
    Remove-Item -LiteralPath $old.FullName -Force
    if (Test-Path -LiteralPath $oldManifest) {
      Remove-Item -LiteralPath $oldManifest -Force
    }
    $pruned += $old.FullName
  }
}

[ordered]@{
  backup = $zipPath
  manifest = $manifestPath
  files = $files.Count
  sourceBytes = [long]$totalBytes
  sourceSize = Convert-Bytes ([long]$totalBytes)
  zipBytes = [long]$zipItem.Length
  zipSize = Convert-Bytes ([long]$zipItem.Length)
  sha256 = $zipHash
  pruned = $pruned
} | ConvertTo-Json -Depth 5
