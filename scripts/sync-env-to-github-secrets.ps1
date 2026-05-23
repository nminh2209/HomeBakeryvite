# Sync .env KEY=value lines to GitHub Actions repository secrets.
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File scripts/sync-env-to-github-secrets.ps1
#
# Requires: gh CLI logged in (gh auth login)

param(
  [string]$EnvFile = ".env",
  [string]$Repo = "nminh2209/HomeBakeryvite"
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$envPath = Join-Path $root $EnvFile

if (-not (Test-Path $envPath)) {
  Write-Error "Missing $envPath - copy .env.example to .env and fill values first."
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "GitHub CLI (gh) not found. Install from https://cli.github.com/"
}

$count = 0
Get-Content $envPath | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "" -or $line.StartsWith("#")) { return }

  $eq = $line.IndexOf("=")
  if ($eq -lt 1) {
    Write-Warning "Skipping invalid line: $line"
    return
  }

  $name = $line.Substring(0, $eq).Trim()
  $value = $line.Substring($eq + 1).Trim()

  if ($name -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') {
    Write-Warning "Skipping invalid secret name: $name"
    return
  }

  if ($value -eq "") {
    Write-Warning "Skipping empty value for: $name"
    return
  }

  gh secret set $name --body $value --repo $Repo
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to set secret: $name"
  }
  Write-Host "Set $name"
  $count++
}

Write-Host ""
Write-Host "Done. $count secret(s) synced to $Repo"
Write-Host ('Re-run CI: https://github.com/' + $Repo + '/actions')
