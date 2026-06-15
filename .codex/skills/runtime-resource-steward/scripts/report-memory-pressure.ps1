param(
  [int]$Top = 20,
  [string]$ProjectRoot
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'runtime-resource-lib.ps1')

$os = Get-CimInstance Win32_OperatingSystem
$summary = [pscustomobject]@{
  TotalGB = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
  FreeGB = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
  UsedGB = [math]::Round(($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / 1MB, 2)
  UsedPercent = [math]::Round((($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / $os.TotalVisibleMemorySize) * 100, 1)
}

$leftovers = @(Get-BofRuntimeResourceReport -ProjectRoot $ProjectRoot | Where-Object { $_.Candidate })
$processes = @(Get-CimInstance Win32_Process)
$topProcesses = @($processes |
  Sort-Object WorkingSetSize -Descending |
  Select-Object -First $Top ProcessId,ParentProcessId,Name,@{Name='WorkingSetMB';Expression={[math]::Round($_.WorkingSetSize / 1MB, 1)}},CommandLine)

$groups = @($processes |
  Where-Object { $_.Name -match '^(Codex|codex|node|node_repl|python|pythonw|powershell|pwsh|chrome|msedge|msedgewebview2)\.exe$' } |
  Group-Object Name |
  ForEach-Object {
    [pscustomobject]@{
      Name = $_.Name
      Count = $_.Count
      WorkingSetMB = [math]::Round(($_.Group | Measure-Object WorkingSetSize -Sum).Sum / 1MB, 1)
    }
  } |
  Sort-Object WorkingSetMB -Descending)

Write-Host "Memory Pressure Report"
Write-Host ''
$summary | Format-List
Write-Host "Clear BOF runtime leftovers: $($leftovers.Count)"
Write-Host ''
Write-Host "Tool/app memory groups:"
$groups | Format-Table -AutoSize
Write-Host ''
Write-Host "Top memory processes:"
$topProcesses | Format-Table -AutoSize -Wrap
