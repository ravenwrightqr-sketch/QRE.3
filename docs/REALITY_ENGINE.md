# QRE Reality Engine

## Purpose

QRE should not reduce an image to a short list of labels. A business evidence item is a time-stamped observation of the visible world.

The Reality Engine converts an image into a structured reality graph containing:

- scene/domain understanding
- meaningful spatial regions
- individual visible entities
- approximate geometry
- readable text
- spatial relationships
- visibility/occlusion state
- uncertainty and unknowns

The output is evidence, not unrestricted interpretation.

## Ground truth boundary

QRE uses six practical evidence states:

1. **Observed** — directly supported by pixels or legible text.
2. **Located** — a supported position or region in the observed frame.
3. **Related** — a supported spatial relationship to another observed entity.
4. **Identified** — an identity candidate supported by visible appearance/text.
5. **Inferred** — a hypothesis derived from multiple observations. Never silently promoted to observed fact.
6. **Unknown** — evidence is insufficient to determine the state.

Example: an item visible yesterday and absent from today's frame is **not observed today**. It is not automatically sold, removed, or moved. Those are hypotheses requiring additional evidence.

## Perception architecture

The first production iteration uses the canonical local model runtime for structured visual perception. The architecture intentionally leaves room for specialist perception models later: open-vocabulary detection, concept segmentation/tracking, OCR, embeddings, and depth.

This follows a specialist-mesh approach rather than asking one VLM to solve every perception problem in a single prose response.

## Persistent representation

Existing `KnowledgeEvidence`, `KnowledgeObservation`, and `KnowledgePattern` tables remain the durable compatibility layer. Reality observations are stored as JSON values with explicit schema versioning.

`REALITY_SCENE` stores the complete scene graph.

`REALITY_ENTITY` stores individually addressable entities and a stable semantic fingerprint used for cross-observation matching.

Reality-derived patterns currently include:

- recurring entities
- not-observed transitions
- appeared-or-returned transitions
- possible movement between regions
- repeated spatial associations
- expected presence
- count trends

Prediction metadata is always labeled as a prediction and retains the evidence and sample size that produced it.

## Temporal model

A later observation is a new world state. QRE compares successive states instead of treating each photo as an isolated caption.

Core deltas:

- added
- removed from the visible frame
- moved candidate
- reappeared
- unchanged
- count changed
- spatial relationship changed
- visibility became ambiguous

The system must preserve alternative explanations whenever the evidence cannot discriminate between them.

## Pattern learning

Patterns are hypotheses supported by repeated observations. They should have:

- a type
- statement
- confidence
- strength
- evidence IDs
- sample size where applicable
- first/last observation time
- machine-readable metadata
- status

The important distinction is between **frequency** and **predictive validity**. A pattern that occurs often is not automatically a reliable predictor.

The next stage should score predictions against later reality and retain calibration/error history.

## Business universality

The same primitives are intentionally domain-neutral.

Retail: shelves, cases, products, empty positions, stock/display changes.

Services: equipment, work areas, vehicles, tools, supplies, job-state evidence.

Property: rooms, fixtures, damage candidates, changes between inspections.

Events: setup state, objects, locations, occupancy, teardown changes.

Warehouses: racks, bins, pallets, equipment, spatial movement.

The business-specific intelligence should be a higher layer over the same reality primitives, not a collection of separate vision systems.

## Research direction

Current research supports the architectural ingredients: SAM 3 demonstrates open-vocabulary concept detection/segmentation/tracking; V-JEPA 2 demonstrates the value of representations built for understanding and predicting world-state changes; open-vocabulary detectors such as Grounding DINO show language-conditioned object localization. QRE should borrow those principles while keeping the final truth layer evidence-grounded and application-owned.

## Next implementation stages

1. Specialist perception adapters behind one QRE perception contract.
2. Pixel-level provenance for every high-value claim.
3. Cross-image entity matching using visual embeddings plus semantic/text evidence.
4. Stronger temporal delta computation including count and geometry changes.
5. Prediction scoring/calibration against subsequent observations.
6. Human correction capture as structured training/error data.
7. Business-specific decision layers built on top of the universal Reality Graph.
