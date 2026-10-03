# QRE PLAYOUT + MEDIA PLAN

**Status:** next-layer architecture; not yet implemented
**Branch:** `fuck-you-bitch-is-awake`
**Updated:** 2026-10-03

## Separation of concerns

Author owns meaning.

Playout owns presentation.

Media joins Playout; it does not shrink Author.

```text
FINAL AUTHOR BEATS
  + supplied media / provenance
  + pacing rules
  -> ExperiencePlayout / SequenceComposer
  -> ordered viewer-facing items
  -> frontend renderer
```

## Semantic beat vs reveal

An Author beat is a semantic unit.

A reveal is a timed viewer-facing unit.

One Author beat may become one reveal or several.

Example Author beat:

`Nervous before meeting Alex. Not a warning. A threshold.`

Possible reveals:

1. `Nervous before meeting Alex.`
2. `Not a warning.`
3. `A threshold.`

This is presentation splitting, not Author rewriting.

## Proposed item model

Conceptually:

```ts
type PlayoutItem =
  | {
      kind: "TEXT";
      text: string;
      sourceBeatIndex: number;
      sourceEventIds: string[];
    }
  | {
      kind: "IMAGE";
      mediaId: string;
      sourceEventIds: string[];
    }
  | {
      kind: "VIDEO";
      mediaId: string;
      sourceEventIds: string[];
    };
```

The final contract may differ, but keep the semantic separation.

## Media behavior

A user-supplied image/video is evidence-bearing presentation material.

Example Coco experience:

```text
TEXT   Nervous first.
IMAGE  before photo
TEXT   Then came the bow.
TEXT   The bow? No.
TEXT   Coco made that clear.
TEXT   So much for decoration.
IMAGE  after photo
TEXT   Happy came later.
```

Six Author beats + two supplied images may naturally become eight viewer-facing items. At roughly two seconds each that is still a compact phone experience; timing must remain adaptive rather than fixed.

Rules:
- do not reduce Author beat count just because media exists
- media placement follows supported context/provenance
- Playout may omit redundant media
- media may create rhythm, contrast, before/after payoff, or pause
- media must not create unsupported facts

## Reveal splitting

Initial splitter may consider:
- explicit Author line breaks
- sentence boundaries
- rhetorical short fragments
- question/exclamation boundaries
- readability length
- nearby media insertion points

Do not blindly split every period. Preserve rhetorical units when a sentence pair depends on immediate adjacency.

## Timing

Timing is a presentation decision.

Starting tendencies only:
- very short text: around 1–2 seconds
- ordinary short text: around 2 seconds
- longer thought: longer
- image: enough time to register
- video: media-defined duration or bounded excerpt

Future timing can respond to line length, punctuation, media type, interaction, and learned pacing. Do not encode timing into Author cognition.

## Frontend responsibilities

Frontend/player should:
- consume ordered `PlayoutItem[]`
- advance/reveal without changing semantic content
- support pause/replay/skip as product decisions
- render text, image, and video consistently
- report analytics at the reveal/item level while retaining links to Author beat/provenance

## Not part of Playout

Playout must not:
- invent story meaning
- choose new facts
- weaken grounding
- run a second Author
- decide the rhetorical treatment from scratch
- rewrite lines merely to fit animation

If text is semantically wrong, fix Author. If the text is right but paced badly, fix Playout.

## Build order

1. Define `PlayoutItem` contract.
2. Convert current final Author scenes/beats into TEXT items without behavior change.
3. Add sentence/fragment reveal splitting with deterministic tests.
4. Add timing metadata.
5. Add IMAGE items with provenance.
6. Add VIDEO items.
7. Add deterministic placement/composition rules.
8. Wire frontend renderer.
9. Add item-level analytics.
10. Validate Coco before/after, Relationship multi-sentence beat, Housekeeping, Milo, and real estate.
