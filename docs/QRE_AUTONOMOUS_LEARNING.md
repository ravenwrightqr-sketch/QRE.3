# QRE Autonomous Learning

QRE learns from real use without requiring the owner to manually judge every generated experience.

## What QRE observes

Runtime analytics records scans, completions, abandonment, errors, replays, saves, shares, CTA clicks, payments, rewards, and memory-selection behavior.

## Canonical outcome taxonomy

Runtime event names come from `@qre/contracts` `AnalyticsEventTypes`. API learning normalizes them once in:

`apps/api/src/services/authorOutcomeLearning.ts`

Current classification:

```text
positive → FLOW_COMPLETE / EXPERIENCE_REPLAY / EXPERIENCE_SAVED / EXPERIENCE_SHARED / CTA_CLICK / PAYMENT_COMPLETED / MEMORY_RECOMMENDATION_SELECTED
negative → FLOW_ABANDON / ERROR
neutral  → other observed events such as SCAN / SESSION_START
```

The normalized result is the canonical cross-layer `AnalyticsOutcomeKind` contract type. This keeps outcome meaning from drifting across learning components.

## What QRE stores about creative work

Experience records carry lightweight learning metadata such as the selected lens, prompt shape, detected prompt signals, generative-author use, memory awareness, and related learning profile data.

## How learning becomes useful

Behavioral learning groups comparable experiences and calculates outcome pressure from completion, positive actions, abandonment, and errors. The resulting winners/weaknesses flow into `IdentityState.creativeLearning` and then `CognitiveAuthorContext.creativeLearning`.

The existing author pipeline consumes that state through:

`apps/api/src/services/authorCreativeLearningPressure.ts`

```text
outcome
→ AnalyticsRepository
→ autonomousLearning
→ IdentityState
→ CognitiveAuthorContext
→ bounded learned-lens preference
→ existing authorMovieCognition
→ Mouth
```

The current consumer is intentionally conservative. It can provide a preferred lens when authoring is neutral/default. It does not replace the existing cognition owner.

### Selection rules

- A learned preference may influence a neutral/default authoring choice.
- An explicit non-neutral user lens request outranks learned preference.
- Rejected or avoided lenses cannot become learned winners.
- Creative learning can influence framing/selection but cannot create factual reality.
- Reality/provenance remain governed by the existing truth packet and Provenance Gate.

### Next hardening gate

The next step is to move the learned pressure into the existing `authorMovieCognition` hypothesis score itself. That is the proper candidate-level implementation because it lets reality fit, attention value, trajectory quality, and learning all compete together rather than turning learning into a hard preferred-lens injection.

Do **not** create another lens engine to accomplish this.

## Privacy boundary

Behavioral learning remains scoped to the authenticated user's owned/account assets. One identity's private learning must not become another identity's private preference.

## Human feedback

Explicit creative feedback remains higher-value evidence than weak behavioral observation, but QRE can continue learning from normal use without requiring manual review of every experience.

## Current acceptances

```powershell
pnpm --filter @qre/api author:outcome-learning
pnpm --filter @qre/api author:adaptive-learning
```

The first proves canonical outcome normalization. The second proves learned creative state can alter the next selected lens while explicit intent still wins and the supplied reality packet remains unchanged.

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
