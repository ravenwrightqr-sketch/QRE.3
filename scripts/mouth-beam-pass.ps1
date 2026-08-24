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
    "QRE MOUTH. COG selected the experience. Search for the strongest realization before selecting a winner.",
    `Return JSON only as {\"candidates\":[{\"lines\":[\"...\"]},...]}. Generate exactly 4 materially different candidates, each with exactly ${packet.lineCount} lines.`,
'@ @'
    "QRE MOUTH. COG selected the experience. Search for the strongest realization before selecting a winner.",
    `Return JSON only as {\"candidates\":[{\"lines\":[\"...\"]},...]}. Generate exactly 4 materially different candidates, each with exactly ${packet.lineCount} lines.`,
    "Candidate 1 = INTERRUPTION: establish the strongest supplied ordinary/current state, then break the expected read using only an existing fact, wording, chronology, contrast, or implication.",
    "Candidate 2 = CURIOSITY: make one supplied detail newly interesting and create a truthful unresolved need that makes the next beat necessary. Do not invent a mystery or missing person/object/event.",
    "Candidate 3 = CONTRAST/CALLBACK: make two supplied facts change each other's meaning, or bring an earlier supplied detail back with a new emphasis. Do not add a new fact.",
    "Candidate 4 = PAYOFF: build toward the strongest supplied consequence, ending, callback, or dry verdict. The payoff must be earned by earlier supplied material.",
'@ 'candidate mechanisms'

Replace-Exact @'
    "Do not make all four candidates minor paraphrases. Explore different truthful attention mechanisms: interruption, curiosity, contrast, callback, implication, dry reversal, or understated payoff.",
'@ @'
    "The four candidates must use the assigned mechanism, not four versions of the same fact parade.",
    "Do not turn beat 3 into a generic question about the writing itself. Never ask what is unresolved merely because the prompt asks for curiosity. Curiosity must arise from supplied material.",
    "Do not manufacture absence, presence, mystery, conflict, motive, hidden action, or consequence to create curiosity.",
'@ 'beam behavior'

Replace-Exact @'
    "Example of the target behavior (style only, not factual content): a normal-state line can be followed by a short interruption such as 'Or so it seemed.'; a supplied sequence can become curiosity with 'What came next?'; a supplied ending can become a callback instead of a status report.",
'@ @'
    "Example of the target behavior (style only, not factual content): a normal-state line can be followed by a short interruption such as 'Or so it seemed.'; a supplied sequence can create a truthful forward question; an earlier supplied detail can return as a callback instead of another status report; a plain final line can act as the payoff. Do not copy these phrases mechanically.",
'@ 'beam examples'

Replace-Exact @'
  const modelResult = await localModelGenerate(
    modelMessage(packet),
    "json",
    { numPredict: Math.min(5200, Math.max(2200, lineTotal * 420)), temperature: protectedMemorial || sensitive ? 0.28 : 0.78 },
  );
'@ @'
  const modelResult = await localModelGenerate(
    modelMessage(packet),
    "json",
    { numPredict: Math.min(6200, Math.max(2600, lineTotal * 500)), temperature: protectedMemorial || sensitive ? 0.28 : 0.82 },
  );
'@ 'beam model budget'

Set-Content -Path $path -Value $text -NoNewline -Encoding utf8
Write-Host "Mouth beam pass applied: $path"
