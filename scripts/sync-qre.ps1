param(
  [switch]$DryRun,
  [switch]$NoRebase
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "`n=== QRE SYNC ===" -ForegroundColor Cyan

$branch = (git branch --show-current).Trim()
if (-not $branch) { throw "Not inside a Git repository." }
Write-Host "Branch: $branch"

$status = git status --short
if ($status) {
  Write-Host "`nLOCAL CHANGES DETECTED:" -ForegroundColor Yellow
  $status
  Write-Host "`nQRE SYNC STOPPED. Commit or stash local changes first." -ForegroundColor Yellow
  exit 2
}

Write-Host "`nFetching origin..." -ForegroundColor Cyan
git fetch origin

$remote = "origin/$branch"
$remoteExists = git rev-parse --verify --quiet $remote
if (-not $remoteExists) {
  Write-Host "No remote branch '$remote'. Nothing to sync." -ForegroundColor Yellow
  exit 0
}

$counts = git rev-list --left-right --count "$branch...$remote"
$parts = $counts -split '\s+'
$ahead = [int]$parts[0]
$behind = [int]$parts[1]

Write-Host "`nLocal ahead:  $ahead"
Write-Host "Remote ahead: $behind"

if ($DryRun) {
  Write-Host "`nDRY RUN: no changes made." -ForegroundColor Cyan
  if ($ahead -gt 0) { Write-Host "Local commits not on GitHub:"; git log --oneline "$remote..$branch" }
  if ($behind -gt 0) { Write-Host "GitHub commits not local:"; git log --oneline "$branch..$remote" }
  exit 0
}

if ($ahead -gt 0 -and $behind -gt 0) {
  Write-Host "`nDIVERGED: local and GitHub both contain commits." -ForegroundColor Yellow
  Write-Host "Local-only commits:"; git log --oneline "$remote..$branch"
  Write-Host "`nRemote-only commits:"; git log --oneline "$branch..$remote"
  Write-Host "`nQRE SYNC STOPPED. Resolve intentionally; this script will not guess." -ForegroundColor Yellow
  exit 3
}

if ($behind -gt 0) {
  if ($NoRebase) {
    git pull --ff-only origin $branch
  } else {
    git pull --rebase origin $branch
  }
}

Write-Host "`n=== SYNC COMPLETE ===" -ForegroundColor Green
git status --short
Write-Host "HEAD: $((git rev-parse --short HEAD).Trim())"
