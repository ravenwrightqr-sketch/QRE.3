$ErrorActionPreference = 'Stop'

$path = Join-Path $PSScriptRoot '..\packages\engine\src\experience\universalStoryCompiler.ts'
$path = [IO.Path]::GetFullPath($path)

$text = Get-Content -Raw -Encoding UTF8 $path

if ($text -notmatch 'premiseRealizer\.js') {
  $newline = [Environment]::NewLine
  $text = $text -replace '(from "@qre/contracts";)', ('$1' + $newline + 'import { realizePremiseBeat } from "./premiseRealizer.js";')
}

$start = $text.IndexOf('function makeBeat(')
$end = $text.IndexOf('function title(', $start)
if ($start -lt 0 -or $end -lt 0) {
  throw 'Could not locate makeBeat/title boundaries.'
}

$replacement = @'
function makeBeat(
  kind: StoryBeatKind,
  index: number,
  observation: ExperienceObservation,
  situationValue: StorySituation,
  toneValue: ExperienceTone[],
  plan?: CognitiveExperiencePlan,
): StoryBeat {
  const planConfidence =
    plan?.centralSubject && plan.centralSubject.trim()
      ? 0.96
      : 0.72;

  const beat: StoryBeat = {
    id: `beat-${index}-${kind}`,
    kind,
    order: index,
    purpose: beatPurpose(
      kind,
      observation,
      plan,
    ),
    text: '',
    entities: unique([
      observation.subject,
      ...observation.entities.keywords.slice(0, 8),
      ...situationValue.actors.slice(0, 3),
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
              plan ? 0.94 : 0.72,
            ),
          ],
  };

  beat.text = realizePremiseBeat(beat, plan);
  return beat;
}

'@

$text = $text.Substring(0, $start) + $replacement + $text.Substring($end)
Set-Content -Path $path -Value $text -Encoding UTF8
Write-Host "Premise realization wired into $path"
