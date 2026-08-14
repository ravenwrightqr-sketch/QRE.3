param(
  [string]$Model = "qwen2.5vl:7b"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
  Write-Error "Ollama is not installed or not on PATH. Install Ollama first, then rerun this script."
}

Write-Host "[QRE] Checking local model runtime..." -ForegroundColor Cyan
try {
  Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method Get -TimeoutSec 5 | Out-Null
} catch {
  Write-Error "Ollama is not running at http://127.0.0.1:11434. Start Ollama, then rerun this script."
}

Write-Host "[QRE] Pulling local vision-language model: $Model" -ForegroundColor Cyan
ollama pull $Model

$env:QRE_AI_ENABLED = "true"
$env:QRE_LOCAL_MODEL_URL = "http://127.0.0.1:11434"
$env:QRE_LOCAL_MODEL = $Model
$env:QRE_EXTERNAL_AI_ENABLED = "false"

Write-Host "" 
Write-Host "[QRE] Local intelligence is configured for this PowerShell session." -ForegroundColor Green
Write-Host "QRE_LOCAL_MODEL=$Model" -ForegroundColor Green
Write-Host "QRE_AI_ENABLED=true" -ForegroundColor Green
Write-Host "QRE_EXTERNAL_AI_ENABLED=false" -ForegroundColor Green
Write-Host "" 
Write-Host "Start the API normally in this same terminal so it inherits these settings." -ForegroundColor Yellow
