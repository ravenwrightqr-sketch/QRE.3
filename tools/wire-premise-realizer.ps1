$ErrorActionPreference = 'Stop'

$path = Join-Path $PSScriptRoot '..\packages\engine\src\experience\universalStoryCompiler.ts'
$path = [System.IO.Path]::GetFullPath($path)

$content = Get-Content -Raw -LiteralPath $path

$importAnchor = 'import type {\n'
$realizerImport = 'import { realizePremiseBeat } from "./premiseRealizer.js";\n\n'

if ($content -notmatch 'import \{ realizePremiseBeat \} from "\./premiseRealizer\.js";') {
  $content = $content -replace [regex]::Escape('} from "@qre/contracts";\n\n'), '} from "@qre/contracts";\n\n' + $realizerImport
}

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
    entities: unique([
      observation.subject,
      ...observation.entities.keywords.slice(0, 4),
      ...situationValue.actors.slice(0, 2),
    ]),
    emotionalTarget:
      toneValue[0] ?? "curiosity",
    provenance:
      kind === "orientation" ||
      kind === "need" ||
      kind === "threshold"
        ? [
            ...provenance(
              "observed",
              "prompt",
              1,
            ),
            ...(plan
              ? provenance(
                  "inferred",
                  "cognitive_plan",
                  planConfidence,
                )
              : []),
          ]
        : [
            ...provenance(
              "observed",
              "prompt",
              1,
            ),
            ...provenance(
              "inferred",
              "cognitive_story_realization",
              plan ? 0.92 : 0.72,
            ),
          ],
  };
'@

$new = @'
  const rawText = beatText(
    kind,
    observation,
    situationValue,
    plan,
  );

  const beat: StoryBeat = {
    id: `beat-${index}-${kind}`,
    kind,
    order: index,
    purpose: beatPurpose(
      kind,
      observation,
      plan,
    ),
    text: rawText,
    entities: unique([
      observation.subject,
      ...observation.entities.keywords.slice(0, 4),
      ...situationValue.actors.slice(0, 2),
    ]),
    emotionalTarget:
      toneValue[0] ?? "curiosity",
    provenance:
      kind === "orientation" ||
      kind === "need" ||
      kind === "threshold"
        ? [
            ...provenance(
              "observed",
              "prompt",
              1,
            ),
            ...(plan
              ? provenance(
                  "inferred",
                  "cognitive_plan",
                  planConfidence,
                )
              : []),
          ]
        : [
            ...provenance(
              "observed",
              "prompt",
              1,
            ),
            ...provenance(
              "inferred",
              "cognitive_story_realization",
              plan ? 0.92 : 0.72,
            ),
          ],
  };

  return {
    ...beat,
    text: realizePremiseBeat(beat, plan),
  };
'@

if ($content.Contains($old)) {
  $content = $content.Replace($old, $new)
} elseif ($content -notmatch 'text: realizePremiseBeat\(beat, plan\)') {
  throw 'Expected makeBeat block was not found; refusing to edit an unexpected compiler version.'
}

Set-Content -LiteralPath $path -Value $content -Encoding utf8
Write-Host 'Premise realization wired into universalStoryCompiler.ts.'