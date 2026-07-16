param(
  [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [string]$OutputPath = (Join-Path $PSScriptRoot "bof_public_operations_dataset_seed.generated.sql")
)

$jsonPath = Join-Path $RepoRoot "Website\assets\data\bof-public-operations.json"
if (!(Test-Path $jsonPath)) {
  throw "Missing dataset: $jsonPath"
}

$json = Get-Content $jsonPath -Raw
$escaped = $json.Replace("'", "''")
$sql = @"
insert into public.bof_public_operations_dataset (id, payload)
values ('current', '$escaped'::jsonb)
on conflict (id) do update
set payload = excluded.payload,
    updated_at = now();
"@

Set-Content -LiteralPath $OutputPath -Value $sql -Encoding UTF8
Write-Host "Wrote $OutputPath"
