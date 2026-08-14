# Compiler Realizer Boundary

These modules are NOT customer-language authorities for the cognitive experience compiler.

The active final prose authority is:

- `universalExperienceRealizer.ts`

The active orchestration boundary is:

- `cognitiveExperienceCompiler.ts`

`experienceCompilerV16.ts` remains an artifact substrate only.

The following older realization families should be treated as LEGACY unless a future change explicitly restores them behind the universal realizer boundary:

- `enterpriseEvidenceRealizer.ts` — deleted
- `cognitiveRealizationGuard.ts` — no longer used for final prose
- `premiseRealizer.ts` — no longer used for final prose
- `goldNarrativeRealizer.ts` — legacy narrative templates
- `narrativeAttentionRealizer.ts` — legacy narrative templates
- `creativeRealizerV7.ts` — legacy versioned realizer
- `creativeRealizerV8.ts` — legacy versioned realizer
- `creativeRealizerV9.ts` — legacy versioned realizer
- `creativeRealizerV10.ts` — legacy versioned realizer
- `transformationEngine.ts` — legacy transformation/template family

Do not import these into `cognitiveExperienceCompiler.ts` to "improve" a sentence. That reopens the old template authority problem.

Do not touch scan, runtime, delivery, repositories, analytics, payments, or DB code as part of this prose compiler boundary.
