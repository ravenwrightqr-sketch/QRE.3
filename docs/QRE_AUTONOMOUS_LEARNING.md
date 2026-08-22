# QRE Autonomous Learning

QRE learns from real use without requiring the owner to manually judge every generated experience.

## What QRE observes

Runtime analytics already records scans, completions, abandonment, errors, replays, saves, shares, CTA clicks, payments, rewards, and memory-selection behavior.

## What QRE stores about creative work

Experience records carry lightweight learning metadata such as the selected lens, prompt shape, detected prompt signals, generative-author use, memory awareness, and related learning profile data.

## How learning becomes useful

Behavioral learning groups comparable experiences and calculates outcome pressure from completion, positive actions, abandonment, and errors. The resulting winners/weaknesses flow into `IdentityState.creativeLearning` and then `CognitiveAuthorContext.creativeLearning`.

The author now consumes that existing state through `authorCreativeLearningPressure.ts`.

```text
outcome
→ AnalyticsRepository
→ autonomousLearning
→ IdentityState
→ CognitiveAuthorContext
→ learned creative pressure
→ existing lens competition
→ next Mouth realization
```

The pressure is deliberately soft. It does not replace the existing lens engine and does not create a new brain.

### Selection rules

- A learned lens may strengthen a neutral/default authoring choice.
- An explicit non-neutral user lens request outranks learned preference.
- Rejected or avoided lenses cannot become learned winners.
- Creative learning can influence framing/selection but cannot create factual reality.
- Reality/provenance remain governed by the existing truth packet and Provenance Gate.

## Privacy boundary

Behavioral learning remains scoped to the authenticated user's owned/account assets. One identity's private learning must not become another identity's private preference.

## Human feedback

Explicit creative feedback remains higher-value evidence than weak behavioral observation, but QRE can continue learning from normal use without requiring manual review of every experience.

## Current acceptance

```powershell
pnpm --filter @qre/api author:adaptive-learning
```

This proves the consumer bridge: learned creative state changes next lens selection, explicit intent still wins, rejected-only learning does not create a preference, and the supplied reality packet remains unchanged.

## Remaining full-loop proof

The system still needs the end-to-end acceptance:

```text
Movie A
→ real runtime outcome
→ behavioral learning
→ IdentityState / CognitiveAuthorContext
→ Movie B materially changes
```

That proof is required before the adaptive loop is considered complete.

## Future training boundary

This layer changes future authoring context. It does not fine-tune model weights. A later training pipeline can consume the accumulated accepted/rejected/outcome dataset without changing the runtime truth architecture.
