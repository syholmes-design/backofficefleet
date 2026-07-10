param(
    [string]$OutputRoot
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$referenceRoot = Join-Path $repoRoot "bof-web-Original\bof-web"
$manifestPath = Join-Path $referenceRoot "lib\generated\driver-doc-manifest.json"
$publicIndexPath = Join-Path $referenceRoot "lib\generated\driver-public-doc-index.json"

if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
    $OutputRoot = Join-Path $repoRoot ".codex\references\reference-driver-document-assets"
}

if (-not (Test-Path -LiteralPath $manifestPath)) {
    throw "Reference driver manifest not found: $manifestPath"
}

New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$driverProps = @($manifest.PSObject.Properties)
$publicIndex = $null
if (Test-Path -LiteralPath $publicIndexPath) {
    $publicIndex = Get-Content -LiteralPath $publicIndexPath -Raw | ConvertFrom-Json
}

$candidateRoots = @(
    (Join-Path $referenceRoot "public"),
    (Join-Path $referenceRoot ".next\server\app"),
    (Join-Path $referenceRoot ".next\static"),
    (Join-Path $referenceRoot "generated"),
    (Join-Path $referenceRoot "documents"),
    (Join-Path $referenceRoot "data")
) | Where-Object { Test-Path -LiteralPath $_ }

$allCandidateFiles = @()
foreach ($root in $candidateRoots) {
    $allCandidateFiles += Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object {
            $_.FullName -notmatch '\\node_modules\\' -and
            $_.FullName -notmatch '\\.git\\' -and
            $_.Extension -match '^\.(png|jpg|jpeg|webp|pdf|html)$'
        }
}

$inventory = New-Object System.Collections.Generic.List[object]
$missing = New-Object System.Collections.Generic.List[object]
$copiedCount = 0

foreach ($driverProp in $driverProps) {
    $driverId = $driverProp.Name
    $driverOut = Join-Path $OutputRoot $driverId
    New-Item -ItemType Directory -Force -Path $driverOut | Out-Null

    foreach ($docProp in $driverProp.Value.PSObject.Properties) {
        $docType = $docProp.Name
        $manifestUrl = [string]$docProp.Value
        $fileName = Split-Path $manifestUrl -Leaf
        $found = $allCandidateFiles | Where-Object {
            $_.Name -ieq $fileName -and $_.FullName -match [regex]::Escape($driverId)
        } | Select-Object -First 1

        $copiedPath = $null
        if ($found) {
            $targetName = ($docType -replace '[^A-Za-z0-9_-]', '-') + "-" + $found.Name
            $target = Join-Path $driverOut $targetName
            Copy-Item -LiteralPath $found.FullName -Destination $target -Force
            $copiedPath = $target
            $copiedCount++
        } else {
            $missing.Add([pscustomobject]@{
                driver = $driverId
                documentType = $docType
                manifestPath = $manifestUrl
                expectedFileName = $fileName
            })
        }

        $inventory.Add([pscustomobject]@{
            driver = $driverId
            documentType = $docType
            manifestPath = $manifestUrl
            expectedFileName = $fileName
            found = [bool]$found
            sourcePath = if ($found) { $found.FullName } else { $null }
            copiedFallbackPath = $copiedPath
            privacyRisk = if ($docType -match 'cdl|medical|mvr|w9|i9|bank|emergency|insurance') { "review before public use; keep masked" } else { "review before public use" }
        })
    }
}

$inventoryPath = Join-Path $OutputRoot "reference-driver-document-asset-inventory.json"
$missingPath = Join-Path $OutputRoot "missing-reference-driver-document-assets.json"
$summaryPath = Join-Path $OutputRoot "README.md"

$inventory | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $inventoryPath -Encoding UTF8
$missing | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $missingPath -Encoding UTF8

$publicIndexCount = if ($publicIndex -and $publicIndex.files) { $publicIndex.files.Count } else { 0 }
$summary = @(
    "# Reference Driver Document Asset Fallback",
    "",
    "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')",
    "",
    "This is a non-deployable fallback library for BOF demo driver documentation. Assets copied here are not wired into `Website`.",
    "",
    "- Manifest: $manifestPath",
    "- Public index entries: $publicIndexCount",
    "- Inventory rows: $($inventory.Count)",
    "- Copied files: $copiedCount",
    "- Missing files: $($missing.Count)",
    "",
    "Use these files only after privacy/masking review. Do not expose raw license, medical, tax, bank, emergency-contact, policy, or insurance values in buyer-facing UI.",
    "",
    "Reports:",
    "",
    "- reference-driver-document-asset-inventory.json",
    "- missing-reference-driver-document-assets.json"
)
$summary | Set-Content -LiteralPath $summaryPath -Encoding UTF8

[pscustomobject]@{
    OutputRoot = $OutputRoot
    Inventory = $inventoryPath
    Missing = $missingPath
    Summary = $summaryPath
    Drivers = $driverProps.Count
    InventoryRows = $inventory.Count
    CopiedFiles = $copiedCount
    MissingFiles = $missing.Count
} | Format-List
