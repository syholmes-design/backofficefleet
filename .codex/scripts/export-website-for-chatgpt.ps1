param(
    [string]$Source = "",
    [double]$MaxFileMB = 3,
    [switch]$NoZip
)

$ErrorActionPreference = "Stop"

function Format-FileSize {
    param([Int64]$Bytes)

    if ($Bytes -ge 1GB) {
        return "{0:N2} GB" -f ($Bytes / 1GB)
    }
    if ($Bytes -ge 1MB) {
        return "{0:N2} MB" -f ($Bytes / 1MB)
    }
    if ($Bytes -ge 1KB) {
        return "{0:N2} KB" -f ($Bytes / 1KB)
    }
    return "$Bytes B"
}

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptRoot "..\..")).Path

if ([string]::IsNullOrWhiteSpace($Source)) {
    $Source = Join-Path $repoRoot "Website"
}

$sourcePath = (Resolve-Path $Source).Path
$sourceName = Split-Path -Leaf $sourcePath
$exportRoot = Join-Path $repoRoot ".codex\exports\chatgpt-website"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$exportDir = Join-Path $exportRoot "$sourceName-chatgpt-$stamp"
$zipPath = Join-Path $exportRoot "$sourceName-chatgpt-$stamp.zip"

$excludedExtensions = @(
    ".pdf", ".zip", ".7z", ".rar",
    ".mp4", ".mov", ".avi", ".mkv", ".webm",
    ".mp3", ".wav",
    ".psd", ".ai",
    ".odt", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx",
    ".tmp", ".log"
)

$maxBytes = [Int64]($MaxFileMB * 1MB)
$sourceRoot = $sourcePath.TrimEnd("\")

New-Item -ItemType Directory -Force -Path $exportDir | Out-Null

$copied = New-Object System.Collections.Generic.List[object]
$skipped = New-Object System.Collections.Generic.List[object]

Get-ChildItem -LiteralPath $sourcePath -Recurse -File -Force | ForEach-Object {
    $file = $_
    $relativePath = $file.FullName.Substring($sourceRoot.Length).TrimStart("\")
    $extension = $file.Extension.ToLowerInvariant()
    $skipReason = $null

    if ($excludedExtensions -contains $extension) {
        $skipReason = "excluded extension $extension"
    }
    elseif ($file.Length -gt $maxBytes) {
        $skipReason = "larger than $MaxFileMB MB"
    }

    if ($skipReason) {
        $skipped.Add([pscustomobject]@{
            Path = $relativePath
            Size = $file.Length
            Reason = $skipReason
        }) | Out-Null
        return
    }

    $destination = Join-Path $exportDir $relativePath
    $destinationFolder = Split-Path -Parent $destination
    New-Item -ItemType Directory -Force -Path $destinationFolder | Out-Null
    Copy-Item -LiteralPath $file.FullName -Destination $destination -Force

    $copied.Add([pscustomobject]@{
        Path = $relativePath
        Size = $file.Length
    }) | Out-Null
}

$copiedBytes = ($copied | Measure-Object -Property Size -Sum).Sum
$skippedBytes = ($skipped | Measure-Object -Property Size -Sum).Sum
if (-not $copiedBytes) { $copiedBytes = 0 }
if (-not $skippedBytes) { $skippedBytes = 0 }

$manifestPath = Join-Path $exportDir "EXPORT-MANIFEST.txt"
$manifestLines = @(
    "ChatGPT Website Export",
    "Created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")",
    "Source: $sourcePath",
    "Output folder: $exportDir",
    "Zip file: $zipPath",
    "Maximum copied file size: $MaxFileMB MB",
    "Excluded extensions: $($excludedExtensions -join ', ')",
    "",
    "Copied files: $($copied.Count)",
    "Copied size: $(Format-FileSize -Bytes ([Int64]$copiedBytes))",
    "Skipped files: $($skipped.Count)",
    "Skipped size: $(Format-FileSize -Bytes ([Int64]$skippedBytes))",
    "",
    "Skipped files:"
)

if ($skipped.Count -eq 0) {
    $manifestLines += "None"
}
else {
    $skipped |
        Sort-Object -Property Size -Descending |
        ForEach-Object {
            $manifestLines += "- $($_.Path) [$($_.Reason), $(Format-FileSize -Bytes $_.Size)]"
        }
}

$manifestLines | Set-Content -LiteralPath $manifestPath -Encoding UTF8

if (-not $NoZip) {
    if (Test-Path -LiteralPath $zipPath) {
        Remove-Item -LiteralPath $zipPath -Force
    }
    Compress-Archive -Path (Join-Path $exportDir "*") -DestinationPath $zipPath -Force
}

Write-Host ""
Write-Host "ChatGPT website export complete."
Write-Host "Folder: $exportDir"
if (-not $NoZip) {
    Write-Host "Zip:    $zipPath"
}
Write-Host "Copied: $($copied.Count) files ($(Format-FileSize -Bytes ([Int64]$copiedBytes)))"
Write-Host "Skipped: $($skipped.Count) bulky files ($(Format-FileSize -Bytes ([Int64]$skippedBytes)))"
Write-Host "Manifest: $manifestPath"
Write-Host ""
