param(
    [Parameter(Mandatory = $true)]
    [string]$Title,

    [Parameter(Mandatory = $true)]
    [string]$Source,

    [string]$ScopeSummary = "Convert the source into atomic checklist items and process them one at a time.",

    [ValidateSet("plan", "document")]
    [string]$Type = "plan",

    [string]$Label
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..\..\..")).Path
$templateName = if ($Type -eq "document") { "document-processing-checklist.md" } else { "plan-implementation-checklist.md" }
$templatePath = Join-Path $repoRoot ".codex\checklists\templates\$templateName"
$activeDir = Join-Path $repoRoot ".codex\checklists\active"

if (-not (Test-Path -LiteralPath $templatePath)) {
    throw "Checklist template not found: $templatePath"
}

New-Item -ItemType Directory -Force -Path $activeDir | Out-Null

if ([string]::IsNullOrWhiteSpace($Label)) {
    $Label = $Title
}

$safeLabel = ($Label.ToLowerInvariant() -replace '[^a-z0-9]+', '-' -replace '(^-|-$)', '')
if ([string]::IsNullOrWhiteSpace($safeLabel)) {
    $safeLabel = "checklist"
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outPath = Join-Path $activeDir "$stamp-$safeLabel.md"
$content = Get-Content -LiteralPath $templatePath -Raw
$content = $content.Replace("{{TITLE}}", $Title)
$content = $content.Replace("{{DATE}}", (Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"))
$content = $content.Replace("{{SOURCE}}", $Source)
$content = $content.Replace("{{SCOPE_SUMMARY}}", $ScopeSummary)
$content = $content.Replace("{{FIRST_REQUIREMENT}}", "Extract first atomic requirement from source before implementation.")

Set-Content -LiteralPath $outPath -Value $content -Encoding UTF8

[pscustomobject]@{
    Path = $outPath
    Type = $Type
    Title = $Title
    Source = $Source
} | Format-List
