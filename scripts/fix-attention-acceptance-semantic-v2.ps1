$ErrorActionPreference = 'Stop'

$path = Join-Path $PSScriptRoot '..\apps\api\author-attention-language-acceptance.ts'
$text = Get-Content $path -Raw

$old = @'
const attention = /\b(?:then|next|but|still|again|until|already|first|last|only|now|yet|except|suddenly|round|one more|not yet|and then|this time)\b/i;
const interruption = /^(?:\d{1,2}:\d{2}|[^.!?]{1,24}[:—-])|—|:\s*$/i;
const anticipation = /\b(?:next|then|until|again|still|not yet|before|what happened|one more|this time|wait)\b/i;
const payoff = /\b(?:over|done|complete|finished|back|again|round|settled|cleared|final|next|more|matter|counted|won|lost|held|left)\b/i;

const attentionSignals = lines.reduce((count, line, index) => count + (attention.test(line) ? 1 : 0) + (index < lines.length - 1 && anticipation.test(line) ? 1 : 0) + (index < lines.length - 1 && interruption.test(line) ? 1 : 0) + (index === lines.length - 1 && payoff.test(line) ? 1 : 0), 0);
'@

$new = @'
const attentionMetrics = result.diagnostics?.attentionMetrics ?? [];
const attentionSignals = [
  Math.max(attentionMetrics[1]?.interruption ?? 0, attentionMetrics[1]?.statusChange ?? 0) >= 0.40,
  Math.max(attentionMetrics[2]?.curiosity ?? 0, (attentionMetrics[2]?.nextBeatPull ?? 0) * 0.7) >= 0.38,
  Math.max(attentionMetrics[3]?.contrast ?? 0, (attentionMetrics[3]?.statusChange ?? 0) * 0.7) >= 0.30,
  Math.max(attentionMetrics[4]?.payoff ?? 0, (attentionMetrics[4]?.statusChange ?? 0) * 0.45) >= 0.24,
].filter(Boolean).length;
'@

if (-not $text.Contains($old)) { throw 'Attention acceptance semantic-v2 anchor not found: legacy attention block' }
$text = $text.Replace($old, $new)

$oldAssert = 'assert.ok(attentionSignals >= 4, `attention: need at least four attention signals, got ${attentionSignals}`);'
$newAssert = 'assert.ok(attentionSignals >= 4, `attention: need at least four semantic attention functions, got ${attentionSignals}`);'
if (-not $text.Contains($oldAssert)) { throw 'Attention acceptance semantic-v2 anchor not found: attention assertion' }
$text = $text.Replace($oldAssert, $newAssert)

Set-Content -Path $path -Value $text -NoNewline -Encoding utf8
Write-Host "Semantic attention acceptance v2 applied: $path"
