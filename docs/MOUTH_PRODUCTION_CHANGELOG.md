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
  - beam scoring keeps weak-but-legal candidates available for global comparison.

- `authorCutPolicy.ts`
  - terminal payoff/release/consequence lines are exempt from middle-beat `known-fact-restatement`, repetition, and frontier-starvation rules;
  - truth/invention/explanation protections remain active;
  - supplied ending facts can legally land as the approved terminal payoff.

- `docs/MOUTH_PRODUCTION_MANIFEST.md`
  - canonical ownership, legacy quarantine, production invariants, diagnostics, and replay strategy documented.

- `docs/MOUTH_PRODUCTION_REPLAY_MATRIX.md`
  - universal cross-domain acceptance matrix and anti-overfitting rule documented.

### Legacy rule

Older Mouth implementations and Enterprise Mouth orchestration remain reference/diagnostic material only unless explicitly revalidated. They must not become a second production Author path.

### Testing rule

The dog grooming fixture remains a canonical acceptance fixture, but it is not the definition of universality. A fix is production-ready only when the same invariant survives unrelated domains.

### Next production layer

The next architectural target is realization viability / trajectory compression: if the approved semantic trajectory cannot be realized as distinct legal lines, QRE must repair or compress the trajectory rather than manufacture duplicate captions.
