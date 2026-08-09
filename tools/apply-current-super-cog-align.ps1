$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

function Replace-Exact {
  param([string]$Path, [string]$Old, [string]$New)
  $full = Join-Path $root $Path
  $text = Get-Content -Raw -Encoding UTF8 $full
  if (-not $text.Contains($Old)) { throw "PATCH GUARD FAILED: exact source block not found in $Path" }
  $updated = $text.Replace($Old, $New)
  if ($updated -eq $text) { throw "PATCH GUARD FAILED: no change made to $Path" }
  Set-Content -Path $full -Value $updated -Encoding UTF8 -NoNewline
  Write-Host "Patched $Path"
}

$old = @'
  const cognitiveSubject = clean(plan?.centralSubject ?? "");

  if (cognitiveSubject) {
    return cognitiveSubject;
  }


  const text = clean(prompt);
'@
$new = @'
  const cognitiveSubject = clean(plan?.centralSubject ?? "");
  const text = clean(prompt);

  // QR/NFC/scan/tag are interfaces, not automatically the semantic subject.
  // The experience belongs to the concrete event/object/place the person described.
  const mediumOnlySubject = /^(?:qr|nfc|scan|scannable|tag|code|barcode)$/i.test(
    cognitiveSubject,
  );

  if (cognitiveSubject && !mediumOnlySubject) {
    return cognitiveSubject;
  }
'@
Replace-Exact 'packages/engine/src/experience/universalStoryCompiler.ts' $old $new

$old = @'
  const events = unique(
    lo.match(
      /\b(wedding|concert|festival|birthday|party|ceremony|event|show|conference|rave|nightclub|anniversary|memorial)\b/g,
    ) ?? [],
  );
'@
$new = @'
  const events = unique(
    lo.match(
      /\b(wedding|concert|festival|birthday|party|ceremony|event|show|conference|convention|expo|exposition|rave|nightclub|club|anniversary|memorial|gathering|meetup|fair|tournament|showcase|opening|launch|premiere|parade|carnival|retreat|summit|convention\s+center)\b/g,
    ) ?? [],
  );
'@
Replace-Exact 'packages/engine/src/experience/universalStoryCompiler.ts' $old $new

$old = @'
  const products = unique(
    lo.match(
      /\b(qr|nfc|tag|keychain|sticker|card|poster|shirt|book|product|watch|gift|surfboard|truck|vehicle|guitar|pick|jewelry|tattoo)\b/g,
    ) ?? [],
  );
'@
$new = @'
  const products = unique(
    lo.match(
      /\b(qr|nfc|tag|keychain|sticker|card|poster|shirt|book|product|watch|gift|surfboard|truck|vehicle|guitar|pick|jewelry|artwork|artifact|portal|token|totem|emblem|installation|tattoo)\b/g,
    ) ?? [],
  );
'@
Replace-Exact 'packages/engine/src/experience/universalStoryCompiler.ts' $old $new

$old = @'
    entities: unique([
      observation.subject,
      ...observation.entities.keywords,
      ...situationValue.actors.slice(0, 2),
    ]),
'@
$new = @'
    entities: unique([
      observation.subject,
      ...observation.entities.events,
      ...observation.entities.products,
      ...observation.entities.places,
      ...observation.entities.media,
      ...observation.entities.keywords,
      ...situationValue.actors.slice(0, 2),
    ]),
'@
Replace-Exact 'packages/engine/src/experience/universalStoryCompiler.ts' $old $new

$old = @'
    events: unique(
      lo.match(
        /\b(?:wedding|concert|festival|birthday|party|ceremony|event|show|conference|rave|club|anniversary|memorial)\b/g,
      ) ?? [],
    ),
'@
$new = @'
    events: unique(
      lo.match(
        /\b(?:wedding|concert|festival|birthday|party|ceremony|event|show|conference|convention|expo|exposition|rave|nightclub|club|anniversary|memorial|gathering|meetup|fair|tournament|showcase|opening|launch|premiere|parade|carnival|retreat|summit|convention\s+center)\b/g,
      ) ?? [],
    ),
'@
Replace-Exact 'packages/engine/src/cognition/cognitiveEngine.ts' $old $new

$old = @'
      /\b(?:qr|nfc|tag|keychain|sticker|card|poster|shirt|book|product|watch|gift|surfboard|truck|vehicle|guitar|guitar pick|pick|jewelry|artwork|tattoo)\b/g,
'@
$new = @'
      /\b(?:qr|nfc|tag|keychain|sticker|card|poster|shirt|book|product|watch|gift|surfboard|truck|vehicle|guitar|guitar pick|pick|jewelry|artwork|artifact|portal|token|totem|emblem|installation|tattoo)\b/g,
'@
Replace-Exact 'packages/engine/src/cognition/cognitiveEngine.ts' $old $new

Write-Host ''
Write-Host 'Super Cog semantic alignment applied.' -ForegroundColor Green
Write-Host 'Run the build and acceptance suites now.' -ForegroundColor Cyan
