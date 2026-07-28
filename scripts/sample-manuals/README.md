# UpgradeOS sample manual generator

This developer workflow generates five fictional, client-safe sample Business Operating Manuals through Snapshot Studio's real UpgradeOS V1 report pipeline. It does not maintain a second report template and does not add a customer-facing workflow.

## Run

```bash
npm install
npx playwright install chromium
npm run samples:generate
```

The command builds the application, starts the existing Vite production preview on a temporary loopback port, places one typed `SavedSnapshot` fixture into a clean browser context, loads it through the existing Saved Snapshots control, waits for fonts and archetype artwork, and captures the current browser print output.

Ghostscript (`gs`) is required for PDF text extraction and page-preview rendering. Generated files are written to `artifacts/sample-manuals/`:

- five PDF manuals;
- `generation-summary.md` and `generation-summary.json`;
- extracted PDF text for review;
- a PNG preview of every page under `previews/<fixture-slug>/`.

## Fixture safety

- Every fixture is marked as fictional developer data in `fixtures.ts`.
- Every PDF is visibly labeled `Sample Operating Manual`.
- Business URLs and evidence source URLs are intentionally absent.
- Public contact configuration is explicitly blank during generation, so no private or development contact value can enter an output.
- Review figures, tenure, credentials, and source observations are consistently identified as sample assessment data and must be replaced or verified before any real client delivery.
- Baseline missions start as `Not Started`; no mission is marked completed without implementation evidence.
- Expected outcomes use planning language and remain subject to follow-up verification.

## Validation performed

The generator fails the batch when any fixture:

- has score dimensions that do not equal its Business Health Score;
- resolves to a different archetype than its fixture target;
- has fewer than six evidence items;
- marks a baseline mission completed;
- fails the application's production pre-render validation;
- renders anything other than three distinct missions;
- has missing archetype artwork;
- uses print text clipping or horizontal overflow;
- produces anything other than ten PDF pages;
- contains another fixture's business name or Harbor & Pine content;
- contains a forbidden development, repository, placeholder, or guaranteed-outcome phrase;
- produces a blank or nearly blank page.

The PNG previews remain the final visual inspection surface for awkward page breaks and edge-case clipping that browser geometry cannot identify automatically.

## Archetype profile adjustments

The production archetype rules are never overridden.

- Arroyo Dental Arts originally resolved to `Reputation Magnet`. Five points were reallocated from Visibility into Conversion and AI Search Readiness, preserving the 72/100 total and producing `Hidden Authority`.
- Foothill Shield Roofing originally resolved to `Reputation Magnet`. One point was moved from Trust to Competitive Position, preserving the 58/100 total and producing `Sleeping Giant`.
- The other three requested profiles already resolve to their target archetypes without adjustment.
