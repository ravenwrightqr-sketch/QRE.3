param(
  [string]$Model = "qwen2.5vl:7b"
)

$ErrorActionPreference = "Stop"

$ollamaCandidates = @(
  (Get-Command ollama -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue),
  "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe",
  "$env:ProgramFiles\Ollama\ollama.exe"
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique

$ollamaExe = $ollamaCandidates | Select-Object -First 1
if (-not $ollamaExe) {
  Write-Error "Ollama is installed but its executable could not be found. Expected $env:LOCALAPPDATA\Programs\Ollama\ollama.exe."
}

$ollamaDir = Split-Path -Parent $ollamaExe
if ($env:Path -notlike "*$ollamaDir*") {
  $env:Path = "$ollamaDir;$env:Path"
}

Write-Host "[QRE] Ollama: $ollamaExe" -ForegroundColor Green
Write-Host "[QRE] Checking local model runtime..." -ForegroundColor Cyan

$healthy = $false
try {
  Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method Get -TimeoutSec 5 | Out-Null
  $healthy = $true
} catch {
  Write-Host "[QRE] Ollama is installed but not running. Starting it..." -ForegroundColor Yellow
  Start-Process -FilePath $ollamaExe -ArgumentList "serve" -WindowStyle Hidden
  for ($i = 0; $i -lt 20 -and -not $healthy; $i++) {
    Start-Sleep -Milliseconds 500
    try {
      Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method Get -TimeoutSec 2 | Out-Null
      $healthy = $true
    } catch { }
  }
}

if (-not $healthy) {
  Write-Error "Ollama could not be reached at http://127.0.0.1:11434."
}

Write-Host "[QRE] Pulling local vision-language model: $Model" -ForegroundColor Cyan
& $ollamaExe pull $Model
if ($LASTEXITCODE -ne 0) {
  throw "Ollama failed to pull $Model (exit code $LASTEXITCODE)."
}

$env:QRE_AI_ENABLED = "true"
$env:QRE_LOCAL_MODEL_URL = "http://127.0.0.1:11434"
$env:QRE_LOCAL_MODEL = $Model
$env:QRE_EXTERNAL_AI_ENABLED = "false"

Write-Host ""
Write-Host "[QRE] LOCAL INTELLIGENCE READY" -ForegroundColor Green
Write-Host "QRE_LOCAL_MODEL=$Model" -ForegroundColor Green
Write-Host "QRE_LOCAL_MODEL_URL=http://127.0.0.1:11434" -ForegroundColor Green
Write-Host "QRE_AI_ENABLED=true" -ForegroundColor Green
Write-Host "QRE_EXTERNAL_AI_ENABLED=false" -ForegroundColor Green
Write-Host ""
Write-Host "Start the QRE API from THIS SAME PowerShell session so it inherits the local AI settings." -ForegroundColor Yellow
