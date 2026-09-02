# QRE Author · Satanico Inference Space

## Purpose

Satanico is the semantic subsystem whose job is not to invent a story, but to discover what a human observer could reasonably infer from supplied reality without QRE stating the conclusion.

The canonical path is:

`RealityGraph → inference opportunities → candidate movie search → sequence → thesis/objective → Mouth`

RealityGraph remains the source of truth. Latent movie candidates and observer objectives are derived cognition only.

## Core question

> What can these real facts make a human believe without QRE telling them?

This is different from generic creativity, summarization, or trope matching.

## Opportunity families

Satanico currently searches for:

- preference constellations
- invariants / persistence
- origin-to-outcome relationships
- callbacks / recontextualization
- contrast
- state transformation
- relational role
- heterogeneous convergence

These are search mechanisms, not a closed list of intelligence. The scoring substrate is relationship-based so additional opportunity families can be added without creating a second cognition engine.

## Design law

Prefer the smallest concrete supplied evidence set that supports the largest meaningful human inference.

Reward:

`GROUNDING + RELATIONAL STRENGTH + LATENT INTERPRETABILITY + OBSERVABILITY + RECONTEXTUALIZATION + UNRESOLVED SPACE`

Penalize:

`EXPLANATION + RESTATEMENT + OBVIOUSNESS + INVENTION + TRUTH RISK`

## Fido golden behavior

Supplied:

- Fido is a Pomeranian
- Fido loves walks
- Fido loves small dogs
- Fido loves Cheetos

Desired behavior:

1. Preserve the supplied evidence.
2. Discover a preference constellation.
3. Allow the observer to form a character inference.
4. Never emit a concrete conclusion such as a personality label that was not supplied.

The final cinematic realization may expose the evidence through timing, selection, recurrence, juxtaposition, and compression. The observer performs the last semantic step.

## Universalization

The same machinery is intended to work for animals, people, relationships, businesses, objects, places, events, memories, return visits, and future graph expansions such as city and crossed-path experiences.

Domain-specific expansions must enrich RealityGraph evidence or search opportunities; they must not create parallel author brains.

## Acceptance commands

Build:

```powershell
pnpm --filter @qre/contracts build
pnpm --filter @qre/api build
```

Core inference acceptance:

```powershell
pnpm --filter @qre/api author:satanico
```

Universal relational/convergence acceptance:

```powershell
pnpm --filter @qre/api author:satanico:universal
```

The acceptance suite must verify grounding, inference potential, preservation of supplied evidence, and absence of explicit observer-conclusion leakage.
