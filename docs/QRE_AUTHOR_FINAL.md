# QRE Universal Author — Final

STATUS: CANONICAL
ROLE: Final governance contract for the Universal Author creative boundary.

QRE is a universal entity-centric cognitive experience system. The Author is not a product vertical, story writer, or database. It is the creative device that finds the latent experience inside supplied world reality and projects it into the existing runtime.

## Single authority model

```text
INPUT / MEDIA / GEO / MEMORY
          ↓
   Reality Graph
          ↓
      Cognition
          ↓
   ONE selected Movie
          ↓
    Movie Judge
          ↓
     Creative Mouth
          ↓
 Pure Visible-Art Judge
          ↓
    Story / Sequence
          ↓
 Experience Composition
          ↓
        Runtime
          ↓
   New world evidence
          ↺
```

There is one Reality authority, one Cognition authority, one Movie selection authority, one creative Mouth, one pure visible-art judgment boundary, one experience-composition boundary, one runtime projection boundary, and one persistent world-memory substrate. No competing Author path may select a second semantic truth or emit a competing customer-facing creation.

## Reality

Reality consists of explicit entities, events, states, relations, places, times, evidence, media, provenance, confidence, and uncertainty. Derived interpretation never becomes factual merely because it is useful creatively.

Source evidence outranks interpretation. A figurative realization may be imaginative while remaining anchored to supplied evidence. New concrete people, places, actions, reactions, events, outcomes, dialogue, sensory facts, or chronology are forbidden unless supplied.

The permanent distinction is:

```text
FACTUAL TRUTH: IMMUTABLE
CLIENT WORDING: NOT IMMUTABLE
ARTISTIC WORDING: FREE WITHIN THE REALITY BOUNDARY
```

QRE protects what happened, not the exact sentence used to report it. A supplied fact such as `Coco stole an apple from the counter` may be artistically compressed to `Apple acquired.` The latter changes form without changing the fact. A final interpretive phrase such as `Sudden ecstasy.` may express an earned felt reading without becoming a new factual claim about the subject's hidden state.

## Cognition

Cognition reasons over arbitrary domains. It discovers relationships, change, recurrence, temporal context, continuation, attention opportunities, significance, and creative hypotheses. It searches multiple possible Movies and selects exactly one.

The central semantic contract is:

```text
FACT
  ↓
RELATIONSHIP
  ↓
CHANGE IN WHAT THE VIEWER NOTICES
  ↓
PAYOFF / FELT LANDING
```

The relationship must be earned from supplied reality. Lenses may intensify a grounded relationship but may not manufacture one. Sparse reality is valid; Cognition may choose a distinctive observation or another natural experience form instead of inventing plot.

### Model Movie contract

The local model may return a Movie as either canonical `trajectory[]` or compact `cuts[]`. Both are structural proposals only. QRE normalizes them against the RealityGraph, preserves only existing event IDs, and derives multi-event operations only from relationships already present in that graph. `selectedMovieId` is honored when the proposed Movie survives grounding; it is not silently discarded in favor of a deterministic fallback.

A compact model Movie is therefore not a second semantic authority. It is a candidate structure entering the same grounded Movie competition as other candidates.

## Movie selection versus visible art

The latent Movie is an internal semantic proposal, not the final customer-facing artifact.

The Movie Judge decides whether that proposal is sufficiently grounded, specific, distinctive, non-generic, and semantically progressive to become visible.

The Creative Mouth performs the selected Movie. Artistic freedom is deliberately broad: compression, juxtaposition, implication, irony, understatement, status, rhythm, metaphor, personification, callback, reversal, interruption, omission, grammatical transformation, emotional abstraction, and other artistic devices are allowed when they remain inside the reality boundary.

The Pure Visible-Art Judge examines the actual visible film after Mouth. It judges the artifact itself. No latent Movie score, domain fit, prior-film novelty, subject preference, or other upstream score may rescue weak visible art at this boundary.

## Cognition-to-Mouth boundary

Cognition may reason using internal prose, but that prose is not the artist's creative seed. The Mouth receives structured creative intent: supplied evidence, selected event IDs, grounded relationship kinds, and permissible structural operations. It must not receive cognition's explanatory hypothesis, payoff narration, viewer-change prose, or other internal commentary as wording authority.

The artist does not copy the client's sentence. The artist preserves the underlying fact while deciding the visible grammar. Source words are raw material, not a required script.

The artist owns visible language, rhythm, cuts, omissions, repetitions, collisions, transformations, and the final landing. The subject is a factual referent only, not a required grammatical anchor. A film may name the subject when reality genuinely calls for it, but subject identity must never become the universal narrative voice.

## Artist Device

The Artist Device has one deliberate asymmetry:

```text
CONCRETE REALITY: HARD BOUNDARY
INTERPRETIVE ART: WIDE OPEN
```

A concrete pre-landing cut retains provenance to supplied reality, but its wording does not have to lexically repeat the source. The final cut may leave the source vocabulary and become a free artistic or emotional interpretation when the preceding material earns it.

For example:

```text
Grooming.
Apple acquired.
Sudden ecstasy.
```

This is a model of the desired artistic operation, not a mandatory script. The system must discover the corresponding artistic transformation from each world rather than reproduce this example everywhere.

The Artist Device must not use one fixed literary or cinematic template across domains. Different worlds may demand radically different structures. The mechanism is discovered from the supplied reality; it is not imposed by domain, subject, or lens.

## Artist quality boundary

Grounded is necessary but insufficient. Literal transcription is also a failure mode.

The Pure Visible-Art Judge evaluates:

- concrete grounding without requiring source-sentence copying
- visible relational bridge
- change in attention
- artistic transformation versus literal replay
- form and rhythm
- economy
- interpretive landing
- absence of unsupported concrete invention
- absence of explanation
- resistance to caption-reel grammar

A film that merely repeats supplied sentences is not Gold even when every sentence is factually correct.

## Story and sequence

A fact may be true and still deserve zero authored language. A rich reality may justify many beats. A thin reality may justify only a few. There is no universal beat count.

There is no mandatory `hook → develop → turn → payoff` template. Sequence length is earned by semantic value, not by an arbitrary duration target and not by the number of facts or media items.

The Author must not collapse into a caption generator, event checklist, timestamp reel, receipt, recap, or source-text transcription. Event-by-event coverage is acceptable only when the ordering itself is meaningful.

A film should make the supplied reality newly interesting. The target is not explanation. The target is a felt experience in which a detail can suddenly become charged, strange, funny, ecstatic, tender, absurd, ominous, or otherwise resonant when the relationship earns it.

## Experience additions are additive

Photos, video, geo, timestamps, maps, receipts, links, attachments, actions, and similar materials are first-class experience additions. They may appear before, between, after, or alongside story material without consuming the story's semantic capacity.

Presentation additions never cause Cognition to choose a shorter Movie. User-controlled reordering of additions must not mutate reality or the selected semantic Movie.

## Memory and learning

Memory is a world model, not stored creative prose. Persistent memory retains entities, facts, relationships, events, places, time, media, provenance, uncertainty, participation, and durable preferences.

Return visits resolve remembered history before asking a human for information. New evidence changes the world; creative wording changes presentation only.

Learning may adapt creative preference, pacing, novelty pressure, lens preference, or other bounded performance choices. It must never mutate reality or create domain-specific cognition.

## Universal UX

The dashboard should accept whatever reality the user knows. The interface must not require a rigid story form before QRE can understand the input.

QRE may ask one high-value missing concrete detail at a time. Users never need to understand Movie, Frame, RealityGraph, Cognition, Lens, Mouth, or governance mechanics. Users should never be asked to invent the joke, ending, arc, tension, or artistic performance.

## Canonical file governance

The connected Author path is:

```text
apps/api/src/services/authorRealityGraph.ts
apps/api/src/services/authorCognition.ts
apps/api/src/services/authorCognitionUniversal.ts
apps/api/src/services/authorCognitionIntelligence.ts
apps/api/src/services/authorMetamorphicSearch.ts
apps/api/src/services/authorCreativeSpine.ts
apps/api/src/services/authorCreativeRealizer.ts
apps/api/src/services/authorRealizedFilmJudge.ts
apps/api/src/services/authorExperienceJudge.ts
apps/api/src/services/authorSemanticGate.ts
apps/api/src/services/authorBrainCanonical.ts
```

These are one connected system. Runtime, persistence, scan, delivery, generic learning, and compiler infrastructure remain outside the Author semantic authority and are consumed through governed interfaces.

Legacy paths must never become alternate semantic authorities.

## Testing

Acceptance tests the actual visible artifact, not merely internal metadata.

Required coverage includes reality conservation; participant, place, time, and relationship conservation; grounded relationship discovery; competing Movie hypotheses; model `cuts[]` ingestion; Movie-level judgment; visible-film grounding; visible relational bridging; attention progression; artistic transformation; literal source-copy rejection; free artistic/emotional landing; invented-middle rejection; explanation and compiler leakage rejection; caption-reel rejection; subject-as-narrator collapse rejection; cross-domain structural diversity; memory continuity; return continuation; additive context handling; and learning without reality mutation.

The realized-film acceptance fixture explicitly proves the distinction between factual preservation and artistic transformation by rejecting literal source replay while accepting a grounded transformed film such as `Apple acquired.` followed by an earned interpretive landing.

The superintelligence lab must print the complete artifact before assertions so creative failures are inspectable. The lab is not allowed to lower thresholds to make a model pass; failures are evidence for improving the Artist Device.
