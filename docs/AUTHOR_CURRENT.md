# QRE AUTHOR · CURRENT TRUTH

**Status:** canonical current Author reference
**Branch:** `fuck-you-bitch-is-awake`
**Checkpoint:** `e2971c82` — `fix(author): preserve expressive realizations through synthesis`
**Updated:** 2026-10-03

## Product contract

QRE Author turns supplied reality into a short moving-text experience without inventing the world.

Core law:

> Reality is closed. Discourse is open.

Author may interpret, compress, reframe, compare, imply, joke, characterize, and create rhetorical worlds. It may not invent unsupported physical actions, people, places, outcomes, chronology, quantities, motives, causes, diagnoses, or persistence.

Grounding is provenance, not paraphrase. Protect the strange; police the facts.

## Current pipeline

```text
supplied reality / provenance
  -> creative discovery / derived meaning
  -> neutral structure / beat plan
  -> expressive production search (A/B/C + factual D control)
  -> claim/authority checks
  -> authorized-realization pool
  -> deterministic assembler
  -> model-backed synthesizer
  -> synthesis authority / eligibility
  -> whole-production selection
  -> canonical grounding
  -> Author scenes / cuts
```

Memory and Identity now share the production-major Mouth topology in source: A/B/C expressive productions plus deterministic D fallback, followed by whole-production selection. Identity retains its Identity-specific semantics and deterministic cluster plan when useful; live cross-case validation still needs to be refreshed after this change.

## What is proven working

- Closed-world factual grounding while allowing rhetorical language.
- Open-discourse interpretation such as figurative, generalized, sideways, humorous, status, implication, and recontextualization moves when grounded.
- A/B/C production search with variable-length outputs and a factual D control.
- Authorized Realization Pool salvages strong material across losing productions.
- Deterministic assembler can combine strong authorized meanings across productions.
- Synthesizer can write fresh language from authorized meanings rather than merely copying a source production.
- Protected expressive realizations prevent later synthesis from replacing a stronger discovered attitude with factual recap.
- Canonical authority can reject a creative synthesis and safely fall back to a valid production.
- Variable Author sequence lengths are valid. Current validation produced 1, 4, 5, and 6 semantic Author beats across cases; there is no global target count.
- One Author beat may contain multiple short sentences. That is a semantic unit, not necessarily one future frontend reveal.

## Moving-text doctrine

QRE is a phone-first moving-text experience.

Sequence length is earned.

Do not optimize for:
- 4 beats
- 5 beats
- 6 beats
- fewest lines
- most lines
- full event coverage

Optimize for progressive meaning, phone readability, rhythm, tension, contrast, attitude, surprise, character, implication, humor, payoff, and optional aftershock.

A conceptually small observation may deserve several beats. A factually dense record may deserve very few.

Setup is good when it creates anticipation, contrast, rhythm, character, or makes a later payoff stronger. Setup is bad when it merely replays facts.

## Author beat vs frontend reveal

Do not equate Author beat count with screen count.

```text
Author beat = semantic / creative unit
Text reveal = viewer pacing unit
```

Example Author beat:

`Nervous before meeting Alex. Not a warning. A threshold.`

Future Playout may reveal it as three timed text items while preserving it as one semantic Author beat.

## Creative treatment / lens doctrine

A treatment changes the rhetorical world, not factual reality.

This is intentionally universal and optional.

Examples of possible treatment behavior:
- housekeeping -> GAME / SYSTEM / RITUAL / NOIR when earned
- moving service -> SPY / HEIST / MISSION when earned
- grooming -> COURTROOM / REBELLION / STATUS when earned
- real estate -> NOIR / HEIST / STATUS / COMPETITION when earned

Do not hardcode those domain mappings. The same service may deserve a different treatment on a different record.

Target behavior:

```text
supplied reality
  -> eligible treatments
  -> deterministic selection under current rules
  -> expressive production search
  -> grounding
  -> synthesis preserves the selected treatment / stance
```

Default future preference should be `AUTO`. A creator may later request an explicit treatment, but a requested treatment may not fabricate supporting events. If it cannot stay grounded, lighten it or fall back.

Important universal law:

> Author may transform the rhetorical world of a service, but not the factual world of the service.

## Subject / participant law

- Who exists is supplied/persistent world truth.
- Who may appear is permission/presentation policy.
- Who stars is an Author decision based on the material.
- A DB role is not automatically the narrative star.
- Category-level commentary is allowed when it does not introduce a new specific participant.

## Private cognition law

Private cognition is internal understanding, not draft copy.

The model may privately discover many conceptions. Mouth/production writing happens after understanding them. Do not force public output to copy analytical wording.

## Camera / presentation law

Rhetorical camera-world language is allowed when it is language, not an operating instruction.

Allowed examples include constructions like a house “getting its close-up” or a porch “stealing the spotlight.”

Directorial machinery such as `cut to`, `fade to`, `camera pans`, `zoom in`, `final shot`, `we see`, `INT/EXT`, or explicit camera commands is rejected.

Do not reopen camera rules without new failing evidence.

## Things Author must NOT do

- Invent unsupported concrete reality.
- Restore omitted events merely for completeness.
- Treat source event coverage as sequence quality.
- Flatten a strong authorized expressive realization into recap.
- Hardcode Coco, grooming, housekeeping, moving, real estate, or any other domain into universal prompt logic.
- Feed favorite finished lines back into production prompts.
- Force all outputs to the same number of beats.
- Make every Author sentence its own semantic beat solely for frontend animation.
- Let a lens introduce literal genre events.
- Weaken provenance or authority to rescue creative output.

## Current validated examples

See `author-validation-20261003.md` for the full captured matrix.

Representative final behavior included:
- Coco: 6 semantic beats; expressive synthesis survived.
- Housekeeping: strong expressive material is now protected from factual flattening by source/regression changes committed at `e2971c82`.
- Relationship: a valid single semantic beat can contain several reveal-worthy short sentences.
- Milo Memory: variable multi-beat progression.
- House / real estate: rhetorical runway/takeoff language grounded in supplied timing.
- Milo Identity: rhetorically valid output in the prior run; source now routes Identity through production-major Mouth/selection, with refreshed live validation pending.

## Deterministic gates currently green

- `apps/api/author-cut-floor-regression.mjs`
- `apps/api/author-creative-search-prompt-regression.mjs`
- `apps/api/author-memory-variable-productions-regression.mjs`
- `scripts/verify-author-wiring.mjs`
- `scripts/verify-author-production-gate.mjs`
- `scripts/verify-author-wow-architecture.mjs`
- `apps/api/author-authorized-realization-assembly-regression.mjs`
- `apps/api/author-identity-production-major-regression.mjs`
- `git diff --check`

## Current infrastructure notes

OpenRouter validation used `openai/gpt-5.4-mini`. Local Ollama model IDs such as `gemma3:12b` are not valid OpenRouter IDs. New-account OpenRouter rate limiting observed: 20 requests/minute for this model; 429s are infrastructure-invalid evidence, not Author failures.

## Definition of done for Author

Author is done enough to hand off to Playout when:
- Memory and Identity share the intended production-major writing/selection architecture and pass deterministic topology guards.
- Creative treatment can be selected/preserved universally without literal invention.
- Strong discovered expressive meaning survives all later stages unless rejected for truth.
- Variable semantic sequence length remains earned.
- Deterministic regressions protect those laws.

Then presentation timing, sentence reveals, images, video, and media placement belong outside Author in `ExperiencePlayout` / `SequenceComposer`.
