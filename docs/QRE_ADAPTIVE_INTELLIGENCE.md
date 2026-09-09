# QRE Adaptive Intelligence

QRE should not become a larger dashboard every time a new business capability appears. The stable product surface is the control plane; intelligence grows underneath it.

## Core loop

```text
RAW REALITY
    ↓
EVIDENCE
    ↓
FACTS / ENTITIES
    ↓
OBSERVATIONS
    ↓
RELATIONSHIPS
    ↓
PATTERNS
    ↓
TRAJECTORIES
    ↓
FORECASTS / SCENARIOS
    ↓
RECOMMENDATIONS
    ↓
ACTIONS
    ↓
OUTCOMES
    ↓
LEARNING
```

The critical design rule is that each stage emits reusable signals instead of creating a domain-specific silo.

## Calculations that should become universal primitives

### Recurrence

Measure whether the same meaningful signal keeps appearing over a window.

Inputs: count, active observations, recency.

Output: `recurrence` in `[0,1]`.

Use cases: repeated products, recurring customer actions, repeated service requests, repeated failures, returning places, recurring content themes.

### Change

Compare the newest observation with a recent baseline.

Outputs:

- absolute change
- percentage change
- direction

### Trend

Fit an explainable trajectory to ordered observations rather than asking a model to invent one.

Output:

- slope
- direction
- confidence

### Acceleration

Compare recent slope with earlier slope.

This detects signals that are not merely growing, but growing faster or slowing down.

### Anomaly

Measure the newest observation against the recent distribution. Start conservatively with a standard-deviation based detector and preserve the supporting observations so the operator can inspect the reason.

### Stability

Very low volatility is itself a useful pattern. Stable behavior can be more actionable than a dramatic spike.

### Forecast

Project the observed trajectory forward with an uncertainty range. Forecasts must be phrased as projections from observed behavior, never guarantees about the future.

### Scenario projection

Separate `what is likely` from `what would happen if`.

Scenario calculation accepts an explicit assumed change rate and number of periods and produces a projected value plus absolute and percentage change.

## Pattern evidence contract

Every surfaced pattern should eventually carry:

- kind
- statement
- score
- confidence
- direction
- supporting observations / evidence
- first observed
- last observed
- affected world objects
- recommended next action

This makes intelligence inspectable instead of magical.

## Future intelligence tiers

### Tier 1 — descriptive

What exists? What happened? What changed?

### Tier 2 — pattern

What repeats? What correlates? What is unusual? What is becoming important?

### Tier 3 — predictive

What is the current trajectory? What is likely next? What may become a problem?

### Tier 4 — prescriptive

What action has the strongest expected value under the current evidence?

### Tier 5 — adaptive

Did the action work? Update confidence and future recommendations from measured outcomes.

QRE should build these tiers in order and preserve the evidence trail at every step.

## Decision scoring

Future recommendation ranking should combine, where available:

```text
expected_value
× confidence
× evidence_quality
× urgency
× reversibility
```

Do not collapse these into an opaque AI score. Keep the components inspectable so an operator can understand why a recommendation ranked highly.

## Future-state command center

The admin dashboard should eventually answer five questions before exposing any configuration:

1. Is QRE healthy?
2. What changed?
3. What matters now?
4. What is likely to happen next?
5. What is the highest-value reversible action?

Everything else is progressive disclosure.

## Product simplification rule

New intelligence must prefer an existing surface:

- new data source → universal intake
- new entity → world model
- new repeated behavior → pattern
- new prediction → intelligence
- new action → operation
- new external system → integration
- new permission requirement → access policy

Do not create a new top-level navigation item solely because a new capability was invented.

## Safety and epistemic rules

QRE can identify predictive signals, but repeated patterns do not guarantee outcomes. The system must distinguish:

- observed fact
- derived statistic
- inferred pattern
- forecast
- scenario assumption
- recommendation

Confidence must fall when evidence is sparse, contradictory, stale, or dependent on a single source. High-impact actions should remain reviewable and auditable.

## Implementation boundary

The first universal calculation layer lives in `packages/engine/src/intelligence/patternForecast.ts`.

It is pure and domain-agnostic:

- no Prisma
- no database reads
- no network calls
- no side effects
- no execution

Runtime/admin layers can consume these results and decide how they are persisted, displayed, approved, or executed.

The same primitives can therefore serve a retail world, dog groomer, restaurant, event, person, place, product, or future QRE world type without changing the intelligence contract.
