param(
  [Parameter(Mandatory=$true)]
  [string]$Title,

  [Parameter(Mandatory=$true)]
  [string]$Source,

  [ValidateSet("plan","document")]
  [string]$Type = "plan",

  [string]$Label
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$templateName = if ($Type -eq "document") { "document-processing-checklist.md" } else { "plan-implementation-checklist.md" }
$templatePath = Join-Path $root "checklists\templates\$templateName"
if (-not (Test-Path -LiteralPath $templatePath)) {
  throw "Missing checklist template: $templatePath"
}

$safeLabel = if ($Label) { $Label } else { $Title }
$safeLabel = ($safeLabel.ToLowerInvariant() -replace '[^a-z0-9]+','-').Trim('-')
if (-not $safeLabel) { throw "Could not derive a safe checklist filename." }

$date = Get-Date -Format "yyyy-MM-dd"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outDir = Join-Path $root "checklists\active"
if (-not (Test-Path -LiteralPath $outDir)) {
  New-Item -ItemType Directory -Path $outDir | Out-Null
}

$outPath = Join-Path $outDir "$stamp-$safeLabel.md"
$content = Get-Content -LiteralPath $templatePath -Raw
$content = $content.Replace("{{TITLE}}", $Title)
$content = $content.Replace("{{DATE}}", $date)
$content = $content.Replace("{{SOURCE}}", $Source)
$content = $content.Replace("{{SCOPE_SUMMARY}}", "TBD")
$content = $content.Replace("{{FIRST_REQUIREMENT}}", "TBD")

Set-Content -LiteralPath $outPath -Value $content -NoNewline
Write-Output (Resolve-Path -LiteralPath $outPath).Path
