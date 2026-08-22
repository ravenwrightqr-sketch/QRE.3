# Super Cog Acceptance Matrix

This is the compact operating map for the Author/Mouth acceptance surface.

## Core compiler

| Test | Purpose | Mode | Truth requirement |
|---|---|---|---|
| `author-acceptance-suite.ts` | Cross-domain baseline Author behavior | mixed | supplied reality is authoritative |
| `author-cognitive-state-acceptance.ts` | Cognitive State existence + chronology | cognition | source order is immutable |
| `author-living-memory-acceptance.ts` | Sparse personal memory → living text-movie | living memory | interpretation allowed; facts immutable |
| `author-pet-social-acceptance.ts` | Structured pet facts → personality/social movie | pet social | personality must derive from supplied traits |

## Business/service direction

Business/service inputs are entered by the business or operator themselves. QRE organizes and realizes that supplied data; it does not infer ownership, tenancy, customer identity, or relationships that were not supplied.

Examples that should eventually become separate acceptance cases:

- housekeeping service
- hotel
- pet grooming
- restaurant
- real estate
- mechanic
- law firm
- barber/salon
- event service

The same cognitive machinery should operate across them while the domain/world model changes.

## Truth modes

### Living memory / pet social / promotional media

Allowed:

- grounded interpretation
- emotional framing
- metaphorical realization
- lens pressure
- changed emphasis
- retrospective meaning

Forbidden:

- invented facts
- invented people
- invented objects
- invented places
- invented relationships
- invented dialogue
- invented physical evidence
- invented literal events
- altered chronology

### Exact business/data mode

The source data remains exact. Creative treatment is opt-in and downstream from the exact record.

## Target architecture

```text
SUPPLIED DATA
    ↓
REALITY MODEL
    ↓
DOMAIN / ENTITY MODEL
    ↓
EVENT RELATIONSHIPS
    ↓
COGNITIVE STATE
    ↓
COMPETING MOVIES
    ↓
TRAJECTORY SEARCH
    ↓
ONE WINNING MOVIE
    ↓
OPTIONAL LENS
    ↓
ONE MOUTH REALIZATION
    ↓
TRUTH / CHRONOLOGY / QUALITY GATE
    ↓
TEXT-MOVIE
```

## Operating rule

Add a new acceptance test when a new product behavior becomes important. Do not create a new creative brain for each domain.
