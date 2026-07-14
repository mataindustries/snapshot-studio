# Architecture

## Current stack

- Vite
- React
- TypeScript
- LocalStorage
- Browser Canvas APIs for screenshot optimization
- No backend, authentication, cloud storage, or external API calls

## Main modules

`src/lib/scoring.ts`
- Calculates the total score and rating label.

`src/lib/growthPlanning.ts`
- Creates and normalizes the Business OS growth foundation.
- Migrates legacy recommended actions and evidence fields.
- Preserves stable action and evidence IDs and reconciles bidirectional links.

`src/lib/evidence.ts`
- Creates and normalizes evidence items.
- Validates report readiness and screenshot Data URLs.
- Optimizes local screenshot uploads.
- Resolves, validates, and removes evidence-to-action links.
- Formats the client-safe evidence text export without Data URLs or internal IDs.

`src/lib/storage.ts`
- Saves, loads, migrates, and deletes snapshots in LocalStorage.
- Preserves unknown legacy snapshot fields during normalization.
- Uses deterministic fallback IDs for legacy snapshots that did not include IDs.
- Treats malformed stored JSON as an empty snapshot collection and exposes quota-error detection.

`src/components/EvidenceManager.tsx`
- Provides the operator workflow for evidence entry, ordering, image handling, readiness, and action linking.

`src/components/EvidenceCard.tsx`
- Provides collapsible, Android-friendly editing for an individual evidence item.

`src/components/EvidenceReport.tsx`
- Renders the client-facing evidence summary, screenshot/text cards, source details, recommendation links, and observed/proposed direction comparison.

`src/components/ProgressJourneyReport.tsx`
- Renders the current/next archetype journey, milestones, action progress, and future-state preview.

`src/templates/`
- Generates snapshot and outreach copy.

## Snapshot data model

A saved snapshot contains the original business profile, scores, generated outputs, branding, and the Business OS growth foundation.

The growth foundation includes:

- current and target score planning fields
- current and next archetypes
- opportunity and progress status
- strengths and visibility leaks
- recommended actions
- expected outcomes
- evidence items
- the `includeIncompleteEvidence` report preference
- methodology and planning-estimate language

Existing snapshots without Business OS or evidence fields receive safe defaults at load time. Normalizers spread legacy records before applying known normalized fields, so unknown legacy properties are retained when the snapshot is saved again.

## Evidence item model

Each evidence item includes:

- stable `id`
- title and evidence type
- source URL and page/location label
- observation
- why it matters
- recommended change
- optional expected outcome
- optional optimized screenshot Data URL, filename, and alt text
- optional before caption, proposed-after caption, and annotation label
- `linkedActionIds`
- created and updated timestamps

An item is report-ready when title, observation, why it matters, and recommended change contain text. Incomplete items remain saveable and are excluded from the client report by default. The operator can explicitly include them per snapshot.

Legacy evidence types such as `Google Profile`, `Social`, and `Search result` are mapped to the current labels. Missing evidence/action IDs use deterministic content-based fallback IDs until the normalized snapshot is saved.

## Screenshot storage strategy

Screenshot handling is manual and browser-local:

1. Accept PNG, JPEG, and WebP files up to 12 MB.
2. Decode the selected file in the browser.
3. Resize it so the longest edge is no more than 1500 pixels.
4. Sample the canvas for transparency.
5. Preserve a PNG only when transparency is present; otherwise encode a report-quality JPEG.
6. Retry large JPEG output at a lower quality.
7. Reject optimized Data URLs above 1.8 million characters.
8. Store only the optimized Data URL in application state and LocalStorage; the original upload is never persisted.

Image decode, Canvas, and encoding failures produce an operator-facing message and do not replace the current screenshot or crash the app. Oversized or unsupported stored Data URLs are discarded during normalization while the rest of the snapshot continues to load.

LocalStorage capacity varies by browser and device and is commonly only a few megabytes for an origin. Several screenshots can fill that capacity even after optimization. Snapshot save failures detect quota errors and keep the current in-memory draft open so the operator can remove or replace large screenshots before retrying.

## Evidence-to-action relationships

Relationships use stable IDs rather than array positions:

- `EvidenceItem.linkedActionIds` identifies supported recommended actions.
- `RecommendedAction.linkedEvidenceIds` identifies supporting evidence.

`synchronizeEvidenceLinks` reconciles either side when loading legacy/asymmetric data. UI link changes update both sides. Deleting evidence, clearing evidence, or removing an action filters dangling IDs from the remaining records. Report and text-export helpers resolve display titles at render time and never expose internal IDs.

Generated recommendation actions use deterministic IDs based on action copy and order. Once a snapshot is saved or evidence is edited, those action records are persisted with the snapshot.

## Snapshot lifecycle

- Saving writes the current evidence items, optimized images, report inclusion preference, recommendations, and links into only the active snapshot.
- Loading replaces the current evidence draft with the selected snapshot's normalized evidence.
- Refreshing restores evidence from LocalStorage after a saved snapshot is loaded.
- Starting a new snapshot creates a fresh growth foundation and does not reuse prior evidence IDs or images.
- Loading a lead updates business inputs without clearing evidence in an already active snapshot.
- Deleting one snapshot does not mutate any other snapshot's evidence collection.

## Print and text export

The report renders evidence as a separate premium section near the front of the deliverable. Print styles:

- allow the evidence section to flow over multiple pages
- keep evidence cards, image captions, and section headings together where practical
- use `object-fit: contain` for portrait and landscape screenshots
- wrap long source URLs
- retain high-contrast borders and text when background graphics are disabled
- hide all evidence editing and upload controls
- preserve the progress journey and final footer

“Copy full report” uses a text-only evidence formatter. It includes source, observed state, why it matters, recommended move, optional expected outcome, and supported action titles. It never includes Data URLs or internal IDs.

## Future backend upgrade path

A later version can replace embedded Data URLs with:

- object storage
- signed upload URLs
- database evidence records
- snapshot-to-file references
- server-side image variants and retention controls

The `screenshotDataUrl` field can then migrate to a storage reference or asset object while stable evidence/action IDs remain unchanged. No backend portion of that path is implemented in the current browser-local version.

## Design principles

- Mobile-first
- Fast to use on Android
- Copy buttons where useful
- Constructive, evidence-based client language
- No fragile or heavy image dependency
- Backward-compatible local migrations
- Printable, polished multi-page reports
