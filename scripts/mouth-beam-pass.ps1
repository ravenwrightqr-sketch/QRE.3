$ErrorActionPreference = 'Stop'

$path = Join-Path $PSScriptRoot '..\apps\api\src\services\authorBrainUniversal.ts'
$text = Get-Content $path -Raw

function Replace-Exact([string]$old, [string]$new, [string]$label) {
  if (-not $script:text.Contains($old)) {
    throw "Mouth beam anchor not found: $label"
  }
  $script:text = $script:text.Replace($old, $new)
}

Replace-Exact @'
    "QRE MOUTH. COG selected the experience. Render ONE final five-beat sequence.",
    `Return JSON only: {\"lines\":[\"...\"]}. Exactly ${packet.lineCount} lines.`,
'@ @'
    "QRE MOUTH. COG selected the experience. Search for the strongest realization before selecting a winner.",
    `Return JSON only as {\"candidates\":[{\"lines\":[\"...\"]},...]}. Generate exactly 4 materially different candidates, each with exactly ${packet.lineCount} lines.`,
'@ 'beam output shape'

Replace-Exact @'
    "ATTENTION IS THE PRODUCT.",
'@ @'
    "ATTENTION IS THE PRODUCT.",
    "Do not make all four candidates minor paraphrases. Explore different truthful attention mechanisms: interruption, curiosity, contrast, callback, implication, dry reversal, or understated payoff.",
    "At least one candidate should be extremely plain and sharp. At least one may use a rhetorical turn such as 'Or so it seemed.' or 'What came next?' when that wording changes attention without asserting a new fact.",
    "The candidates are competing hypotheses. Do not force every supplied fact into every candidate. Find the strongest few relationships among the supplied facts and build around them.",
'@ 'beam diversity'

Replace-Exact @'
    "Do not merely copy or mechanically paraphrase the source facts. Stay entirely inside supplied reality and accumulated identity memory while changing what the viewer notices about that reality.",
'@ @'
    "Do not merely copy or mechanically paraphrase the source facts. Stay entirely inside supplied reality and accumulated identity memory while changing what the viewer notices about that reality.",
    "Example of the target behavior (style only, not factual content): a normal-state line can be followed by a short interruption such as 'Or so it seemed.'; a supplied sequence can become curiosity with 'What came next?'; a supplied ending can become a callback instead of a status report.",
'@ 'grounded attention examples'

Replace-Exact @'
  const modelResult = await localModelGenerate(
    modelMessage(packet),
    "json",
    { numPredict: Math.min(3000, Math.max(1100, lineTotal * 220)), temperature: protectedMemorial || sensitive ? 0.28 : 0.72 },
  );
'@ @'
  const modelResult = await localModelGenerate(
    modelMessage(packet),
    "json",
    { numPredict: Math.min(5200, Math.max(2200, lineTotal * 420)), temperature: protectedMemorial || sensitive ? 0.28 : 0.78 },
  );
'@ 'beam model budget'

Set-Content -Path $path -Value $text -NoNewline -Encoding utf8
Write-Host "Mouth beam pass applied: $path"
