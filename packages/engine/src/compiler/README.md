# QRE Universal Compiler

## STATUS
CANONICAL. This directory is the single compiler surface for customer-language experience creation.

## Canonical pipeline

`prompt → source evidence → world model → memory resolution → semantic event segmentation → evidence conservation → change/attention → creative hypotheses → ranked realization → ExperienceMoment[] → CinematicScene[]`

## Core law

**Universal prompting does not mean universal vocabulary. It means universal reasoning over whatever the prompt actually contains.**

The compiler reasons over open-ended reality primitives:

- entities
- events
- states
- relationships
- places
- times
- emotions
- media/context
- source evidence

No industry, business, animal, relationship, wedding, horror, comedy, service, event, or government-specific compiler is allowed here.

## Reality conservation

Source facts are preserved before creative interpretation.

Observed prompt evidence outranks derived interpretation. Creative language is presentation, not factual evidence. Semantic directives are never customer-facing facts.

## Semantic event segmentation

A single human sentence may contain multiple kinds of reality.

The splitter recognizes both action events and state/history events.

Examples:

- `Coco came in, loved the bath, stole a bow, and went home.`
- `Alex and Sam went back to the restaurant and stayed until closing.`
- `Maria cleaned the kitchen and bathrooms, then the living room surrendered.`
- `This blue teapot has been in our family for forty years and appeared at every Thanksgiving.`

A memory does not need a conventional action verb to become a useful experience sequence. Historical state (`has been`, `was`, `remained`, etc.) is itself meaningful evidence.

Semantic segmentation must remain universal and evidence-based. It must not become a domain-specific parser.

## Evidence conservation during realization

Creative realization is not allowed to discard important source anchors merely because a more poetic candidate exists.

High-value event evidence includes:

- explicit participant/entity
- explicit object/artifact
- explicit place
- explicit time/date
- explicit temporal endpoint such as `until closing`
- explicit relationship or recurrence
- explicit historical duration such as `for forty years`

A creative candidate that loses a high-value anchor is rejected or heavily penalized in ranking. Creativity must elaborate reality, not erase it.

## Memory-aware cognition

Before asking the user for missing information, the compiler checks available context and memory.

Examples:

- known unique place → resolve automatically
- multiple plausible places → ask one targeted question
- no usable place → ask where
- known participant/entity → reuse it rather than asking again

**Ask for missing reality. Never ask the user to invent the creativity.**

## Creative law

Tone is a lens, not vocabulary.

Comedy, horror, romance, dark, wild, cinematic, or any future lens must alter the performance of the same underlying reality rather than replace reality with a template.

The creative engine should search for:

- contrast
- agency
- surprise
- escalation
- transformation
- relationship significance
- memorable details
- callbacks
- unusual consequences
- strong closing images

Generic reusable sentence families are actively penalized.

## Anti-robot law

Do not turn every object into the same joke.

Do not repeatedly use:

- `approached ...`
- `compensation ...`
- `negotiating terms ...`
- generic `arrived with opinions ...`
- generic `the moment became ...`
- generic `the story moved ...`

A creative line must earn its place from the event's actual evidence and causal meaning.

## Memory / continuity

The compiler may resolve references such as:

- back
- again
- returned
- same place
- there
- later
- after
- before

from known context and memory.

The same mechanism must support pets, people, relationships, businesses, events, objects, places, physical QR art, tickets, and future entity types.

## Runtime boundary

`ExperienceMoment` is the canonical experience atom.

The retired root `Moment` contract is not part of the canonical compiler surface.

The compiler must not create a parallel runtime architecture.

## Learning / adaptation

The compiler can emit:

- adaptive questions
- discoveries
- memory resolutions
- creative signals
- provenance
- lens information

Persistence belongs outside the pure engine. Future compilations can feed learned creative preferences and accumulated world memory back through compiler context.

## Documentation rule

**Every meaningful cognitive/compiler upgrade must update this README in the same change.**

Document the new reasoning behavior, invariants, migration decisions, and acceptance expectations so the architecture does not have to be rediscovered later.

## Acceptance gate

Primary gate:

`pnpm --filter @qre/engine test:universal-mind`

A compiler change is not accepted merely because TypeScript builds. The generated experience must preserve source reality, form a meaningful sequence, avoid cognitive leakage, conserve high-value time/place/relationship/history evidence, use memory correctly, and demonstrate genuinely different creative performance when the lens changes.
