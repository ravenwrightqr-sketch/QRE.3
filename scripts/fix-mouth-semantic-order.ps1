$ErrorActionPreference = 'Stop'

$path = Join-Path $PSScriptRoot '..\apps\api\src\services\authorBrainUniversal.ts'
$text = Get-Content $path -Raw

$old = @'
  if (creativeBeats < Math.min(2, packet.lineCount - 1) && !rolePass) {
    reasons.push(`attention_realization_too_low:${creativeBeats}`);
  }

  const interruptionFit = metric((ms[1]?.interruption ?? 0) * 0.55 + (ms[1]?.statusChange ?? 0) * 0.45);
'@

$new = @'
  const interruptionFit = metric((ms[1]?.interruption ?? 0) * 0.55 + (ms[1]?.statusChange ?? 0) * 0.45);
'@

if (-not $text.Contains($old)) { throw 'Mouth semantic-order anchor not found: misplaced creative gate' }
$text = $text.Replace($old, $new)

$anchor = @'
  if (score < MIN_SCORE) reasons.push(`quality_below_floor:${score}`);
'@

$insert = @'
  if (creativeBeats < Math.min(2, packet.lineCount - 1) && !rolePass) {
    reasons.push(`attention_realization_too_low:${creativeBeats}`);
  }
  if (score < MIN_SCORE) reasons.push(`quality_below_floor:${score}`);
'@

if (-not $text.Contains($anchor)) { throw 'Mouth semantic-order anchor not found: score floor' }
$text = $text.Replace($anchor, $insert)

Set-Content -Path $path -Value $text -NoNewline -Encoding utf8
Write-Host "Mouth semantic ordering fixed: $path"
