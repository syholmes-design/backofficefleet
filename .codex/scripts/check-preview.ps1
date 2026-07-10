param(
  [Parameter(Mandatory = $true)]
  [string]$Url
)

$ErrorActionPreference = "Stop"

try {
  $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3

  if ($response.StatusCode -ne 200) {
    exit 2
  }

  if ($response.Content -notmatch "BackOfficeFleet" -and $response.Content -notmatch "Back Office Fleet" -and $response.Content -notmatch "BOF") {
    exit 2
  }

  $stylesheetMatch = [regex]::Match($response.Content, '<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"')
  if ($stylesheetMatch.Success) {
    $href = $stylesheetMatch.Groups[1].Value.Replace("&amp;", "&")
    if ($href.StartsWith("/")) {
      $cssUrl = "$Url$href"
    } elseif ($href -match "^https?://") {
      $cssUrl = $href
    } else {
      $base = $Url.TrimEnd("/")
      $cssUrl = "$base/$href"
    }

    $css = Invoke-WebRequest -Uri $cssUrl -UseBasicParsing -TimeoutSec 3
    if ($css.StatusCode -ne 200) {
      exit 2
    }
  }

  exit 0
} catch {
  exit 1
}
