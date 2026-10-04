# QRE PLAYOUT + MEDIA PLAN

**Status:** Playout v5 deterministic IMAGE + VIDEO composition implemented; frontend and smart media placement remain future
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

Implemented v5 TEXT + IMAGE + VIDEO contract:

```ts
type PlayoutTextItem = {
  kind: "TEXT";
  text: string;
  sourceSceneIndex: number;
  revealIndex: number;
  sourceEventIds: string[];
  durationMs: number;
};

type PlayoutImageItem = {
  kind: "IMAGE";
  mediaId: string;
  url: string;
  sourceEventIds: string[];
};

type PlayoutVideoItem = {
  kind: "VIDEO";
  mediaId: string;
  url: string;
  sourceEventIds: string[];
};

type PlayoutItem =
  | PlayoutTextItem
  | PlayoutImageItem
  | PlayoutVideoItem;

type ExperiencePlayout = {
  items: PlayoutItem[];
};
```

Current v5 composition is deliberately conservative:

```text
TEXT
IMAGE
VIDEO
```

This is not the final smart placement model. It exists so media primitives can enter Playout without giving Playout semantic authority.

## Media behavior

A user-supplied image/video is evidence-bearing presentation material.

Current v5 rules:

- do not reduce Author beat count just because media exists
- media is additive presentation evidence
- supplying media must not rewrite, suppress, or reduce Author text
- IMAGE composition must not change TEXT output
- VIDEO composition must not change TEXT or IMAGE output
- only canonical `MediaAsset` values may produce media Playout items
- only `type === "image"` may produce IMAGE
- only `type === "video"` may produce VIDEO
- preserve canonical media ID and URL exactly
- preserve only explicit supplied provenance
- never infer nearby Author provenance for media
- malformed or absent media provenance becomes `[]`
- preserve deterministic source order within each media type
- IMAGE items currently follow all TEXT items
- VIDEO items currently follow all IMAGE items
- IMAGE and VIDEO currently carry no invented caption, title, camera direction, narrative role, placement hint, or playback policy
- media composition must not call a model
- AUDIO remains outside current Playout output

Future media placement may use supported provenance/context to create rhythm, contrast, before/after payoff, or pause, but it must never create unsupported facts.

## Reveal splitting

Implemented v2 splitter:

- explicit Author line breaks
- sentence boundaries
- question/exclamation boundaries

The reconstruction rule is direct concatenation of reveal `text` values for the same `sourceSceneIndex` ordered by `revealIndex`. That reconstructed string must equal the original Author scene exactly.

The splitter avoids obvious abbreviation, decimal, and ellipsis period splits.

Future splitting may consider rhetorical short fragments, readability length, and supported media insertion points. Do not blindly split every period. Preserve rhetorical units when a sentence pair depends on immediate adjacency.

## Timing

Timing is a presentation decision.

Implemented v3 TEXT timing:

- base: 800 ms
- readable word: +190 ms
- question/exclamation ending: +180 ms
- ellipsis ending: +240 ms
- colon/semicolon: +120 ms
- clamp: 1100-4200 ms

Duration uses trimmed reveal text for measurement only; the stored reveal text remains unchanged for exact reconstruction.

IMAGE currently has no Playout-owned duration.

VIDEO currently has no Playout-owned duration, autoplay, mute, loop, trimming, thumbnail, caption, or narrative-role policy.

`MediaAsset.duration` exists in the shared media contract, but v5 does not yet treat it as canonical Playout timing authority.

Future timing can respond to media type, interaction, supported media metadata, and learned pacing. Do not encode presentation timing into Author cognition.

## Frontend responsibilities

Frontend/player should:

- consume ordered `PlayoutItem[]`
- advance/reveal without changing semantic content
- support pause/replay/skip as product decisions
- render TEXT, IMAGE, and VIDEO consistently
- eventually apply media playback policy
- report analytics at the reveal/item level while retaining links to Author beat/provenance

Frontend must not become a second Author.

## Not part of Playout

Playout must not:

- invent story meaning
- choose new facts
- weaken grounding
- run a second Author
- decide the rhetorical treatment from scratch
- rewrite lines merely to fit animation
- invent media provenance
- invent captions or titles from supplied media
- invent narrative roles for media
- invent camera direction
- infer semantic placement without supported evidence
- turn media metadata into new factual reality

If text is semantically wrong, fix Author.

If the text is right but paced badly, fix Playout.

If media is correct but placed badly, fix media composition.

## Current architecture

```text
AUTHOR
  grounded semantic scenes
      |
      v
PLAYOUT v1
  deterministic TEXT transport
      |
      v
PLAYOUT v2
  deterministic reveal splitting
      |
      v
PLAYOUT v3
  deterministic TEXT timing
      |
      v
PLAYOUT v4
  deterministic IMAGE composition
      |
      v
PLAYOUT v5
  deterministic VIDEO composition
      |
      v
FUTURE
  provenance-aware media placement
  media timing/playback policy
  frontend rendering
  item analytics
```

Author still owns the meaning of the experience.

Playout owns how that already-grounded meaning is presented.

Media enters after Author.

## Build order

1. Define `PlayoutItem` contract. Implemented for TEXT in `packages/contracts/src/playout/`.
2. Convert current final Author scenes/beats into TEXT items without behavior change. Implemented by deterministic Author scene -> TEXT transport.
3. Add sentence/fragment reveal splitting with deterministic tests. Implemented for line and sentence boundaries without rewriting text.
4. Add timing metadata. Implemented for deterministic TEXT reveal `durationMs`.
5. Add IMAGE items with provenance. Implemented with canonical `MediaAsset` identity/URL and truthful supplied provenance.
6. Add VIDEO items. Implemented with canonical `MediaAsset` identity/URL and truthful supplied provenance.
7. Add deterministic provenance-aware media placement/composition rules. Future.
8. Decide supported IMAGE/VIDEO timing and playback metadata. Future.
9. Wire frontend renderer. Future.
10. Add item-level analytics. Future.
11. Validate Coco before/after, Relationship multi-sentence beat, Housekeeping, Milo, and real estate.

## Current v5 invariants

1. Author meaning remains unchanged.
2. TEXT reveal content remains byte-for-byte unchanged.
3. TEXT ordering remains deterministic.
4. TEXT provenance remains unchanged.
5. TEXT timing remains deterministic.
6. IMAGE addition does not alter TEXT.
7. VIDEO addition does not alter TEXT.
8. VIDEO addition does not alter IMAGE.
9. IMAGE derives only from canonical `MediaAsset.type === "image"`.
10. VIDEO derives only from canonical `MediaAsset.type === "video"`.
11. IMAGE preserves canonical `mediaId`, `url`, and explicit supplied `sourceEventIds`.
12. VIDEO preserves canonical `mediaId`, `url`, and explicit supplied `sourceEventIds`.
13. Missing or malformed media provenance is not guessed.
14. IMAGE order is deterministic.
15. VIDEO order is deterministic.
16. Current conservative composition places TEXT first, IMAGE second, VIDEO third.
17. IMAGE has no invented presentation policy.
18. VIDEO has no invented presentation policy.
19. AUDIO does not produce a Playout item.
20. Media does not enter `AuthorBrainTruth`.
21. Media composition does not call a model.
22. Legacy Movie/Cinematic presentation ownership remains quarantined.
23. Smart media placement remains future work.
