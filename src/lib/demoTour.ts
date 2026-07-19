const dismissalKey = 'snapshot-studio:contest-tour-dismissed:v1'

export const demoTourSteps = [
  {
    title: 'Lead',
    targetId: 'lead-queue',
    copy: 'Start with a complete lead and one usable contact route. The Contest Demo is fictional and safe to reset.',
  },
  {
    title: 'Review',
    targetId: 'operator-workspace',
    copy: 'The operator supplies research, reviews deterministic suggestions, and keeps final control over every score and claim.',
  },
  {
    title: 'Snapshot',
    targetId: 'client-report-preview',
    copy: 'The client-ready brief turns reviewed inputs into a clear story, evidence-aware diagnostics, and practical next steps.',
  },
  {
    title: 'Roadmap',
    targetId: 'action-control-center',
    copy: 'Canonical actions drive the Opportunity Matrix, sprint, first-month plan, dependencies, and live progress.',
  },
  {
    title: 'Proposal',
    targetId: 'proposal-workspace',
    copy: 'The ready proposal reuses the approved Snapshot scope, current statuses, pricing defaults, and client context.',
  },
  {
    title: 'Send Kit',
    targetId: 'fast-lane-send-kit',
    copy: 'Email, contact-form, text, follow-up, and PDF actions are prepared here. Nothing is sent automatically.',
  },
] as const

export type DemoTourStep = typeof demoTourSteps[number]

export function isDemoTourDismissed() {
  try {
    return localStorage.getItem(dismissalKey) === 'true'
  } catch {
    return false
  }
}

export function rememberDemoTourDismissal() {
  try {
    localStorage.setItem(dismissalKey, 'true')
  } catch {
    // The tour can still close when browser storage is unavailable.
  }
}

export function clearDemoTourDismissal() {
  try {
    localStorage.removeItem(dismissalKey)
  } catch {
    // Restart still works for the open page when browser storage is unavailable.
  }
}
