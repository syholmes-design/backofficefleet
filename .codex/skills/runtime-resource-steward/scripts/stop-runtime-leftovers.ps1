param(
  [string]$ProjectRoot,
  [int[]]$PreviewPorts = @(3000,3001,3002,3003,3004,3005,3006,3007,3008,3009,3010),
  [switch]$Apply
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'runtime-resource-lib.ps1')

$candidates = @(Get-BofRuntimeResourceReport -ProjectRoot $ProjectRoot -PreviewPorts $PreviewPorts |
  Where-Object { $_.Candidate } |
  Sort-Object ProcessId -Unique)

if ($candidates.Count -eq 0) {
  Write-Host "No clear BOF runtime leftovers found."
  exit
}

if (-not $Apply) {
  Write-Host "Dry run. Re-run with -Apply to stop these processes:"
  $candidates |
    Select-Object ProcessId,Name,Reason,Ports,WorkingSetMB,CommandLine |
    Format-Table -AutoSize -Wrap
  exit
}

$stopped = New-Object System.Collections.Generic.List[object]
foreach ($candidate in $candidates) {
  try {
    Stop-Process -Id $candidate.ProcessId -Force -ErrorAction Stop
    $stopped.Add($candidate)
  } catch {
    Write-Warning ("Could not stop PID {0}: {1}" -f $candidate.ProcessId, $_.Exception.Message)
  }
}

Write-Host ("Stopped {0} BOF runtime leftover process(es)." -f $stopped.Count)
$stopped |
  Select-Object ProcessId,Name,Reason,Ports,WorkingSetMB |
  Format-Table -AutoSize
