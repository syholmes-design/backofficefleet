# One-off crop helper: document support1.png -> public/evidence/support/document-support/*.png
# Layout: 8 rows (A:3, B:4, C:4, D:3, E:5, F:4, extras:9, extras:9) = 41 thumbnails.
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
$srcPath = "C:\Users\syhol\Downloads\document support1.png"
$destRoot = Join-Path $PSScriptRoot "..\public\evidence\support\document-support"
if (-not (Test-Path $destRoot)) { New-Item -ItemType Directory -Path $destRoot -Force | Out-Null }

$src = [System.Drawing.Image]::FromFile($srcPath)
try {
  $W = $src.Width
  $H = $src.Height
  $padX = 8
  $y = 48

  $rows = @(
    @{ n = 3; h = 132; files = @(
        "rate-confirmation-preview.png",
        "bol-preview.png",
        "dispatch-instructions-note.png"
      ) },
    @{ n = 4; h = 132; files = @(
        "pre-trip-cargo-photo.png",
        "seal-verification-photo.png",
        "pod-stack-readiness-photo.png",
        "trailer-condition-photo.png"
      ) },
    @{ n = 4; h = 132; files = @(
        "maintenance-report-preview.png",
        "tire-check-photo.png",
        "fuel-check-photo.png",
        "dot-inspection-sticker-photo.png"
      ) },
    @{ n = 3; h = 128; files = @(
        "weather-along-lane-preview.png",
        "traffic-eta-risk-preview.png",
        "route-map-preview.png"
      ) },
    @{ n = 5; h = 138; files = @(
        "hos-compliance-preview.png",
        "camera-status-photo.png",
        "cdl-preview.png",
        "medical-card-preview.png",
        "mvr-preview.png"
      ) },
    @{ n = 4; h = 132; files = @(
        "lumper-receipt-preview.png",
        "invoice-paid-preview.png",
        "rf-actions-device-photo.png",
        "settlement-statement-preview.png"
      ) },
    @{ n = 9; h = 128; files = @(
        "scale-ticket-preview.png",
        "loading-dock-photo.png",
        "pallet-count-photo.png",
        "seal-close-up-photo.png",
        "delivery-pod-photo.png",
        "accessorial-receipt-preview.png",
        "fuel-receipt-preview.png",
        "toll-receipt-preview.png",
        "lumper-invoice-preview.png"
      ) },
    @{ n = 9; h = 128; files = @(
        "trailer-door-photo.png",
        "temp-log-preview.png",
        "hazmat-cert-preview.png",
        "driver-signature-preview.png",
        "border-crossing-preview.png",
        "insurance-certificate-preview.png",
        "drug-test-result-preview.png",
        "pre-trip-dvir-preview.png",
        "post-trip-dvir-preview.png"
      ) }
  )

  function Save-Crop([int]$sx, [int]$sy, [int]$sw, [int]$sh, [string]$outName) {
    if ($sw -lt 8 -or $sh -lt 8) { throw "bad rect $outName" }
    $bmp = New-Object System.Drawing.Bitmap($sw, $sh)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $srcRect = New-Object System.Drawing.Rectangle $sx, $sy, $sw, $sh
    $dstRect = New-Object System.Drawing.Rectangle 0, 0, $sw, $sh
    $g.DrawImage($src, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $outPath = Join-Path $destRoot $outName
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
  }

  $log = @()
  foreach ($row in $rows) {
    $cellW = [int][Math]::Floor($W / $row.n)
    for ($i = 0; $i -lt $row.n; $i++) {
      $sx = $i * $cellW + $padX
      $sw = $cellW - 2 * $padX
      $sy = $y + [int]($row.h * 0.07)
      $sh = [int]($row.h * 0.70)
      $name = $row.files[$i]
      Save-Crop $sx $sy $sw $sh $name
      $log += "${name}: ($sx,$sy) ${sw}x${sh}"
    }
    $y += $row.h
  }

  Write-Output "Source ${W}x${H}"
  $log | ForEach-Object { Write-Output $_ }
}
finally {
  $src.Dispose()
}
