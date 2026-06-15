param(
  [string]$Path = ".codex\checklists\active"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $Path)) {
  throw "Checklist path not found: $Path"
}

$files = Get-ChildItem -LiteralPath $Path -Filter "*.md" -File -ErrorAction SilentlyContinue
if (-not $files) {
  Write-Output "No active checklist files found."
  exit 0
}

foreach ($file in $files) {
  $text = Get-Content -LiteralPath $file.FullName -Raw
  $statuses = [ordered]@{
    pending = ([regex]::Matches($text, '\|\s*pending\s*\|')).Count
    in_progress = ([regex]::Matches($text, '\|\s*in_progress\s*\|')).Count
    complete = ([regex]::Matches($text, '\|\s*complete\s*\|')).Count
    blocked = ([regex]::Matches($text, '\|\s*blocked\s*\|')).Count
    deferred = ([regex]::Matches($text, '\|\s*deferred\s*\|')).Count
    not_applicable = ([regex]::Matches($text, '\|\s*not_applicable\s*\|')).Count
  }
  [pscustomobject]@{
    File = $file.FullName
    Pending = $statuses.pending
    InProgress = $statuses.in_progress
    Complete = $statuses.complete
    Blocked = $statuses.blocked
    Deferred = $statuses.deferred
    NotApplicable = $statuses.not_applicable
  }
}
