# QRE MOUTH · PRODUCTION CHANGELOG

## 2026-08-20 · Universal Mouth Hardening Pass

### Checkpoint

Production work is being developed on:

```text
audit/mouth-production-sync
```

The synchronized checkpoint immediately before this pass is the hardened canonical Mouth pipeline. Subsequent commits on this branch are part of the same production line.

### Changes in this pass

- `authorSequenceArcGate.ts`
  - terminal `payoff` / `release` / `consequence` beats now use a dedicated landing contract;
  - terminal beats are not penalized for failing to behave like middle transitions;
  - terminal finality and payoff linkage now contribute directly to terminal meaning quality.

- `authorMouthSequenceBeamSearch.ts`
  - exact duplicate non-terminal language is blocked inside a path;
  - evidence reuse remains legal when the candidate advances evidence or meaning;
  - beam scoring keeps weak-but-legal candidates available for global comparison;
  - **trajectory compression is now active:** a non-terminal candidate pool may be skipped when no distinct legal realization advances the accumulated path;
  - the final pool is never skipped when an exact approved endpoint is available;
  - compression never creates or permits invented reality.

- `authorCutPolicy.ts`
  - terminal payoff/release/consequence lines are exempt from middle-beat `known-fact-restatement`, repetition, and frontier-starvation rules;
  - truth/invention/explanation protections remain active;
  - supplied ending facts can legally land as the approved terminal payoff.

- `docs/MOUTH_PRODUCTION_MANIFEST.md`
  - canonical ownership, legacy quarantine, production invariants, diagnostics, and replay strategy documented.

- `docs/MOUTH_PRODUCTION_REPLAY_MATRIX.md`
  - universal cross-domain acceptance matrix and anti-overfitting rule documented.

### Realization viability law

```text
ENOUGH DISTINCT LEGAL REALITY
    -> KEEP THE CUT

INSUFFICIENT DISTINCT REALIZATION VALUE
    -> COMPRESS THE TRAJECTORY

NEVER
    -> INVENT FACTS TO FILL A REQUESTED BEAT COUNT
```

The requested number of beats is therefore treated as a target, not permission to manufacture repeated language. A trajectory that cannot support five distinct legal cuts should become a shorter, stronger trajectory instead of five fake captions.

### Legacy rule

Older Mouth implementations and Enterprise Mouth orchestration remain reference/diagnostic material only unless explicitly revalidated. They must not become a second production Author path.

### Testing rule

The dog grooming fixture remains a canonical acceptance fixture, but it is not the definition of universality. A fix is production-ready only when the same invariant survives unrelated domains.

### Next production layer

The production Beam now has the first realization-viability/compression mechanism. Next acceptance must verify that rich prompts such as the Coco fixture naturally retain distinct supplied evidence when it is available, while genuinely sparse trajectories compress cleanly rather than duplicating language.
