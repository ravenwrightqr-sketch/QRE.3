# QRE Admin — Elite Product System

## Product thesis

QRE Admin is not an asset list and not a collection of settings pages. It is the operating control plane for QRE: one place where an operator can understand the state of every business world, teach QRE, inspect what QRE learned, act on emerging patterns, automate routine work, measure outcomes, and control access.

The guiding interaction is:

> **Give QRE anything. QRE figures out what it means.**

The operator should understand the state of the system in seconds and reach the next useful action without needing to understand QRE's internal architecture.

## Proven enterprise patterns

Elite business platforms repeatedly converge on a small set of product primitives rather than exposing every subsystem directly.

### 1. One control plane

Shopify describes Admin as the central hub for products, orders, customers, analytics, marketing, logistics and settings. ServiceNow uses centralized workspaces to search/explore system state, inspect health and activity, and reach operational tools. Salesforce unifies applications, data, automation, analytics and permissions on a common platform. QRE should apply the same principle to worlds, knowledge, experiences, operations and system controls.

### 2. Objects first, screens second

The user should think in terms of business worlds and the things inside them—not database tables or service boundaries.

Primary QRE object types:

- World — a business, person, place, product, event or other durable subject.
- Evidence — an uploaded or connected source that supports knowledge.
- Knowledge — facts, attributes, observations and learned relationships.
- Pattern — a repeated, changed, correlated or otherwise meaningful signal.
- Experience — an authored output produced from reality and intent.
- Operation — a job, automation, alert, approval or workflow execution.
- Person / team — an actor with identity and scoped permissions.
- Integration — an external system connected to a world or account.

### 3. Search is a primary primitive

Large systems make search available throughout administration because operators should not have to remember where an object lives. QRE should support global search across worlds, products, services, people, evidence, observations, patterns, experiences and operations.

### 4. Progressive disclosure

The first screen answers only:

1. Is QRE healthy?
2. What changed?
3. What needs attention?
4. Which world am I working on?
5. What can I do next?

Detailed configuration stays one level deeper. The interface should never make the operator read a technical wall just to perform a common action.

### 5. Permissions by role and scope

Notion, Jira and other enterprise products use roles, groups and scoped permissions rather than user-by-user exceptions. QRE should support account-level administration, world-level permissions and sensitive-operation permissions, with least privilege as the default.

### 6. Workflow and automation as a native capability

ServiceNow and Jira treat workflow automation as a first-class product surface. QRE should let operators express rules in natural language or a simple builder, for example:

- When a new product is observed, update the catalog.
- When the same issue appears three times, alert the owner.
- When a supplier PDF changes, re-learn the document.
- When a business receives a scan, record the engagement event.
- When a pattern becomes strong enough, prepare an experience draft.

Automations must be auditable, scoped and reversible.

### 7. Health and activity are visible, not buried

ServiceNow's workspace model explicitly combines health, recent activity and tools. QRE should expose system health, knowledge freshness, failed learning jobs, integration health and recent administrative activity from the command center.

### 8. Dashboards are composed from meaningful metrics

Jira and other enterprise tools let users compose dashboards from widgets or reports. QRE should provide a small set of high-value primitives rather than endless configurable charts.

Core QRE dashboard metrics:

- active worlds
- connected worlds
- knowledge volume
- evidence processed
- observations
- patterns discovered
- experiences generated
- scans
- engagement / unlocks
- failed operations
- automation executions
- integrations needing attention

## QRE Admin information architecture

```text
QRE
└── Admin
    ├── Command Center
    │   ├── System health
    │   ├── Attention
    │   ├── Recent activity
    │   ├── Key metrics
    │   └── Next actions
    │
    ├── Worlds
    │   ├── Production
    │   ├── Test / Development
    │   ├── Archived
    │   └── World detail
    │       ├── Overview
    │       ├── Knowledge
    │       ├── Catalog
    │       ├── Observations
    │       ├── Patterns
    │       ├── Experiences
    │       ├── Activity
    │       ├── Automations
    │       ├── Integrations
    │       └── Access
    │
    ├── Knowledge
    │   ├── Give QRE anything
    │   ├── Recent learning
    │   ├── Evidence
    │   ├── Catalog
    │   ├── Observations
    │   ├── Patterns
    │   └── Knowledge quality
    │
    ├── Operations
    │   ├── Jobs
    │   ├── Attention
    │   ├── Automations
    │   ├── Approvals
    │   └── Activity / audit
    │
    ├── Analytics
    │   ├── Business performance
    │   ├── Learning performance
    │   ├── Experience performance
    │   └── System performance
    │
    ├── Integrations
    │   ├── Connected systems
    │   ├── Add integration
    │   ├── Sync health
    │   └── Credentials / scopes
    │
    └── System
        ├── Team & roles
        ├── Permissions
        ├── Security
        ├── Environments
        ├── Data retention
        ├── Feature controls
        └── API / developer access
```

## Command Center design

The default admin screen should feel closer to a high-end Apple-style control surface than an enterprise legacy console.

Visual rules:

- One dominant headline.
- Large whitespace.
- restrained typography.
- minimal chrome.
- one accent color reserved for state/action.
- no decorative gradients behind every card.
- avoid nested bordered boxes.
- use compact status indicators instead of large badges.
- show only the most useful metrics above the fold.
- make navigation persistent but quiet.
- use motion only for state changes and transitions.

Above the fold:

```text
QRE ADMIN                                      Search   Account

Command center
Everything QRE knows. One place to run it.

Healthy                                            17:05

[ 39 Worlds ] [ 1,842 Knowledge ] [ 214 Patterns ] [ 0 Critical ]

ATTENTION
3 businesses need review                     View
2 integrations need reconnecting              View
1 learning job failed                         View

RECENT
Inventory learned · 4 min ago
Supplier PDF learned · 12 min ago
New pattern detected · 31 min ago

NEXT
Choose a world → Give QRE anything → Inspect what changed
```

## World model

QRE should stop presenting the user with the word `Asset` as the primary mental model.

Internally an Asset may remain an architectural identity. In the UI the user sees `World` or a domain-appropriate label.

A world can be:

- business
- person
- pet
- place
- product
- event
- property
- service
- organization
- object
- memory

The world detail screen should adapt labels to the world type without forking the architecture.

For a business:

```text
House of Vapes

Business · Riverside

Healthy

Knowledge        428
Products          173
Observations      612
Patterns           29
Experiences        18
Scans           4,821

[ Give QRE anything ]

What changed
────────────
• 7 products observed again
• 2 products appear newly stocked
• supplier document updated
• repeated flavor preference detected

Knowledge
Catalog · Observations · Patterns · Evidence
```

For a pet, person or event, the same surface uses the relevant vocabulary without changing the underlying flow.

## Universal intake

The intake surface is one of QRE's signature capabilities and must remain simple.

```text
GIVE QRE ANYTHING

Take photo     Upload photos     Upload PDF
Spreadsheet    Paste text       Learn website

                 or

          Drop anything here

UPLOADED → PROCESSING → LEARNED
```

Every modality should produce a common evidence object and enter the same learning pipeline.

The source-specific parser / sensor is allowed to differ; the resulting world representation must converge.

## Learning model

```text
Artifact / connection
        ↓
Source sensor / parser
        ↓
Evidence
        ↓
Grounded facts
        ↓
Catalog / attributes
        ↓
Observations
        ↓
Relations
        ↓
Patterns
        ↓
Persistent world memory
        ↓
Author context
        ↓
Experience
```

No source should become an isolated mini-database.

The same product seen in a photo, spreadsheet and PDF should converge on the same world object where identity can be established safely.

## Pattern engine

Patterns are not merely counts. They are operator-useful signals.

Pattern classes should include:

- repeated observation
- change over time
- new entity
- missing expected entity
- recurring relationship
- recurring behavior
- anomaly
- trend
- concentration
- preference signal
- operational bottleneck
- opportunity

Every pattern should expose:

- statement
- strength
- confidence
- first observed
- last observed
- supporting evidence
- affected objects
- recommended next action

Example:

```text
REPEATED
Fogger Strawberry Watermelon
Observed 4 times across 3 sources
Confidence 0.96

Evidence
• Shelf photo · Sep 8
• Inventory CSV · Sep 8
• Supplier PDF · Sep 7
• Shelf photo · Sep 8

[ Inspect ] [ Use in experience ]
```

## Attention system

The admin should not force the operator to inspect every page. QRE should promote meaningful attention items.

Priority classes:

- critical
- needs review
- recommendation
- informational

Examples:

- learning job failed
- integration disconnected
- business world unassigned
- stale source
- contradictory observations
- permission risk
- high-confidence new pattern
- automation failed

The command center should summarize these and link directly to the relevant object.

## Search

Global search should accept natural language as well as exact terms.

Examples:

- `House of Vapes`
- `Fogger`
- `things observed twice this week`
- `failed learning jobs`
- `businesses with no website`
- `patterns about strawberry watermelon`

Search should return grouped results by World, Knowledge, Pattern, Experience and Operation.

## Automation

QRE should expose a natural-language automation builder before exposing a complex node editor.

```text
WHEN
same product is observed 3 times

DO
mark product as confidently observed
AND
notify business owner
AND
make it available to the Author
```

Advanced users can inspect the generated rule, conditions and actions.

Every automation gets:

- scope
- trigger
- conditions
- actions
- owner
- enabled state
- execution history
- failure policy
- audit trail

## Analytics

Analytics should be decision-oriented rather than chart-oriented.

The default questions are:

- What is growing?
- What changed?
- What is being used?
- What is failing?
- What is becoming important?
- What should happen next?

QRE should measure three loops separately:

### Business loop

Worlds → activity → engagement → outcomes.

### Learning loop

Sources → evidence → facts → observations → patterns → memory.

### Experience loop

Memory → cognition → realization → delivery → engagement → feedback.

## Team and access

Use role-based access with reusable scopes.

Suggested roles:

- Owner
- Admin
- Operator
- Analyst
- Creator
- Viewer
- Integration Admin
- Billing Admin

Scopes should be attachable at account and world levels.

Sensitive actions should require stronger permissions than read access.

## Audit

Important administrative operations should create durable audit events:

- business created
- business connected
- business archived
- source uploaded
- knowledge accepted / rejected
- automation created / changed / disabled
- integration added / removed
- permissions changed
- export performed
- destructive action performed

Audit entries should show who, what, when, where and the affected world.

## Integrations

QRE should design integrations as another evidence/operation channel rather than special-case product silos.

Potential categories:

- website / CMS
- commerce / inventory
- payments
- CRM
- calendar
- messaging
- storage
- accounting
- analytics
- social / marketing

Each integration exposes:

- connection status
- last sync
- sync errors
- data scope
- imported object types
- disconnect / reconnect

## Test and production separation

Current development data shows why a first-class environment distinction is necessary. Test worlds, golden-test worlds and production worlds should never compete in the same primary list.

Recommended filters:

```text
PRODUCTION   TEST / DEV   ARCHIVED
```

A world should also carry a lifecycle status:

- draft
- active
- paused
- archived

The admin default is `Production`.

## QRE-specific advantage

QRE is different from ordinary business software because its central asset is not the dashboard itself. It is the accumulated world model.

Traditional business software generally asks operators to enter structured information into predefined modules.

QRE should invert that:

```text
Human gives QRE raw reality.

QRE resolves the source.
QRE extracts grounded facts.
QRE accumulates evidence.
QRE reconciles repeated observations.
QRE discovers patterns.
QRE maintains a durable world.
QRE uses that world to create outputs.
```

That means the admin product should make the **learning loop** visible and trustworthy.

## Universal future surface

The long-term admin experience should make a statement like this literally true:

> **Give QRE anything. It figures out what it means, remembers it, connects it to the world, notices what changes, and gives you the next useful action.**

The UI should therefore remain stable even as QRE gains capabilities. New parsers, model providers, integrations and automation actions should attach to the same control-plane primitives instead of creating new top-level navigation every time.

## Implementation order

### Phase 1 — Command center

- Production / Test / Archived separation.
- Global search shell.
- Attention feed.
- Recent activity.
- health state.
- key metrics.
- next-action links.

### Phase 2 — World workspace

- business world detail.
- knowledge summary.
- catalog.
- observations.
- patterns.
- activity.
- experiences.

### Phase 3 — Learning intelligence

- persisted intake history.
- evidence inspection.
- source provenance.
- observation reconciliation.
- pattern detail.
- contradiction / confidence handling.

### Phase 4 — Operations

- durable jobs.
- attention queue.
- automation builder.
- approvals.
- audit trail.

### Phase 5 — Enterprise

- role/scoped permissions.
- integrations.
- analytics.
- exports.
- environment management.

### Phase 6 — Adaptive intelligence

- proactive recommendations.
- natural-language search.
- pattern-to-action suggestions.
- world-aware automations.
- learning-quality monitoring.
- Author feedback loops.

## Acceptance standard

QRE Admin is successful when a new operator can answer the following without documentation:

1. What worlds do I have?
2. Which ones need attention?
3. What does QRE currently know about one world?
4. How do I teach it something new?
5. What did it learn?
6. What patterns has it noticed?
7. What can I do with those patterns?
8. What happened recently?
9. Who can access this world?
10. Is the system healthy?

The operator should be able to complete the first five in under a minute.
