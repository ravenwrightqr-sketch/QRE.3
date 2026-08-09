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

  // A portal/artifact may have a QR/NFC/scan interface, but that interface
  // is not automatically the semantic subject of the experience.
  const mediumOnlySubject = /^(?:qr|nfc|scan|scannable|tag|code|barcode)$/i.test(
    cognitiveSubject,
  );

  if (cognitiveSubject && !mediumOnlySubject) {
    return cognitiveSubject;
  }

  // When cognition selected only the interface, recover the concrete world
  // anchor instead of collapsing the premise to "qr" or "nfc".
  if (mediumOnlySubject) {
    const event = value.events.find((item) => item !== "event") ?? value.events[0];
    const artifact = value.products.find(
      (item) => !/^(?:qr|nfc|scan|scannable|tag|code|barcode)$/i.test(item),
    );

    if (event && artifact) return `${event} ${artifact}`;
    if (event) return event;
    if (artifact) return artifact;
  }
'@
Replace-Exact 'packages/engine/src/experience/universalStoryCompiler.ts' $old $new

$old = @'
function beatText(
'@
$new = @'
/**
 * Preserve coupled premise dimensions in the rendered story.
 *
 * Cognition may identify a medium, event, place, and human outcome as
 * separate evidence. The renderer must not throw away those dimensions
 * merely because one noun became the central subject.
 */
function premiseRealizationBridge(
  baseText: string,
  observation: ExperienceObservation,
  plan?: CognitiveExperiencePlan,
): string {
  const text = lower(baseText);
  const lo = lower(observation.prompt);

  const event =
    observation.entities.events.find((item) => item !== "event") ??
    observation.entities.events[0] ??
    (observation.context.includes("event") ? "event" : "");

  const medium = observation.entities.products.find((item) =>
    /^(?:qr|nfc|scan|scannable|tag|code|barcode)$/i.test(item),
  ) ?? "";

  const artifact = observation.entities.products.find((item) =>
    /^(?:artwork|artifact|portal|token|totem|emblem|installation|sticker|keychain|card|poster|shirt|book|gift|jewelry|tattoo)$/i.test(item),
  ) ?? "";

  const place = observation.entities.places[0] ?? "";
  const outcome = semanticOutcome(observation, plan);
  const quality = premiseQuality(observation);

  const required = [event, medium, outcome].filter(Boolean);
  if (required.length >= 2 && required.every((value) => text.includes(lower(value)))) {
    return baseText;
  }

  // Event + interface + human outcome is the canonical coupled case.
  if (event && medium && outcome) {
    return `${baseText} The ${event} uses the ${medium} as a doorway into something people can ${outcome}.`;
  }

  // Event + artifact + outcome keeps physical art/artifacts from being
  // reduced to the old "QR" mental model.
  if (event && artifact && outcome) {
    return `${baseText} At the ${event}, the ${artifact} becomes part of how people ${outcome}.`;
  }

  if (event && outcome) {
    return `${baseText} The ${event} gives people a reason to ${outcome}.`;
  }

  if (medium && outcome) {
    return `${baseText} The ${medium} is the doorway, not the destination: it lets people ${outcome}.`;
  }

  if (place && outcome && /\b(?:at|in|near|venue|center)\b/i.test(lo)) {
    return `${baseText} ${cap(place)} is part of the experience, giving people a place to ${outcome}.`;
  }

  if (quality && artifact && !text.includes(lower(artifact))) {
    return `${baseText} The ${artifact} carries the ${quality} quality of the experience.`;
  }

  return baseText;
}

function beatText(
'@
Replace-Exact 'packages/engine/src/experience/universalStoryCompiler.ts' $old $new

$old = @'
  return {
    id: `beat-${index}-${kind}`,
    kind,
    order: index,
    purpose: beatPurpose(
      kind,
      observation,
      plan,
    ),
    text: beatText(
      kind,
      observation,
      situationValue,
      plan,
    ),
'@
$new = @'
  const baseText = beatText(
    kind,
    observation,
    situationValue,
    plan,
  );

  const realizedText =
    index === 0
      ? premiseRealizationBridge(
          baseText,
          observation,
          plan,
        )
      : baseText;

  return {
    id: `beat-${index}-${kind}`,
    kind,
    order: index,
    purpose: beatPurpose(
      kind,
      observation,
      plan,
    ),
    text: realizedText,
'@
Replace-Exact 'packages/engine/src/experience/universalStoryCompiler.ts' $old $new

$old = @'
      /\b(?:wedding|concert|festival|birthday|party|ceremony|event|show|conference|convention|expo|exposition|rave|nightclub|club|anniversary|memorial|gathering|meetup|fair|tournament|showcase|opening|launch|premiere|parade|carnival|retreat|summit|convention\s+center)\b/g,
'@
$new = @'
      /\b(?:wedding|concert|festival|birthday|party|ceremony|event|show|conference|convention|expo|exposition|rave|nightclub|club|anniversary|memorial|gathering|meetup|fair|tournament|showcase|opening|launch|premiere|parade|carnival|retreat|summit|convention\s+center|anime\s+convention|gaming\s+convention|comic\s+convention)\b/g,
'@
Replace-Exact 'packages/engine/src/experience/universalStoryCompiler.ts' $old $new

$old = @'
      /\b(?:wedding|concert|festival|birthday|party|ceremony|event|show|conference|convention|expo|exposition|rave|nightclub|club|anniversary|memorial|gathering|meetup|fair|tournament|showcase|opening|launch|premiere|parade|carnival|retreat|summit|convention\s+center)\b/g,
'@
$new = @'
      /\b(?:wedding|concert|festival|birthday|party|ceremony|event|show|conference|convention|expo|exposition|rave|nightclub|club|anniversary|memorial|gathering|meetup|fair|tournament|showcase|opening|launch|premiere|parade|carnival|retreat|summit|convention\s+center|anime\s+convention|gaming\s+convention|comic\s+convention)\b/g,
'@
Replace-Exact 'packages/engine/src/cognition/cognitiveEngine.ts' $old $new

Write-Host ''
Write-Host 'Premise realization v2 applied.' -ForegroundColor Green
Write-Host 'Run contracts build, engine build, universal, and realization tests.' -ForegroundColor Cyan
