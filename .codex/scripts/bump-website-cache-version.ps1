param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[A-Za-z0-9._-]+$')]
  [string]$Version,

  [switch]$IncludeScripts
)

$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$website = Join-Path $root 'Website'

if (-not (Test-Path $website)) {
  throw "Website folder not found at $website"
}

$assetPatterns = @(
  @{
    Pattern = '(/assets/css/styles\.css)(\?v=[^"''<> ]*)?'
    Replace = "`$1?v=$Version"
  }
)

if ($IncludeScripts) {
  $assetPatterns += @(
    @{
      Pattern = '(/assets/js/site\.js)(\?v=[^"''<> ]*)?'
      Replace = "`$1?v=$Version"
    },
    @{
      Pattern = '(/assets/js/interactive-demo-routes\.js)(\?v=[^"''<> ]*)?'
      Replace = "`$1?v=$Version"
    },
    @{
      Pattern = '(/assets/js/ascendtms\.js)(\?v=[^"''<> ]*)?'
      Replace = "`$1?v=$Version"
    }
  )
}

$changed = 0
$scanned = 0

Get-ChildItem -Path $website -Recurse -Filter '*.html' | ForEach-Object {
  $scanned += 1
  $path = $_.FullName
  $original = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
  $updated = $original

  foreach ($asset in $assetPatterns) {
    $updated = [regex]::Replace($updated, $asset.Pattern, $asset.Replace)
  }

  if ($updated -ne $original) {
    $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($path, $updated, $utf8NoBom)
    $changed += 1
  }
}

Write-Host "Scanned $scanned HTML files."
Write-Host "Updated $changed HTML files to asset version $Version."
if (-not $IncludeScripts) {
  Write-Host "CSS only. Add -IncludeScripts when shared JavaScript also changed."
}
