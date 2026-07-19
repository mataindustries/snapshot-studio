# Snapshot Studio

**Turn a local-business lead into a client-ready growth plan.**

Snapshot Studio, powered by UpgradeOS, is a local-first operator workspace for turning manually reviewed business research into a premium Snapshot report, prioritized implementation roadmap, proposal, and outreach package.

## What it is

Snapshot Studio brings lead intake, structured research, consultant-style reporting, evidence, action tracking, proposals, and follow-up preparation into one browser workflow. The operator remains the decision-maker at every step; the app organizes the work and keeps linked deliverables consistent.

## Problem

Local-business audits often become a loose collection of notes, screenshots, generic recommendations, and disconnected sales documents. That makes the work slow to review, hard for a client to understand, and difficult to turn into a clear next step.

## Solution

Snapshot Studio creates one traceable path:

**Lead → Snapshot → Roadmap → Proposal → Outreach**

Research is entered by the operator, deterministic suggestions are reviewed before use, and the same canonical actions power the client report, visual diagnostics, implementation plan, proposal scope, and Send Kit.

## Features

- Lead Queue with manual entry and CSV, TSV, or Markdown import
- One-Screen Fast Lane for a focused lead-to-outreach workflow
- Structured Operator Intake Workspace with deterministic draft analysis
- Manual Audit Profile with Business Horoscope and Growth Stages
- Premium client Snapshot with executive summary and visual diagnostics
- Evidence Manager with linked observations and screenshot support
- Opportunity / Effort Matrix, 48-Hour Visibility Sprint, and first-month roadmap
- Action Control Center with live statuses, dependencies, and recent activity
- Proposal Generator and Proposal Workspace
- Editable Send Kit for email, contact form, text, phone notes, and follow-up
- Browser Print / Save PDF for Snapshot and proposal deliverables
- Browser-local saved leads, intakes, Snapshots, proposals, and Fast Lane sessions
- Deterministic fictional Contest Demo with a six-step guided tour

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

For the fastest review:

1. Start the app and select **Load Contest Demo** in the first screen.
2. Follow the tour through **Lead**, **Review**, **Snapshot**, **Roadmap**, **Proposal**, and **Send Kit**.
3. Use **Previous**, **Next**, **Skip**, or **Restart** at any point.
4. Select **Reset Contest Demo** to restore only the fictional demo records to their original state.

The demo uses stable IDs and reserved `.example` contact details. Loading resumes the existing linked demo, while resetting restores its original reviewed state. Neither action duplicates records, and non-demo records are left unchanged. See [the 3-minute demo script](docs/DEMO_SCRIPT.md) or [the judge quickstart](docs/JUDGE_QUICKSTART.md).

## Project structure

```text
src/
  components/   Operator workspaces, report sections, tour, and visual UI
  lib/          Deterministic domain logic, storage, migrations, and demo data
  templates/    Snapshot and outreach copy generation
  types/        Focused proposal and Fast Lane types
  App.tsx       Composition and cross-workspace handoffs
docs/           Product, architecture, validation, and contest documentation
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

## Build Week summary

The build progressed from a lightweight local-business Snapshot into a complete operator-controlled consulting workflow: Business Horoscope and Growth Stages, evidence-backed recommendations, execution roadmaps, structured intake, proposals, premium report storytelling, executive visual diagnostics, live action progress, and the Fast Lane Send Kit. The final contest pass adds a deterministic judge demo, guided tour, public documentation, resilient empty states, and focused mobile polish without changing the core scoring or persistence architecture.

Read the phase-by-phase summary in [docs/BUILD_WEEK.md](docs/BUILD_WEEK.md).

## Author

Built by **Mata Industries** as Snapshot Studio, powered by **UpgradeOS**.
