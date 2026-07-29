import assert from 'node:assert/strict'
import test from 'node:test'
import type { EvidenceItem, Lead, SavedSnapshot } from '../src/types.ts'
import { createProspectActionPack, getSourceLinkedEvidence } from '../src/lib/prospectActionPack.ts'
import { getBestSampleManual } from '../src/lib/pilotCampaign.ts'

function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: 'lead-1',
    createdAt: '2026-07-01T12:00:00.000Z',
    businessName: 'Careful Company',
    websiteUrl: '',
    city: 'Riverton',
    niche: 'Family dentistry',
    mainService: 'Dental implants',
    phone: '',
    email: '',
    contactFormUrl: '',
    leadSource: '',
    priority: 'High',
    researchNotes: 'Operator says this company has 500 five-star reviews.',
    suggestedAngle: '',
    status: 'Not reviewed',
    lastContactedAt: '',
    outreachActivity: [],
    ...overrides,
  }
}

function evidence(overrides: Partial<EvidenceItem> = {}): EvidenceItem {
  return {
    id: 'evidence-1',
    evidenceType: 'Website',
    sentiment: 'Opportunity',
    title: 'Recorded service path',
    sourceUrl: 'https://business.company/services',
    pageLabel: 'Service page',
    observation: 'The reviewed service page names the consultation step.',
    whyItMatters: 'The decision path can be checked before outreach.',
    recommendedChange: 'Confirm the path remains current.',
    expectedOutcome: 'The outreach claim remains attributable.',
    linkedActionIds: [],
    createdAt: '2026-07-01T12:00:00.000Z',
    updatedAt: '2026-07-01T12:00:00.000Z',
    ...overrides,
  }
}

test('only report-ready public source links qualify as verified outreach evidence', () => {
  const values = [
    evidence(),
    evidence({ id: 'local', sourceUrl: 'http://127.0.0.1:4173/page' }),
    evidence({ id: 'repo', sourceUrl: 'https://github.com/company/repository' }),
    evidence({ id: 'incomplete', whyItMatters: '' }),
  ]
  assert.deepEqual(getSourceLinkedEvidence(values).map((item) => item.id), ['evidence-1'])
})

test('sparse action packs mark missing verification and never turn operator notes into facts', () => {
  const model = createProspectActionPack({ lead: lead() })
  assert.match(model.contactRationale, /No source-linked contact rationale/)
  assert.match(model.evidenceNotice, /not treated as verified evidence/)
  assert.equal(model.verifiedEvidence.length, 0)
  assert.equal(model.firstEmail.includes('500 five-star reviews'), false)
  assert.match(model.operatorNote || '', /verify/)
  assert.equal(model.voicemail.includes('[your name]'), false)
  assert.deepEqual(model.missingInformation, [])
  assert.match(model.proposalStarter.title, /\$297 Founding-Client Assessment Pilot/)
  assert.match(model.proposalStarter.distinction, /separate from larger implementation proposals/)
})

test('missing identity fields are explicit before personalization', () => {
  const model = createProspectActionPack({
    lead: lead({ businessName: '', niche: '', city: '', mainService: '' }),
  })
  assert.deepEqual(model.missingInformation, [
    'business name', 'category', 'city or market', 'primary service',
  ])
})

test('matching samples are deterministic and category-specific', () => {
  assert.equal(getBestSampleManual('Residential HVAC').industry, 'hvac')
  assert.equal(getBestSampleManual('Family and restorative dentistry').industry, 'dental')
  assert.equal(getBestSampleManual('Medical spa').industry, 'med-spa')
  assert.equal(getBestSampleManual('Residential roofing').industry, 'roofing')
  assert.equal(getBestSampleManual('Tree service').industry, 'tree-service')
})

test('linked snapshot priorities are framed as planning priorities, not proven facts', () => {
  const snapshot = {
    evidenceItems: [],
    recommendedActions: [{
      id: 'action-1',
      title: 'Clarify the consultation path',
      status: 'Not Started',
      priorityScore: 90,
      opportunityScore: 80,
      recommendedOrder: 1,
      blockedBy: [],
    }],
  } as unknown as SavedSnapshot
  const model = createProspectActionPack({ lead: lead(), snapshot })
  assert.match(model.outreachAngle, /planning priority—not as a proven website fact/)
})
