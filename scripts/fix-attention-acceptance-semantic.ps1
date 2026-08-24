$ErrorActionPreference = 'Stop'

$path = Join-Path $PSScriptRoot '..\apps\api\author-attention-language-acceptance.ts'
$text = Get-Content $path -Raw

function Replace-Exact([string]$old, [string]$new, [string]$label) {
  if (-not $script:text.Contains($old)) { throw "Attention acceptance anchor not found: $label" }
  $script:text = $script:text.Replace($old, $new)
}

Replace-Exact @'
const attention = /\b(?:then|next|but|still|again|until|already|first|last|only|now|yet|except|suddenly|round|one more|not yet|and then|this time)\b/i;
const interruption = /^(?:\d{1,2}:\d{2}|[^.!?]{1,24}[:—-])|—|:\s*$/i;
const anticipation = /\b(?:next|then|until|again|still|not yet|before|what happened|one more|this time|wait)\b/i;
const payoff = /\b(?:over|done|complete|finished|back|again|round|settled|cleared|final|next|more|matter|counted|won|lost|held|left)\b/i;

const attentionSignals = lines.reduce((count, line, index) => {
  const signal = (attention.test(line) ? 1 : 0)
    + (index < lines.length - 1 && anticipation.test(line) ? 1 : 0)
    + (index < lines.length - 1 && interruption.test(line) ? 1 : 0)
    + (index === lines.length - 1 && payoff.test(line) ? 1 : 0);
  return count + signal;
}, 0);
'@ @'
const attentionMetrics = result.diagnostics?.attentionMetrics ?? [];
const attentionSignals = [
  Math.max(attentionMetrics[1]?.interruption ?? 0, attentionMetrics[1]?.statusChange ?? 0) >= 0.40,
  Math.max(attentionMetrics[2]?.curiosity ?? 0, (attentionMetrics[2]?.nextBeatPull ?? 0) * 0.7) >= 0.38,
  Math.max(attentionMetrics[3]?.contrast ?? 0, (attentionMetrics[3]?.statusChange ?? 0) * 0.7) >= 0.30,
  Math.max(attentionMetrics[4]?.payoff ?? 0, (attentionMetrics[4]?.statusChange ?? 0) * 0.45) >= 0.24,
].filter(Boolean).length;
'@ 'semantic attention signals'

Replace-Exact @'
assert.ok(attentionSignals >= 4, `attention: need at least four attention signals, got ${attentionSignals}`);
'@ @'
assert.ok(attentionSignals >= 4, `attention: need at least four semantic attention functions, got ${attentionSignals}`);
'@ 'semantic attention assertion'

Set-Content -Path $path -Value $text -NoNewline -Encoding utf8
Write-Host "Semantic attention acceptance applied: $path"
