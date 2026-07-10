param(
  [string]$WebsiteRoot = "Website"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path -LiteralPath $WebsiteRoot
$allowed = @(
  [IO.Path]::GetFullPath((Join-Path $root "founding-fleet")),
  [IO.Path]::GetFullPath((Join-Path $root "founding-fleets"))
)

$patterns = @(
  "Founding Fleet",
  "Founding Fleets",
  "founding-fleet",
  "founding-fleets",
  "first 10",
  "20% off",
  "2-week trial",
  "two-week trial",
  "priority onboarding",
  "roadmap influence",
  "workflow influence"
)

$violations = @()

Get-ChildItem -LiteralPath $root -Recurse -Filter *.html | ForEach-Object {
  $file = $_
  $full = [IO.Path]::GetFullPath($file.FullName)
  $relative = $full.Substring($root.Path.Length).TrimStart('\', '/')
  $isAllowed = $false
  foreach ($path in $allowed) {
    if ($full.StartsWith($path, [StringComparison]::OrdinalIgnoreCase)) {
      $isAllowed = $true
      break
    }
  }
  if ($isAllowed) { return }

  $lines = Get-Content -LiteralPath $file.FullName
  for ($i = 0; $i -lt $lines.Count; $i++) {
    foreach ($pattern in $patterns) {
      if ($lines[$i].IndexOf($pattern, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
        if ($relative -eq "index.html" -and $lines[$i].IndexOf('<a href="/founding-fleets/">Founding Fleets</a>', [StringComparison]::OrdinalIgnoreCase) -ge 0) {
          continue
        }
        $violations += [pscustomobject]@{
          Path = $file.FullName
          LineNumber = $i + 1
          Pattern = $pattern
          Line = $lines[$i].Trim()
        }
      }
    }
  }
}

if ($violations.Count -gt 0) {
  Write-Output "Founding Fleet boundary audit failed. These terms/routes belong inside Website/founding-fleet/ or Website/founding-fleets/ unless the user explicitly reopens global placement:"
  $violations | Format-Table -AutoSize
  exit 1
}

Write-Output "Founding Fleet boundary audit passed. No Founding Fleet terms or route links were found outside the dedicated funnel."
