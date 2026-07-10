param(
  [string]$ProjectRoot = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$drivers = @(
  @{ Id='DRV-001'; Name='John Carter'; State='OH'; License='OH-CDL-7816-2043'; Dob='03/14/1978'; Exp='11/30/2027'; Address='742 Lakebend Drive, Parma, OH 44129'; Photo='driver-ref-001.jpg' },
  @{ Id='DRV-002'; Name='Carlos Martinez'; State='IL'; License='IL-CDL-6042-5102'; Dob='08/22/1981'; Exp='10/31/2027'; Address='1180 W. Archer Avenue, Cicero, IL 60804'; Photo='driver-ref-002.jpg' },
  @{ Id='DRV-003'; Name='Mara Chen'; State='GA'; License='GA-CDL-3920-1103'; Dob='01/09/1986'; Exp='Review required'; Address='55 Peachtree Ridge Lane, Morrow, GA 30260'; Photo='driver-ref-003.jpg' },
  @{ Id='DRV-004'; Name='Daniel Kim'; State='IL'; License='IL-CDL-8824-4104'; Dob='04/18/1990'; Exp='09/30/2027'; Address='9068 S. Halsted Court, Chicago, IL 60620'; Photo='driver-ref-004.jpg' },
  @{ Id='DRV-005'; Name='Frank Miller'; State='CA'; License='CA-CDL-5448-3305'; Dob='02/27/1974'; Exp='12/31/2027'; Address='2046 Bayview Terrace, Oakland, CA 94607'; Photo='driver-ref-005.jpg' },
  @{ Id='DRV-006'; Name='Priya Patel'; State='CA'; License='CA-CDL-9162-7706'; Dob='11/05/1988'; Exp='Renewal due'; Address='3224 Arroyo Vista Road, Downey, CA 90241'; Photo='driver-ref-006.jpg' },
  @{ Id='DRV-007'; Name='Marcus Reed'; State='FL'; License='FL-CDL-4318-6607'; Dob='06/30/1979'; Exp='08/31/2027'; Address='8901 Coral Way, Doral, FL 33172'; Photo='driver-ref-007.jpg' },
  @{ Id='DRV-008'; Name='Liam Smith'; State='MA'; License='MA-CDL-7715-2208'; Dob='12/12/1982'; Exp='07/31/2027'; Address='71 Harbor Point Road, Quincy, MA 02169'; Photo='driver-ref-008.jpg' },
  @{ Id='DRV-009'; Name='Emma Brown'; State='PA'; License='PA-CDL-6721-9909'; Dob='09/16/1985'; Exp='06/30/2027'; Address='4612 Allegheny Avenue, Chester, PA 19013'; Photo='driver-ref-009.jpg' },
  @{ Id='DRV-010'; Name='Noah Wilson'; State='WA'; License='WA-CDL-3155-4810'; Dob='05/03/1980'; Exp='05/31/2027'; Address='1386 Cedar Flats Drive, Tacoma, WA 98402'; Photo='driver-ref-010.jpg' },
  @{ Id='DRV-011'; Name='Olivia Lee'; State='TX'; License='TX-CDL-8490-3511'; Dob='07/21/1987'; Exp='04/30/2027'; Address='6041 Trinity Mills Road, Irving, TX 75063'; Photo='driver-ref-011.jpg' },
  @{ Id='DRV-012'; Name='Amir Khan'; State='AZ'; License='AZ-CDL-2094-6812'; Dob='10/10/1984'; Exp='03/31/2028'; Address='2508 Camelback Mesa, Tempe, AZ 85281'; Photo='driver-ref-012.jpg' }
)

$outDir = Join-Path $ProjectRoot 'Website/assets/images/documents/drivers/licenses'
$photoDir = Join-Path $ProjectRoot 'Website/assets/images/profiles/drivers'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function New-Font($family, $size, $style = [System.Drawing.FontStyle]::Regular) {
  return New-Object System.Drawing.Font($family, $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

function Draw-Text($g, $text, $font, $brush, $x, $y, $w, $h, $format = $null) {
  $rect = New-Object System.Drawing.RectangleF($x, $y, $w, $h)
  if ($format) { $g.DrawString($text, $font, $brush, $rect, $format) } else { $g.DrawString($text, $font, $brush, $rect) }
}

$fmtNear = New-Object System.Drawing.StringFormat
$fmtNear.Alignment = [System.Drawing.StringAlignment]::Near
$fmtNear.LineAlignment = [System.Drawing.StringAlignment]::Near
$fmtCenter = New-Object System.Drawing.StringFormat
$fmtCenter.Alignment = [System.Drawing.StringAlignment]::Center
$fmtCenter.LineAlignment = [System.Drawing.StringAlignment]::Center

$fontTiny = New-Font 'Arial' 16
$fontSmall = New-Font 'Arial' 20
$fontSmallBold = New-Font 'Arial' 20 ([System.Drawing.FontStyle]::Bold)
$fontMid = New-Font 'Arial' 26 ([System.Drawing.FontStyle]::Bold)
$fontLarge = New-Font 'Arial' 36 ([System.Drawing.FontStyle]::Bold)
$fontSig = New-Font 'Georgia' 32 ([System.Drawing.FontStyle]::Italic)

foreach ($driver in $drivers) {
  $bmp = New-Object System.Drawing.Bitmap 1200, 760
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle 0,0,1200,760),
    [System.Drawing.Color]::FromArgb(242,247,255),
    [System.Drawing.Color]::FromArgb(211,226,248),
    35
  )
  $g.FillRectangle($bg, 0, 0, 1200, 760)
  $bg.Dispose()

  for ($x = -120; $x -lt 1320; $x += 42) {
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(42, 55, 112, 180), 1)
    $g.DrawLine($pen, $x, 760, $x + 420, 0)
    $pen.Dispose()
  }

  $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(30, 79, 142), 6)
  $g.DrawRectangle($borderPen, 18, 18, 1164, 724)
  $borderPen.Dispose()
  $innerPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(140, 255, 255, 255), 3)
  $g.DrawRectangle($innerPen, 38, 38, 1124, 684)
  $innerPen.Dispose()

  $blueBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(21, 62, 120))
  $inkBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(16, 24, 39))
  $mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(78, 94, 122))
  $whiteBrush = [System.Drawing.Brushes]::White
  $linePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(134, 161, 203), 2)

  $stateRect = New-Object System.Drawing.Rectangle 62,54,96,62
  $g.FillRectangle($blueBrush, $stateRect)
  Draw-Text $g $driver.State $fontLarge $whiteBrush 62 52 96 62 $fmtCenter
  Draw-Text $g 'COMMERCIAL DRIVER LICENSE' $fontLarge $inkBrush 182 48 610 58
  Draw-Text $g 'Driver qualification file credential record' $fontSmallBold $mutedBrush 184 102 620 30
  Draw-Text $g ('FILE ' + $driver.Id + '  |  CLASS A  |  DRY VAN') $fontSmallBold $blueBrush 835 58 280 78 $fmtNear
  $g.DrawLine($linePen, 62, 134, 1138, 134)

  $photoPath = Join-Path $photoDir $driver.Photo
  $photo = [System.Drawing.Image]::FromFile($photoPath)
  $g.FillRectangle([System.Drawing.Brushes]::White, 70, 166, 270, 330)
  $g.DrawImage($photo, (New-Object System.Drawing.Rectangle 82,178,246,306))
  $photo.Dispose()
  $g.DrawRectangle($linePen, 70, 166, 270, 330)
  Draw-Text $g 'PHOTO MATCH VERIFIED' $fontSmallBold $blueBrush 70 508 270 30 $fmtCenter

  $fields = @(
    @('NAME', $driver.Name, 370, 166, 340, 78),
    @('LICENSE NO.', $driver.License, 735, 166, 370, 78),
    @('DATE OF BIRTH', $driver.Dob, 370, 264, 260, 78),
    @('EXPIRATION', $driver.Exp, 660, 264, 260, 78),
    @('CLASS / ENDORSEMENTS', 'Class A CDL / General freight', 370, 362, 545, 78),
    @('ADDRESS', $driver.Address, 370, 460, 735, 96)
  )
  foreach ($field in $fields) {
    $rect = New-Object System.Drawing.Rectangle $field[2],$field[3],$field[4],$field[5]
    $fill = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(238, 244, 252))
    $g.FillRectangle($fill, $rect)
    $fill.Dispose()
    $g.DrawRectangle($linePen, $rect)
    Draw-Text $g $field[0] $fontTiny $mutedBrush ($field[2] + 12) ($field[3] + 8) ($field[4] - 24) 22
    Draw-Text $g $field[1] $fontMid $inkBrush ($field[2] + 12) ($field[3] + 34) ($field[4] - 24) ($field[5] - 36)
  }

  $g.DrawLine($linePen, 70, 590, 775, 590)
  Draw-Text $g 'DRIVER SIGNATURE' $fontSmallBold $mutedBrush 70 604 210 34
  Draw-Text $g $driver.Name $fontSig $inkBrush 285 596 430 50
  Draw-Text $g 'ISSUED 12/01/2023' $fontSmallBold $mutedBrush 805 604 250 34

  $g.FillRectangle([System.Drawing.Brushes]::Black, 820, 650, 285, 36)
  $barX = 824
  foreach ($w in @(16, 8, 24, 12, 18, 8, 28, 12, 10, 24, 8, 18, 30, 8, 14)) {
    $g.FillRectangle([System.Drawing.Brushes]::Black, $barX, 610, $w, 70)
    $barX += $w + 8
  }
  Draw-Text $g 'RESTRICTIONS REVIEW: NONE SHOWN FOR ACTIVE ASSIGNMENT' $fontSmallBold $blueBrush 70 674 660 50
  Draw-Text $g 'BOF READINESS PACKET' $fontSmallBold $mutedBrush 820 694 290 32 $fmtCenter

  $outPath = Join-Path $outDir ("license-" + $driver.Id.ToLower() + ".png")
  $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

Write-Host ("Generated {0} license artifact(s) in {1}" -f $drivers.Count, $outDir)
