# QRE CORE — PRODUCTION GUARDRAILS

**STATUS:** CURRENT / ENGINEERING GUARDRAILS

This document records the invariants that must remain true while QRE grows. Future changes should extend these rules, not silently replace them.

## 1. Physical asset identity

A physical QR/NFC object is a QRE `Asset`.

The Asset is the current safe boundary for asset-scoped memory, creative learning, analytics interpretation, and experience continuity.

A customer, company, administrator, or account may control many Assets. That administrative relationship does not merge those Assets into one creative identity.

## 2. Administrative tenancy

Current administrative relationships are:

```text
Account
  ↓
AccountUser
  ↓
User administration
  ↓
Asset
```

Legacy/personal compatibility remains available through `Asset.ownerId` and `Ownership.userId`.

Canonical access is implemented by `apps/api/src/services/assetAccess.ts`.

Any authenticated user who is an Account member receives baseline access to that Account's Assets. Fine-grained capabilities may later use `AccountUser.role` without changing the ownership model.

## 3. Learning scope

Creative learning is currently Asset-scoped.

```text
Asset A → A's evidence → A's learning
Asset B → B's evidence → B's learning
```

Never widen learning by walking through:

```text
ownerId
accountId
AccountUser
userId
```

Those are administrative or attribution relationships, not implicit creative-identity relationships.

A future shared World/Identity may deliberately join multiple Assets, but that relationship must be explicit in the data model before cross-Asset learning is allowed.

## 4. Analytics rail

The preferred runtime path is:

```text
runtime decision
   ↓
trackEvent()
   ↓
AnalyticsRepository
   ↓
AnalyticsEvent
   ↓
learning / cognition / dashboards / business projections
```

Do not create parallel analytics stores.

Direct Prisma analytics writes require a specific reason, such as preserving transactional atomicity inside a domain transaction. Otherwise route events through the repository boundary.

## 5. Runtime learning loop

The intended persistent loop is:

```text
real input / runtime outcome
        ↓
AnalyticsEvent + Memory
        ↓
outcome normalization
        ↓
learning aggregation
        ↓
IdentityState
        ↓
CognitiveAuthorContext
        ↓
creative selection / realization
        ↓
new experience
        ↓
new outcomes
```

The adaptive acceptance suite must prove that real persisted evidence changes future creative selection while supplied factual reality remains unchanged.

## 6. Viewer, operator, and investor analytics are projections

The canonical event stream should support multiple projections without changing the underlying event model:

```text
Asset analytics
User-visible learning
Organization analytics
Operational/admin analytics
Business/ROI analytics
Investor metrics
Future add-ons
```

Examples of useful derived metrics include:

- scan and completion behavior
- replay, save, share, CTA and payment behavior
- creative acceptance/rejection/selection
- memory growth and reuse
- knowledge growth
- geographic distribution and movement where authorized
- return frequency and recurrence
- experience performance by context
- organization-level patterns, kept separate from Asset identity learning

Derived metrics belong in projection/query layers. Do not turn every new metric into a new source of truth.

## 7. Enterprise dashboard rule

An organization such as a real-estate brokerage may have many administrators and many Assets.

The dashboard must support:

```text
Brokerage
  ├── Agent A → many Assets
  ├── Agent B → many Assets
  └── Agent C → many Assets
```

Admin inventory must be account-scoped, not globally visible to every authenticated user.

When an administrator belongs to multiple Accounts, account-targeting operations must identify the target Account explicitly rather than silently choosing the first membership.

Asset assignment must not permit moving an already-assigned Asset between Accounts without an explicit ownership-transfer operation.

## 8. Security boundary

Authentication answers **who is logged in**.

Asset authorization answers **which Asset they may administer**.

Tier/payment/policy answers **what they may do with that Asset**.

Do not collapse these layers into one convenience check.

## 9. Documentation rule

When a new permanent capability is added:

1. Update the existing canonical document that owns the concept.
2. Remove or rewrite obsolete guidance that now contradicts the implementation.
3. Record current schema facts separately from future schema proposals.
4. Never ask a future developer to infer critical product truth from scattered Prisma queries or random implementation files.

## 10. No silent architecture drift

Before changing a locked subsystem:

```text
inspect existing boundary
↓
find current source of truth
↓
find existing tests
↓
extend the smallest correct layer
↓
run real acceptance tests
↓
update canonical docs
```

The product evolves quickly. The invariants must not.
