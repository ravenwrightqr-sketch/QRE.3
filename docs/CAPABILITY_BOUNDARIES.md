# QRE capability boundaries

QRE capabilities share one World and evidence substrate, but inference/model selection is capability-scoped.

- Author: creative generation and refinement. Controlled by `QRE_AUTHOR_FAST_MODEL` / `QRE_AUTHOR_MODEL` / `QRE_LOCAL_MODEL`.
- Vision: image understanding for world learning. Controlled by `QRE_VISION_MODEL` / `QRE_LOCAL_VISION_MODEL`.
- Document: document-specific intelligence. Controlled by `QRE_DOCUMENT_MODEL` / `QRE_LOCAL_DOCUMENT_MODEL`.

A fast Author benchmark must not change Vision or Document model selection.

Every durable intake operation must preserve evidence and job state on failure, expose the actual error, and remain retry-safe.

Acceptance invariants:

1. Creating a World does not require an experience.
2. Same World slug is idempotent.
3. Empty experience skips Author compilation.
4. Photo intake routes to Vision.
5. PDF/spreadsheet intake routes to Document.
6. Author settings do not alter Vision/Document.
7. Failed inference leaves the original evidence/job intact and records the failure reason.
8. A completed retry cannot duplicate the same source evidence.
