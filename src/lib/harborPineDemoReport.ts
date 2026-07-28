import type { ReportMode, Scores } from '../types'

type CanonicalDemoReport = {
  mode: Extract<ReportMode, 'demo'>
  sampleLabel: string
  business: {
    name: string
    category: string
    city: string
    primaryService: string
    businessType: string
    businessUrl: null
    biggestStrength: string
  }
  archetype: string
  businessHealthScore: number
  scores: Scores
  ids: {
    lead: string
    intake: string
    snapshot: string
    proposal: string
    fastLaneSession: string
    homepageEvidence: string
    trustEvidence: string
  }
  createdAt: string
  reviewedAt: string
}

/**
 * The single source of truth for Demo Mode identity and assessment values.
 * Operational records may retain live status progress, but demo validation
 * accepts only this stable report identity and score profile.
 */
export const harborPineDemoReport = {
  mode: 'demo',
  sampleLabel: 'Sample Operating Manual',
  business: {
    name: 'Harbor & Pine Heating Co.',
    category: 'Residential HVAC',
    city: 'Riverton',
    primaryService: 'Emergency heating and air conditioning repair',
    businessType: 'Home services',
    businessUrl: null,
    biggestStrength: 'Customers consistently mention respectful technicians, clear arrival updates, and tidy work areas.',
  },
  archetype: 'Reputation Magnet',
  businessHealthScore: 63,
  scores: {
    visibility: 14,
    trust: 17,
    conversion: 11,
    aiSearchReadiness: 9,
    competitorPosition: 12,
  },
  ids: {
    lead: 'contest-demo-lead-harbor-pine',
    intake: 'contest-demo-intake-harbor-pine',
    snapshot: 'contest-demo-snapshot-harbor-pine',
    proposal: 'contest-demo-proposal-harbor-pine',
    fastLaneSession: 'contest-demo-fast-lane-harbor-pine',
    homepageEvidence: 'contest-demo-evidence-homepage',
    trustEvidence: 'contest-demo-evidence-trust',
  },
  createdAt: '2026-06-16T16:00:00.000Z',
  reviewedAt: '2026-06-18T18:30:00.000Z',
} as const satisfies CanonicalDemoReport

export function getReportMode(snapshotId: string | null): ReportMode {
  return snapshotId === harborPineDemoReport.ids.snapshot ? 'demo' : 'production'
}
