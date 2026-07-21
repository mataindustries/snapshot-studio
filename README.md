# Snapshot Studio

**Discover the growth pattern shaping a local business.**

Snapshot Studio, powered by UpgradeOS, turns reviewed local-business information into a memorable Business Archetype, premium assessment, implementation roadmap, proposal, and outreach Send Kit.

**Lead → Review → Archetype → Roadmap → Proposal → Outreach**

## What it is

Snapshot Studio reveals a Business Archetype derived from a structured five-part assessment, then turns it into a prioritized roadmap, live implementation plan, proposal, and Send Kit. Lead intake, reviewed research, consultant-style reporting, evidence, action tracking, proposals, and follow-up preparation stay connected in one browser workflow. The operator remains the decision-maker at every step.

The Business Archetype is not astrology and does not predict outcomes. It is a branded pattern derived from the reviewed scores for visibility, trust, conversion, AI-search readiness, and competitive position.

## Problem

Local-business audits often become a loose collection of notes, screenshots, generic recommendations, and disconnected sales documents. That makes the work slow to review, hard for a client to understand, and difficult to turn into a clear next step.

## Solution

Snapshot Studio creates one traceable path:

**Lead → Review → Archetype → Roadmap → Proposal → Outreach**

Research is entered by the operator, deterministic suggestions are reviewed before use, and the same canonical actions power the client report, visual diagnostics, implementation plan, proposal scope, and Send Kit.

## Features

- Lead Queue with manual entry and CSV, TSV, or Markdown import
- One-Screen Fast Lane for a focused lead-to-outreach workflow
- Structured Operator Intake Workspace with deterministic draft analysis
- Manual Audit Profile with Business Archetype and Growth Stages
- Premium client Snapshot with executive summary and visual diagnostics
- Evidence Manager with linked observations and screenshot support
- Opportunity / Effort Matrix, 48-Hour Visibility Sprint, and first-month roadmap
- Action Control Center with live statuses, dependencies, and recent activity
- Proposal Generator and Proposal Workspace
- Editable Send Kit for email, contact form, text, phone notes, and follow-up
- Browser Print / Save PDF for Snapshot and proposal deliverables
- Browser-local saved leads, intakes, Snapshots, proposals, and Fast Lane sessions
- Deterministic fictional Starter Workspace with a six-step guided tour

## Architecture

Snapshot Studio is a static React and TypeScript application built with Vite. It has no application backend, account system, payment layer, or external data-fetching service.

- **UI:** React 19 components and focused CSS
- **Domain logic:** TypeScript modules for scoring, recommendations, progress, proposals, evidence, and copy generation
- **Persistence:** versioned browser localStorage records with migration helpers
- **Documents:** semantic HTML and print CSS for high-quality browser PDF output
- **Icons:** Lucide React
- **Deployment:** static files emitted to `dist/`

The existing models are reused across workspaces: a lead can link to an intake, Snapshot, proposal, and Fast Lane session without creating parallel records.

## Responsible AI

- Recommendations and draft analysis are deterministic; identical reviewed inputs produce consistent suggestions.
- The operator reviews the supplied research, classifications, scores, evidence, recommendations, proposal scope, and outbound copy.
- Snapshot Studio does not automatically crawl websites or infer unseen website facts.
- Operator notes are not presented as verified website evidence.
- Missing evidence is labeled as preliminary instead of receiving a misleading score.
- The product does not guarantee search rankings, revenue, leads, or score movement.
- Nothing is emailed, texted, published, or marked sent without an explicit operator action.

## Local development

Prerequisites: Node.js 20.19+ (or a current Node.js LTS release) and npm.

```bash
git clone https://github.com/mataindustries/snapshot-studio.git
cd snapshot-studio
npm ci
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Build

```bash
npm run lint
npm run build
npm run preview
```

`npm run build` type-checks the project and writes a static production build to `dist/`.
Publish that directory on a static host at the site root. The app uses root-relative assets;
`dist/signal/index.html` provides the direct-refresh-safe Signal companion at `/signal/`.
For a subdirectory deployment, set the Vite base and update public artwork paths for that base.

## Demo

The Starter Workspace uses fictional example data, reserved `.example` contact details, and stable IDs. Loading resumes the same linked records without duplication; resetting restores only Starter Workspace data and leaves user-created records unchanged.

1. Launch the app.
2. Select **Load Starter Workspace**.
3. Reveal the **Business Archetype**.
4. Open the **Executive Snapshot**.
5. Review the **Opportunity Matrix**.
6. Change one action status and observe live progress.
7. Open the proposal.
8. Open the **Send Kit**.
9. Select **Reset Starter Workspace** to restore the example workflow.

Continue with the [3-minute demo script](docs/DEMO_SCRIPT.md), [judge quickstart](docs/JUDGE_QUICKSTART.md), [submission copy](docs/SUBMISSION_COPY.md), or [Build Week phase summary](docs/BUILD_WEEK.md).

## Project structure

```text
src/
  components/   Operator workspaces, report sections, tour, and visual UI
  lib/          Deterministic domain logic, storage, migrations, and demo data
  templates/    Snapshot and outreach copy generation
  types/        Focused proposal and Fast Lane types
  App.tsx       Composition and cross-workspace handoffs
docs/           Product, architecture, validation, and submission documentation
public/         Static assets and the browser-local Signal companion
```

Additional technical context is available in [Architecture](docs/ARCHITECTURE.md), [Build Week](docs/BUILD_WEEK.md), and [Validation Plan](docs/VALIDATION_PLAN.md).

## Known limitations

- Data is browser-local and does not sync between devices or browser profiles.
- Clearing site storage removes saved work unless it has been exported elsewhere.
- There is no automatic website crawling, live SEO data, ranking data, or third-party profile lookup.
- Screenshot evidence must be attached by the operator and can consume browser storage.
- Print and clipboard behavior depends on browser capabilities and permissions.
- Follow-up dates are stored for workflow use; there are no background reminders or automatic messages.
- Projected score ranges are planning estimates and require a follow-up Snapshot to verify change.

## Future roadmap

- A follow-up queue built from the existing outreach and next-contact records
- Optional, operator-authorized portability and backup workflows
- More review tooling around evidence completeness and implementation verification
- Additional accessibility, browser, and print regression coverage

These are future directions, not current product claims.

## Built with Codex and GPT-5.6

Codex and GPT-5.6 supported the development process by helping to:

- inspect and understand the evolving React and TypeScript codebase
- plan modular implementation phases
- build and refactor the report system
- develop deterministic analysis and recommendation helpers
- create the evidence, action tracking, proposal, Fast Lane, and Send Kit workflows
- diagnose print and PDF pagination regressions
- perform lint, build, diff, migration, and regression checks
- improve mobile behavior and submission documentation

Key product decisions remained operator-directed, including:

- UpgradeOS positioning
- the Business Archetype concept
- the responsible operator-review model
- the five-part score framework
- the 48-Hour Visibility Sprint
- the client-facing report structure
- the sales workflow

Codex and GPT-5.6 were development tools. The shipped application does not call GPT-5.6 at runtime, crawl websites autonomously, or send outreach autonomously.

## Build Week summary

The build progressed from a lightweight local-business Snapshot into a complete operator-controlled consulting workflow: Business Archetype and Growth Stages, evidence-backed recommendations, execution roadmaps, structured intake, proposals, premium report storytelling, executive visual diagnostics, live action progress, and the Fast Lane Send Kit. The final preparation pass adds a deterministic Starter Workspace, guided tour, public documentation, resilient empty states, and focused mobile polish without changing the core scoring or persistence architecture.

Read the phase-by-phase summary in [docs/BUILD_WEEK.md](docs/BUILD_WEEK.md).

## License

Licensed under the GNU Affero General Public License v3.0 or later. See [LICENSE](LICENSE).

## Author

Built by **Mata Industries** as Snapshot Studio, powered by **UpgradeOS**.

Copyright (c) 2026 Mata Industries.
