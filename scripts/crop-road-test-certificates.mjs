import { spawnSync } from "node:child_process";

// NOTE: Currently not used because `Roadtestcert2.png` is a single-certificate page,
// not a 12-up (4x3) sheet. Kept for potential future multi-sheet assets.
const source = "public/source-assets/road-test/Roadtestcert2.png";

const psScript = `
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$source = "${source.replace(/\\/g, "\\\\")}"
if (-not (Test-Path $source)) {
  throw "Source image not found: $source"
}

$driverRows = @(
  @("DRV-001","DRV-002","DRV-003","DRV-004"),
  @("DRV-005","DRV-006","DRV-007","DRV-008"),
  @("DRV-009","DRV-010","DRV-011","DRV-012")
)

$bmp = New-Object System.Drawing.Bitmap($source)
try {
  $w = $bmp.Width
  $h = $bmp.Height

  if (($w % 4) -ne 0 -or ($h % 3) -ne 0) {
    throw "Source dimensions $w x $h are not evenly divisible into a 4x3 grid."
  }

  $cellW = [int]($w / 4)
  $cellH = [int]($h / 3)
  $outRows = @()

  for ($r = 0; $r -lt 3; $r++) {
    for ($c = 0; $c -lt 4; $c++) {
      $driverId = $driverRows[$r][$c]
      $x = $c * $cellW
      $y = $r * $cellH
      $rect = New-Object System.Drawing.Rectangle($x, $y, $cellW, $cellH)
      $crop = $bmp.Clone($rect, $bmp.PixelFormat)
      try {
        $outDir = Join-Path "public/generated/drivers" $driverId
        if (-not (Test-Path $outDir)) {
          New-Item -ItemType Directory -Path $outDir -Force | Out-Null
        }
        $outPath = Join-Path $outDir "road-test-certificate.png"
        $crop.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $outRows += [PSCustomObject]@{
          driverId = $driverId
          outputPath = $outPath
          width = $cellW
          height = $cellH
          x = $x
          y = $y
        }
      } finally {
        $crop.Dispose()
      }
    }
  }

  [PSCustomObject]@{
    sourcePath = $source
    sourceWidth = $w
    sourceHeight = $h
    columns = 4
    rows = 3
    cropWidth = $cellW
    cropHeight = $cellH
    outputs = $outRows
  } | ConvertTo-Json -Depth 5
} finally {
  $bmp.Dispose()
}
`;

const run = spawnSync("powershell", ["-NoProfile", "-Command", psScript], {
  encoding: "utf8",
});

if (run.status !== 0) {
  process.stderr.write(run.stderr || "crop script failed\n");
  process.exit(run.status ?? 1);
}

process.stdout.write(run.stdout);
