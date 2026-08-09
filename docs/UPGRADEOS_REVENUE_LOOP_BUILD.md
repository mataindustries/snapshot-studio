# UpgradeOS Proof Loop — Focused V1 Extension

## Canonical repository

Run this task only in:

`https://github.com/mataindustries/snapshot-studio`

The repository is still named `snapshot-studio`, but the product inside it is **Snapshot Studio, powered by UpgradeOS**. Do not implement this task in `relay-os`, and do not create or move the work into a separate UpgradeOS repository.

## Read this first

UpgradeOS V1 is already a substantial working system. The current repository already includes:

- Lead Queue and One-Screen Fast Lane.
- Operator Intake and deterministic draft analysis.
- Business Archetypes and the five-part Business Health Score.
- Upgrade Missions, implementation roadmaps, and the 48-Hour Visibility Sprint.
- Evidence Manager with screenshots and evidence-to-action links.
- Action Control Center with statuses, dependencies, implementation notes, and activity history.
- Proposal Generator and Proposal Workspace with browser PDF output.
- Send Kit, Today’s Revenue Mission, Prospect Action Pack, and the $297 founding-client pilot funnel.
- Demo Mode, five fictional sample manuals, production validation, and browser-local persistence.

Do not duplicate any of those systems. In particular, do not create a second proposal generator, Sprint Record, action-status lifecycle, lead pipeline, Evidence Manager, or revenue dashboard.

Before editing:

1. Read all repository instructions and relevant Markdown documentation.
2. Inspect the current `main` branch, especially the Snapshot model, proposal linkage, Evidence Manager, Action Control Center, localStorage migrations, report rendering, print CSS, and tests.
3. Trace the existing canonical data path: `Lead → Intake → Snapshot → Proposal → Action Control Center → Send Kit`.
4. Identify the smallest extension points that preserve this data path.
5. Reuse current components, types, IDs, storage conventions, styles, and print behavior.

## The actual missing capability

UpgradeOS already diagnoses, proposes, and tracks implementation status. The missing capability is a trustworthy way to prove what changed afterward.

Build a minimal **Implementation Verification + Follow-Up Snapshot Loop** that extends the existing V1 instead of creating a parallel workflow.

It should answer:

1. What was observed before the engagement?
2. What approved action was implemented?
3. What observable evidence exists afterward?
4. How was the change verified?
5. What remains unverified?
6. What should happen next?

## Required user flow

### 1. Enter implementation from existing records

- From an accepted proposal or its linked Snapshot, the operator can return to the existing Action Control Center.
- Continue using the existing recommended actions, statuses, dependencies, and implementation notes.
- Do not create a separate set of missions or tasks.

### 2. Capture completion evidence

Extend the current evidence/action relationship so the operator can distinguish:

- **Baseline evidence** — the original observed state.
- **After evidence** — the observable state after implementation.

Existing evidence must migrate safely as baseline evidence unless the current architecture provides a more compatible conservative default.

For each implemented action, support:

- Implementation note.
- Completion date.
- Linked baseline evidence.
- Linked after evidence.
- Verification method.
- Verification status.
- Conservative outcome note.

Use a small verification state such as:

- `Not verified`
- `Ready for review`
- `Verified`
- `Could not verify`

Adapt the labels if the repository already has a compatible convention. Verification is separate from the existing action status. An action can be completed without being verified.

Do not allow `Verified` unless the operator has recorded a verification method and at least one relevant after-state observation or evidence item. Never fabricate evidence or infer an outcome from a status change.

### 3. Create a linked Follow-Up Snapshot

Add a safe way to create a Follow-Up Snapshot from the completed implementation plan.

- Preserve the original Snapshot as an immutable baseline record.
- Link the new Follow-Up Snapshot to the baseline Snapshot using stable IDs.
- Carry forward business identity and relevant approved context without overwriting the original record.
- Require the operator to review and enter current evidence and scores; do not automatically claim score improvement.
- Clearly label baseline values, follow-up values, and any values not reviewed.
- Preserve the existing scoring methodology and report-validation rules.

### 4. Generate a short Proof Report

Create one concise, customer-facing **UpgradeOS Proof Report**, approximately one to two print pages, using the current report design and print system.

Include only:

- Business and engagement identity.
- Baseline Snapshot date and Follow-Up Snapshot date.
- Approved implementation scope.
- Completed actions.
- Baseline evidence versus after evidence.
- Verification method and status.
- Conservative outcome notes.
- Items still unverified or incomplete.
- One recommended next action and review date.

This is not another ten-page Business Operating Manual and not another proposal. It is a proof-of-work document generated from existing Snapshot, proposal, action, and evidence records.

## Claim discipline

Never invent or imply:

- Analytics that were not supplied.
- Search ranking changes.
- Lead, booking, conversion, or revenue impact.
- Competitor changes.
- Customer behavior.
- Guaranteed score improvement.
- Completed work based only on a proposed action.

Clearly distinguish:

- Observed fact.
- Operator judgment.
- Proposed work.
- Completed work.
- Verified result.
- Unverified outcome.

Use `Not yet verified` when the record does not support a stronger statement.

## Persistence and compatibility

- Extend the existing versioned browser-local persistence and migration helpers.
- Preserve unknown legacy fields and stable action/evidence IDs.
- Do not mutate or overwrite an original baseline Snapshot when creating a follow-up.
- Existing saved Snapshots, proposals, evidence, action progress, Demo Mode records, and five sample manuals must continue loading.
- Do not add a backend, account system, or external service.

## Operator experience

- Keep the workflow internal/operator-facing.
- Make the completion and verification controls comfortable at approximately 360–430 px mobile widths.
- Add the fewest new controls necessary.
- Reuse the current UpgradeOS visual language.
- Keep baseline/after evidence visually unmistakable.
- Ensure save state and unsaved changes are explicit.

## Explicitly out of scope

Do not add or redesign:

- Lead Queue, Today’s Revenue Mission, Prospect Action Pack, or Fast Lane.
- Proposal Generator, Proposal Workspace, pricing, or the $297 pilot.
- Send Kit or outreach copy.
- A second Sprint Record or implementation tracker.
- A general CRM or outreach sequencer.
- A new marketing homepage or pilot page.
- Authentication, payments, invoicing, or multi-user permissions.
- Automated crawling, third-party data, or an AI/API dependency.
- New archetypes, scoring categories, dashboards, or sample manuals.
- Gamification or broad design-system work.
- Unrelated refactors and speculative cleanup.

## Acceptance criteria

The task is complete only when:

1. Existing Action Control Center actions remain the canonical implementation tasks.
2. Existing evidence loads safely as baseline evidence after migration.
3. An operator can attach after evidence to a completed action without breaking its baseline evidence links.
4. Completed and verified remain distinct states.
5. Verification requires a method and after-state support.
6. A Follow-Up Snapshot can be created without overwriting the original baseline Snapshot.
7. The baseline and Follow-Up Snapshots remain linked by stable IDs after refresh.
8. The Proof Report prints cleanly without editing controls, navigation, clipped sections, internal IDs, or unsupported claims.
9. The complete flow works at a narrow phone viewport and a normal desktop viewport.
10. Existing Snapshot, proposal, Evidence Manager, Action Control Center, Demo Mode, Business Operating Manual, sample manuals, and revenue workflow regressions continue to pass.
11. Relevant migration, domain-logic, report-validation, and print/render tests are added or updated.
12. The repository’s existing lint, test, and production build commands pass.

## Execution discipline

- Implement the smallest coherent version satisfying the acceptance criteria.
- Prefer extending canonical models to introducing new parallel records.
- Do not rewrite working architecture without a concrete need.
- If an ambiguity does not block safe implementation, make a conservative choice and document it.
- If the requested behavior already exists, preserve it and implement only the verified missing delta.
- Do not commit or push. Leave the changes ready for Sergio to test first.

## Final response

When finished, report:

1. What changed in plain language.
2. How the implementation reuses the existing Snapshot, proposal, action, and evidence models.
3. Files changed.
4. Persistence/migration behavior.
5. Validation and tests run, with results.
6. Exact phone-friendly steps Sergio should use to test the complete flow.
7. Deliberate limitations or scope cuts.
8. Recommended commit message, but do not commit.
