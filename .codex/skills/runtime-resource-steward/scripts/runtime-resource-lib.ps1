Set-StrictMode -Version Latest

function Get-ProjectRoot {
  param([string]$ProjectRoot)

  if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    return (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path
  }

  return (Resolve-Path $ProjectRoot).Path
}

function Get-ListeningPortOwners {
  param([int[]]$Ports)

  $owners = @{}
  try {
    Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
      Where-Object { $Ports -contains [int]$_.LocalPort } |
      ForEach-Object {
        $ownerProcessId = [int]$_.OwningProcess
        if (-not $owners.ContainsKey($ownerProcessId)) {
          $owners[$ownerProcessId] = New-Object System.Collections.Generic.List[int]
        }
        $owners[$ownerProcessId].Add([int]$_.LocalPort)
      }
  } catch {
    return $owners
  }

  return $owners
}

function Test-CodexRuntimeProcess {
  param([string]$Name, [string]$CommandLine)

  $cmd = ($CommandLine | ForEach-Object { "$_" }).ToLowerInvariant()
  if ($Name -ieq 'node_repl.exe') { return $true }
  if ($cmd -match '\\appdata\\local\\openai\\codex\\') { return $true }
  if ($cmd -match '\\codex-runtimes\\') { return $true }
  return $false
}

function Get-BofRuntimeResourceReport {
  param(
    [string]$ProjectRoot,
    [int[]]$PreviewPorts = @(3000,3001,3002,3003,3004,3005,3006,3007,3008,3009,3010)
  )

  $resolvedRoot = Get-ProjectRoot -ProjectRoot $ProjectRoot
  $rootNeedle = $resolvedRoot.ToLowerInvariant()
  $portOwners = Get-ListeningPortOwners -Ports $PreviewPorts
  $processes = Get-CimInstance Win32_Process |
    Where-Object { $_.Name -match '^(node|node_repl|python|pythonw|powershell|pwsh)\.exe$' }

  foreach ($process in $processes) {
    $name = "$($process.Name)"
    $cmd = "$($process.CommandLine)"
    $cmdLower = $cmd.ToLowerInvariant()
    $ports = @()
    if ($portOwners.ContainsKey([int]$process.ProcessId)) {
      $ports = @($portOwners[[int]$process.ProcessId] | Sort-Object -Unique)
    }

    $isCodexRuntime = Test-CodexRuntimeProcess -Name $name -CommandLine $cmd
    $candidate = $false
    $reason = ''

    if (-not $isCodexRuntime) {
      if ($cmdLower.Contains('snapshot-website.mjs') -and $cmdLower.Contains('website-visual-snapshot-reviewer')) {
        $candidate = $true
        $reason = 'BOF visual snapshot script'
      } elseif ($cmdLower.Contains($rootNeedle) -and $cmdLower.Contains('snapshot-website.mjs')) {
        $candidate = $true
        $reason = 'BOF visual snapshot script'
      } elseif ($cmdLower.Contains('playwright') -and $cmdLower.Contains('.codex') -and $cmdLower.Contains('visual-snapshots')) {
        $candidate = $true
        $reason = 'BOF Playwright screenshot job'
      } elseif ($ports.Count -gt 0 -and ($cmdLower.Contains('http.server') -or $cmdLower.Contains('-m http.server'))) {
        $candidate = $true
        $reason = 'local Python preview server on BOF preview port'
      } elseif ($cmdLower.Contains($rootNeedle) -and $cmdLower.Contains('localhost') -and ($cmdLower.Contains('playwright') -or $cmdLower.Contains('snapshot'))) {
        $candidate = $true
        $reason = 'BOF localhost automation job'
      }
    }

    [pscustomobject]@{
      ProcessId = [int]$process.ProcessId
      Name = $name
      Candidate = [bool]$candidate
      Reason = $reason
      Ports = ($ports -join ',')
      WorkingSetMB = [math]::Round(([double]$process.WorkingSetSize / 1MB), 1)
      CommandLine = $cmd
    }
  }
}
