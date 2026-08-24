# QRE Universal Creation Context

**STATUS:** CURRENT PRODUCT INVARIANT

## Product law

> **The user does not learn QRE. QRE learns the user.**

The user starts every creation with one natural-language request:

```text
WHAT DO YOU WANT TO CREATE?
```

The system resolves the creation intent and establishes the minimum context needed for that particular creation.

## One universal path

```text
USER REQUEST
    ↓
COG / INTAKE
    ↓
NEW EXPERIENCE CONTEXT
    ↓
ENTITY / CLIENT / PROPERTY / JOB / SUBJECT (when applicable)
    ↓
AUTHORIZED REALITY
    ↓
COGNITION
    ↓
UNIVERSAL AUTHOR / MOUTH
    ↓
EXPERIENCE
```

There are no domain-specific Author engines and no hardcoded pet, wedding, cleaning, real-estate, or business funnels.

## Creation context

Every time a user creates something, QRE creates a new experience context.

The context answers:

- what the user is trying to create
- what real-world entity or situation the creation is about
- what information is necessary to distinguish this creation
- which persistent entity memory may be reused
- which new facts belong to this creation

A new creation does not inherit arbitrary facts from unrelated creations.

## Account vs entity vs experience

```text
ACCOUNT / CREATOR
    = administrative + account-level learning scope

ENTITY / CLIENT / PROPERTY / SUBJECT
    = persistent factual world for the relevant asset scope

EXPERIENCE
    = one creation instance

EXPERIENCE HISTORY
    = ordered experiences attached to the same entity/context
```

Business example:

```text
Maria's business account
    ├── Coco
    │    ├── Receipt #1
    │    └── Receipt #2
    ├── Bella
    │    └── Receipt #1
    └── New client
```

Personal example:

```text
Personal account
    ├── Coco memory
    ├── Wedding memory
    └── Home memory
```

The account is not one giant factual memory.

## Continuation

After an entity exists, the dashboard should expose continuation actions such as:

```text
Coco
  → Send another receipt
  → Add memory
  → View history
```

Selecting **Send another receipt** creates a new Experience attached to Coco's existing authorized memory.

The new experience can build on recurrence, prior events, and accumulated facts without overwriting the previous experience.

## Reality isolation

The current memory model already scopes durable entities by `assetId`.

Therefore:

```text
Coco on Asset A
    ≠
Coco on Asset B
```

and:

```text
Client A facts
    ≠
Client B facts
```

unless a future first-class shared-world relationship explicitly connects them.

## Intake behavior

The frontend must not decide the user's domain from a hardcoded questionnaire.

For example:

```text
make a wedding memory
```

must never become:

```text
dog / cat / another animal
```

The intake planner can ask for missing details, but the details must be universal and derived from the creation request. Free text is preferred; examples must never introduce unsupported world facts.

## Dynamic collection

Cog may determine that a creation benefits from information such as:

```text
client
property
job
person
place
moment
fact
media
style
ending
```

The user is never required to understand these as a database schema.

The frontend renders the dynamic collection requirements returned by the intake contract.

## Continuity law

```text
NEW CREATION
    → NEW EXPERIENCE CONTEXT

EXISTING ENTITY
    → EXPLICIT CONTINUATION OF THAT ENTITY

UNRELATED ENTITY
    → NO FACTUAL INHERITANCE
```

The system may reuse account-level creative preferences where authorized, but factual world state remains scoped.

## Full-app invariant

The same universal creation model feeds:

```text
Dashboard
Collect
Memory
Cognition
Author
Mouth
Experience
Player
Learning
Analytics
```

The UI may look different for services, weddings, pets, real estate, homes, businesses, or personal memories. The semantic pipeline does not split.
