param(
  [string]$ProjectRoot,
  [int[]]$PreviewPorts = @(3000,3001,3002,3003,3004,3005,3006,3007,3008,3009,3010),
  [switch]$Json
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'runtime-resource-lib.ps1')

$report = @(Get-BofRuntimeResourceReport -ProjectRoot $ProjectRoot -PreviewPorts $PreviewPorts |
  Sort-Object Candidate, WorkingSetMB -Descending)

if ($Json) {
  $report | ConvertTo-Json -Depth 4
  exit
}

$candidates = @($report | Where-Object { $_.Candidate })
$otherPorts = @($report | Where-Object { -not $_.Candidate -and $_.Ports })

Write-Host "Runtime Resource Audit"
Write-Host ("Project: {0}" -f (Get-ProjectRoot -ProjectRoot $ProjectRoot))
Write-Host ("Candidate leftovers: {0}" -f $candidates.Count)
Write-Host ''

if ($candidates.Count -gt 0) {
  $candidates |
    Select-Object ProcessId,Name,Reason,Ports,WorkingSetMB,CommandLine |
    Format-Table -AutoSize -Wrap
} else {
  Write-Host "No clear BOF runtime leftovers found."
}

if ($otherPorts.Count -gt 0) {
  Write-Host ''
  Write-Host "Preview-port listeners not marked for cleanup:"
  $otherPorts |
    Select-Object ProcessId,Name,Ports,WorkingSetMB,CommandLine |
    Format-Table -AutoSize -Wrap
}
