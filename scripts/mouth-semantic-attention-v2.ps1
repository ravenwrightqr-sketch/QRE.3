$ErrorActionPreference = 'Stop'

$path = Join-Path $PSScriptRoot '..\apps\api\src\services\authorBrainUniversal.ts'
$text = Get-Content $path -Raw

function Replace-Exact([string]$old, [string]$new, [string]$label) {
  if (-not $script:text.Contains($old)) { throw "Semantic attention anchor not found: $label" }
  $script:text = $script:text.Replace($old, $new)
}

Replace-Exact @'
    "For a sequence of ordinary service facts, do not write all five facts in order. Example pattern only: one anchor fact → attention turn → one supporting fact → callback/reframe → earned ending.",
'@ @'
    "For a sequence of ordinary service facts, do not write all five facts in order. Example pattern only: one anchor fact → attention turn → one supporting fact → callback/reframe → earned ending.",
    "Example of behavioral compression (style only, not reusable content): 'Kitchen first.' → 'Bath next.' → 'Living room last.' → '11:11.' → 'Done.' The point is changing expectation and forward movement, not the exact words.",
    "Attention functions do not require trigger words. Interruption can be a change of state, scale, location, time, or emphasis. Curiosity can be forward pull. Contrast can be a meaningful state change. Payoff can be closure or callback.",
'@ 'semantic examples'

Replace-Exact @'
  const directFacts = packet.reality.filter((fact) => clean(fact).toLowerCase() !== packet.subject.toLowerCase());
  const directParaphrases = directFacts.filter((fact) => lines.join(" ").toLowerCase().includes(fact.toLowerCase())).length;
  const paraphraseRatio = directFacts.length ? directParaphrases / directFacts.length : 0;
  if (paraphraseRatio >= 0.75 && !packet.ending) reasons.push(`fact_parade:${paraphraseRatio.toFixed(2)}`);

  const creativeBeats = lines.filter((line, index) => {
'@ @'
  const directFacts = packet.reality.filter((fact) => clean(fact).toLowerCase() !== packet.subject.toLowerCase());
  const directParaphrases = directFacts.filter((fact) => lines.join(" ").toLowerCase().includes(fact.toLowerCase())).length;
  const paraphraseRatio = directFacts.length ? directParaphrases / directFacts.length : 0;

  const creativeBeats = lines.filter((line, index) => {
'@ 'fact parade gate'

Replace-Exact @'
  const rolePass = ms.length === packet.lineCount
    && ms[1]?.interruption >= 0.42
    && ms[2]?.curiosity >= 0.42
    && ms[packet.lineCount - 2]?.contrast >= 0.38
    && ms[packet.lineCount - 1]?.payoff >= 0.42;
  if (!rolePass) reasons.push("attention_arc_incomplete");

  const averageAttention = ms.reduce((sum, item) => sum + item.attention, 0) / Math.max(1, ms.length);
  const averageCinematicity = ms.reduce((sum, item) => sum + item.cinematicity, 0) / Math.max(1, ms.length);
  const score = metric(averageAttention * 0.6 + averageCinematicity * 0.2 + (rolePass ? 0.15 : 0) + Math.min(0.05, creativeBeats * 0.0125));
  if (score < MIN_SCORE) reasons.push(`quality_below_floor:${score}`);
'@ @'
  const interruptionFit = metric((ms[1]?.interruption ?? 0) * 0.55 + (ms[1]?.statusChange ?? 0) * 0.45);
  const curiosityFit = metric(Math.max(ms[2]?.curiosity ?? 0, (ms[2]?.nextBeatPull ?? 0) * 0.7));
  const contrastFit = metric(Math.max(ms[packet.lineCount - 2]?.contrast ?? 0, (ms[packet.lineCount - 2]?.statusChange ?? 0) * 0.7));
  const payoffFit = metric(Math.max(ms[packet.lineCount - 1]?.payoff ?? 0, (ms[packet.lineCount - 1]?.statusChange ?? 0) * 0.45));
  const rolePass = ms.length === packet.lineCount
    && interruptionFit >= 0.40
    && curiosityFit >= 0.38
    && contrastFit >= 0.30
    && payoffFit >= 0.24;
  if (!rolePass) reasons.push("attention_arc_incomplete");

  if (paraphraseRatio >= 0.75 && !rolePass) reasons.push(`fact_parade:${paraphraseRatio.toFixed(2)}`);

  const averageAttention = ms.reduce((sum, item) => sum + item.attention, 0) / Math.max(1, ms.length);
  const averageCinematicity = ms.reduce((sum, item) => sum + item.cinematicity, 0) / Math.max(1, ms.length);
  const averageSpecificity = ms.reduce((sum, item) => sum + item.specificity, 0) / Math.max(1, ms.length);
  const arcFit = (interruptionFit + curiosityFit + contrastFit + payoffFit) / 4;
  const factPenalty = paraphraseRatio * 0.08;
  const score = metric(
    arcFit * 0.42
      + averageAttention * 0.22
      + averageCinematicity * 0.12
      + averageSpecificity * 0.09
      + Math.min(0.10, creativeBeats * 0.025)
      + (rolePass ? 0.10 : 0)
      - factPenalty,
  );
  if (score < MIN_SCORE) reasons.push(`quality_below_floor:${score}`);
'@ 'semantic attention scoring'

Replace-Exact @'
  if (creativeBeats < Math.min(2, packet.lineCount - 1)) reasons.push(`attention_realization_too_low:${creativeBeats}`);
'@ @'
  if (creativeBeats < Math.min(2, packet.lineCount - 1) && !rolePass) {
    reasons.push(`attention_realization_too_low:${creativeBeats}`);
  }
'@ 'semantic creative gate'

Set-Content -Path $path -Value $text -NoNewline -Encoding utf8
Write-Host "Semantic Mouth attention v2 applied: $path"
