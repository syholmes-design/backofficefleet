[CmdletBinding()]
param(
    [string]$Target = ".codex",
    [int]$Top = 25
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path -LiteralPath $Target).Path

function Get-FileCountAndSize {
    param([string]$Path)

    $files = Get-ChildItem -LiteralPath $Path -Recurse -Force -File -ErrorAction SilentlyContinue
    $measure = $files | Measure-Object -Property Length -Sum
    [pscustomobject]@{
        Files = ($files | Measure-Object).Count
        Bytes = [int64]($measure.Sum)
    }
}

function Format-MB {
    param([int64]$Bytes)
    "{0:N2}" -f ($Bytes / 1MB)
}

function Format-RelativePath {
    param([string]$Path)

    if ($Path.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
        $relative = $Path.Substring($root.Length).TrimStart("\", "/")
        if ([string]::IsNullOrWhiteSpace($relative)) {
            return "."
        }
        return Join-Path ".codex" $relative
    }

    return $Path
}

$summary = Get-FileCountAndSize -Path $root

Write-Host "Project filesize audit"
Write-Host "Target: $root"
Write-Host "Total: $(Format-MB $summary.Bytes) MB across $($summary.Files) files"
Write-Host ""

Write-Host "Top-level directories:"
Get-ChildItem -LiteralPath $root -Directory -Force |
    ForEach-Object {
        $size = Get-FileCountAndSize -Path $_.FullName
        [pscustomobject]@{
            MB = Format-MB $size.Bytes
            Files = $size.Files
            Path = Format-RelativePath $_.FullName
        }
    } |
    Sort-Object {[decimal]$_.MB} -Descending |
    Select-Object -First $Top |
    ForEach-Object {
        Write-Host ("{0,10} MB  {1,6} files  {2}" -f $_.MB, $_.Files, $_.Path)
    }

Write-Host ""
Write-Host "Largest files:"
Get-ChildItem -LiteralPath $root -Recurse -Force -File -ErrorAction SilentlyContinue |
    Sort-Object Length -Descending |
    Select-Object -First $Top |
    ForEach-Object {
        Write-Host ("{0,10} MB  {1:yyyy-MM-dd HH:mm}  {2}" -f (Format-MB $_.Length), $_.LastWriteTime, (Format-RelativePath $_.FullName))
    }

Write-Host ""
Write-Host "Likely cleanup areas to review first:"
$cleanupNames = @("tmp", "tmp-screenshots", "snapshots", "reports", "exports")
foreach ($name in $cleanupNames) {
    $candidate = Join-Path $root $name
    if (Test-Path -LiteralPath $candidate) {
        $size = Get-FileCountAndSize -Path $candidate
        Write-Host ("- {0}: {1} MB across {2} files" -f (Format-RelativePath $candidate), (Format-MB $size.Bytes), $size.Files)
    }
}
