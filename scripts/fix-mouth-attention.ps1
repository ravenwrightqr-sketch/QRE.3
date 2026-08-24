$ErrorActionPreference = 'Stop'

$path = Join-Path $PSScriptRoot '..\apps\api\src\services\authorBrainUniversal.ts'
$text = Get-Content $path -Raw

function Replace-Exact([string]$old, [string]$new, [string]$label) {
  if (-not $script:text.Contains($old)) {
    throw "Mouth tuning anchor not found: $label"
  }
  $script:text = $script:text.Replace($old, $new)
}

Replace-Exact @'
const PAYOFF = /\b(?:finally|again|now|that was|this was|for now|or so|the beginning|the end|only beginning|temporary)\b/i;
'@ @'
const PAYOFF = /\b(?:finally|again|now|that was|this was|for now|or so|the beginning|the end|only beginning|temporary)\b/i;
const INVENTED_PRESENCE = /\b(?:no one|nobody|nothing|someone|somebody|everyone|everybody)\b/i;
'@ 'presence guard'

Replace-Exact @'
    if (!known.includes(match[0].toLowerCase())) return `unsupported_${label}`;
  }
  return undefined;
}
'@ @'
    if (!known.includes(match[0].toLowerCase())) return `unsupported_${label}`;
  }
  if (INVENTED_PRESENCE.test(line) && !INVENTED_PRESENCE.test(packet.reality.join(" "))) {
    return "invented_presence_state";
  }
  return undefined;
}
'@ 'presence validation'

Replace-Exact @'
    "Beat 1 establishes the supplied reality or normal state.",
    "Beat 2 interrupts that state with a concrete contrast, reversal, unexpected implication, or withheld answer.",
    "Beat 3 creates curiosity, an unresolved question, anticipation, or a reason to need the next beat.",
    "Beat 4 changes the interpretation of supplied material through contrast, callback, reframing, or status change.",
    "Beat 5 pays something off: a supplied callback, earned consequence, short implication, dry verdict, or truthful continuation.",
'@ @'
    "Do NOT write a receipt, checklist, status log, or one-fact-per-line summary. The facts are raw material for one compact movie, not five items to recite.",
    "First FIND ONE grounded creative opportunity hidden in the supplied material. Examples: an unexpected contrast between two supplied states, a double meaning already present in the wording, a callback, a reversal in what the known facts mean, or a tiny question created by the sequence itself.",
    "Beat 1 establishes the supplied reality or normal state.",
    "Beat 2 must interrupt the expected read. The interruption must come from something already supplied; do not manufacture conflict, absence, presence, motives, or hidden activity.",
    "Beat 3 must create curiosity or forward pull without inventing a new event. Make the viewer need the next beat because of how the supplied material has been framed.",
    "Beat 4 must change the interpretation of something already supplied through contrast, callback, reframe, implication, or status change. It should NOT simply introduce the next raw fact.",
    "Beat 5 pays something off: a supplied callback, earned consequence, dry verdict, implication, or truthful continuation.",
'@ 'attention behavior prompt'

Replace-Exact @'
    "Do not merely copy the source facts. Compress and rephrase them, but stay entirely inside supplied reality and accumulated identity memory.",
'@ @'
    "Do not merely copy or mechanically paraphrase the source facts. Stay entirely inside supplied reality and accumulated identity memory while changing what the viewer notices about that reality.",
'@ 'fact-parade instruction'

Replace-Exact @'
    "HARD REALITY LAW: do not invent a person, relationship, place, room, object, body detail, sensory detail, dialogue, participant, ownership, tenancy, customer/client relationship, or literal event.",
    "A plausible detail is still invented. Do not infer physical props from actions.",
'@ @'
    "HARD REALITY LAW: do not invent a person, relationship, place, room, object, body detail, sensory detail, dialogue, participant, ownership, tenancy, customer/client relationship, absence, presence, motive, unseen action, or literal event.",
    "Never use 'no one', 'nobody', 'nothing', 'someone', 'somebody', 'everyone', or 'everybody' unless that exact world condition is supplied or already present in accumulated identity memory.",
    "A plausible detail is still invented. Do not infer physical props, occupants, motives, conflicts, or consequences from actions.",
'@ 'hard reality instruction'

Replace-Exact @'
    { numPredict: Math.min(2400, Math.max(900, lineTotal * 160)), temperature: protectedMemorial || sensitive ? 0.28 : 0.48 },
'@ @'
    { numPredict: Math.min(3000, Math.max(1100, lineTotal * 220)), temperature: protectedMemorial || sensitive ? 0.28 : 0.72 },
'@ 'model budget'

Set-Content -Path $path -Value $text -NoNewline -Encoding utf8
Write-Host "Mouth attention tuning applied: $path"
