# UpgradeOS V1 Report Evolution

## Product intent

UpgradeOS V1 turns a reviewed Snapshot from a one-time assessment into a practical operating manual. The PDF records the business’s current state, selects the improvements that deserve attention first, defines the proof required for each improvement, and establishes a clean baseline for a future Snapshot.

The operator remains responsible for the assessment, evidence, status changes, and final client delivery. The new report layer is deterministic. It does not crawl websites, call an AI service, change the five assessment scores, predict revenue, guarantee rankings, or award progress without verification.

## Report narrative

The client report now follows this sequence:

1. Business Archetype — the business’s current identity and memorable pattern
2. Your Upgrade Journey — a standalone 60–90 day roadmap
3. Business Snapshot — the reviewed five-part current state
4. Competitive Assets — useful business strengths that can support the plan
5. Primary Constraint and Growth Opportunity — the clearest source of friction, plus the Opportunity / Effort Matrix
6. Three Upgrade Missions — objectives, evidence, action plans, expected outcomes, success criteria, and verification methods
7. Impact Ledger — the baseline and next proof required for each mission
8. Achievement Path — restrained operating milestones tied to the selected missions
9. Snapshot Record — Snapshot 001 and future unscored checkpoints
10. Supporting evidence — report-ready observations and screenshots
11. Implementation paths — client delivery options and next action

The previous Growth Path, 48-Hour Sprint, and First Month of Momentum components remain available to the rest of the application. They are not repeated in the evolved client report because the Upgrade Journey and mission pages now carry that planning story.
The cover uses the existing approved archetype artwork mapping. Its restrained icon treatment remains the fallback if an artwork path is unavailable.


## New report models

The models live in `src/types/upgradeOS.ts`.

### `UpgradeMission`

A mission is a derived, non-persistent view of one canonical `RecommendedAction`. It retains the stable source action ID and status, then adds printable fields for:

- mission priority
- objective
- observed baseline evidence
- three-step action plan
- expected outcome
- effort and planning window
- success criteria
- verification method
- unresolved dependency warnings

No new recommendation source is created. If fewer than three supported canonical actions exist, the report shows fewer than three missions instead of inventing filler work.

### `ImpactLedgerEntry`

The ledger links a mission to:

- its current implementation status
- existing baseline evidence
- a completion date only when the current status and status history support it
- the next proof required
- the timing of future verification

Canonical action statuses map to `Planned`, `In Progress`, or `Completed`. V1 never assigns `Verified` automatically. Completion is not treated as proof of business impact.

### `BusinessAchievement`

Achievements are professional operating milestones derived from mission categories. Examples include first-screen clarity, decision-point proof, local-profile alignment, and a standardized contact path.

V1 shows only milestones related to selected missions. A completed action remains `In Progress` at the achievement level until a later Snapshot verifies the required evidence. Nothing is automatically marked `Earned`.

### `SnapshotRecordCheckpoint`

The first saved report for a business is Snapshot 001. Existing same-business records use their chronological sequence number. The current checkpoint records its original saved date, Business Archetype, and Business Health Score; future checkpoints contain no score or archetype and display `To be recorded`.

## Mission prioritization

`src/lib/upgradeOS.ts` derives missions from existing canonical actions. The private ranking value is an ordering aid, not a new business metric and not a change to assessment scoring.

The deterministic ranking considers:

- 30% existing opportunity / severity signal
- 25% estimated business impact
- 15% implementation effort and achievability
- 15% confidence from explicitly linked report-ready evidence
- 10% dependency readiness
- 5% whether the result can be visibly checked inside a 30–90 day window

Ties use the canonical priority score, recommended order, and stable action ID. Deferred actions are excluded, while completed actions remain eligible so recorded work does not automatically disappear from the operating plan. The model is derived from the current canonical state; meaningful evidence, dependency, or action changes can change the selected set before the report is finalized. Actions are defensively deduplicated by ID, title, and objective.

Evidence is included only when it is report-ready and the existing evidence/action links explicitly connect it to the source action. Missing evidence produces a transparent baseline-pending message; an action rationale is never relabeled as an observed fact.

## Next evolution and target ranges

The report preserves the current Business Archetype. It does not assign a future archetype.

The Upgrade Journey uses the existing Growth Stage and existing planning range:

- when a next Growth Stage exists, it is presented as a planning direction
- at the top Growth Stage, the report describes a stronger maintained operating condition
- the range remains explicitly non-guaranteed
- any future score or stage change requires a new reviewed Snapshot

## Representative review fixture

The existing Starter Workspace in `src/lib/contestDemo.ts` is the representative V1 review report. Harbor & Pine exercises:

- a mid-range 63/100 Business Health Score
- the Reputation Magnet Business Archetype
- six canonical actions
- dependencies
- one Completed action
- one In Progress action
- report-ready linked evidence
- three derived Upgrade Missions
- Impact Ledger entries
- mission-related achievements
- Snapshot 001 and future blank checkpoints

Stable Starter Workspace IDs and reset behavior are unchanged. The UpgradeOS report model is derived at render time and is not copied into local storage.

## Follow-Up Snapshot and proof extension

The focused Proof Loop extension now adds an explicit relationship between a distinct Follow-Up Snapshot and its saved baseline. It reuses:

- stable source action and mission IDs
- canonical action status and implementation notes
- baseline/after evidence links
- accepted proposal scope
- success criteria
- the existing five score categories and report validation

Carried-forward scores remain visibly unreviewed until the operator confirms every current value. Verification is independent from completion and requires a recorded method plus relevant after-state support. The short Proof Report states unsupported outcomes as `Not yet verified` and does not infer rankings, leads, bookings, conversion, customer behavior, revenue, or score improvement.

## Intentionally deferred

V1 does not add:

- accounts or cloud persistence
- CRM screens, billing, subscriptions, or notifications
- automated website crawling or recurring scans
- multi-user collaboration
- editable online plans
- a full achievement catalog or tier system
- speculative ROI calculations
- automated multi-period trend or attribution calculations
- additional archetype coin artwork

## Validation and preview

Run:

```bash
npm run test
npm run lint
npm run build
git diff --check
```

Start the local application with:

```bash
npm run dev
```

Load the Starter Workspace, then open the client preview at the `client-report-preview` section. Use the browser’s **Print / Save PDF** command with US Letter paper to inspect the printable result.

This repository does not include an automated browser or PDF-rendering dependency. Final page breaks, image rendering, and printer-specific margins therefore require a manual Chromium print review.
