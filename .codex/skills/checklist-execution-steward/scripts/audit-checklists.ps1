param(
    [string]$Path
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..\..")).Path
$activeDir = Join-Path $repoRoot ".codex\checklists\active"

if ([string]::IsNullOrWhiteSpace($Path)) {
    $files = Get-ChildItem -LiteralPath $activeDir -Filter "*.md" -File -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending
} else {
    $resolvedPath = (Resolve-Path -LiteralPath $Path).Path
    $files = @(Get-Item -LiteralPath $resolvedPath)
}

if (-not $files -or $files.Count -eq 0) {
    Write-Output "No active checklist markdown files found in $activeDir"
    return
}

$statuses = @("pending", "in_progress", "complete", "blocked", "deferred", "not_applicable")

foreach ($file in $files) {
    $text = Get-Content -LiteralPath $file.FullName -Raw
    $counts = [ordered]@{}
    foreach ($status in $statuses) {
        $matches = [regex]::Matches($text, "\|\s*$([regex]::Escape($status))\s*\|")
        $counts[$status] = $matches.Count
    }

    [pscustomobject]@{
        Checklist = $file.FullName
        Pending = $counts["pending"]
        InProgress = $counts["in_progress"]
        Complete = $counts["complete"]
        Blocked = $counts["blocked"]
        Deferred = $counts["deferred"]
        NotApplicable = $counts["not_applicable"]
        LastWriteTime = $file.LastWriteTime
    } | Format-List
}
