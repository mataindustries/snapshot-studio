import assert from 'node:assert/strict'
import test from 'node:test'
import type { Lead } from '../src/types.ts'
import {
  addBusinessDays,
  applyLeadProgressUpdate,
  buildTodaysRevenueActions,
  createRevenueFunnelSnapshot,
  getLeadPipelineLabel,
  getRevenueContactActions,
} from '../src/lib/revenueWorkflow.ts'

function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: overrides.id || crypto.randomUUID(),
    createdAt: '2026-07-01T12:00:00.000Z',
    businessName: 'Recorded Business',
    websiteUrl: 'https://business.company',
    city: 'Riverton',
    niche: 'Residential HVAC',
    mainService: 'Heating repair',
    phone: '+1 (626) 555-0100',
    email: 'owner@business.company',
    contactFormUrl: 'https://business.company/contact',
    leadSource: 'Operator research',
    priority: 'Medium',
    researchNotes: '',
    suggestedAngle: '',
    status: 'Not reviewed',
    lastContactedAt: '',
    nextFollowUpDate: '',
    outreachActivity: [],
    ...overrides,
  }
}

test('business-day defaults skip weekends', () => {
  const friday = new Date(2026, 6, 31)
  assert.equal(addBusinessDays(friday, 2), '2026-08-04')
  assert.equal(addBusinessDays(friday, 5), '2026-08-07')
})

test('today actions cap at ten, prioritize overdue follow-ups, and exclude terminal leads', () => {
  const leads = Array.from({ length: 14 }, (_, index) => lead({
    id: `lead-${index}`,
    businessName: `Business ${index}`,
    priority: index === 0 ? 'High' : 'Medium',
    status: index === 0 ? 'Sent' : index === 1 ? 'Won' : 'Not reviewed',
    nextFollowUpDate: index === 0 ? '2026-07-20' : '',
  }))
  const actions = buildTodaysRevenueActions({
    leads,
    proposals: [],
    now: new Date(2026, 6, 29),
  })
  assert.equal(actions.length, 10)
  assert.equal(actions[0].leadId, 'lead-0')
  assert.equal(actions[0].isOverdue, true)
  assert.equal(actions.some((action) => action.leadId === 'lead-1'), false)
  assert.equal(new Set(actions.map((action) => action.leadId)).size, actions.length)
})

test('verified contact actions reject development, repository, and malformed values', () => {
  const actions = getRevenueContactActions(lead({
    websiteUrl: 'http://localhost:5173',
    contactFormUrl: 'https://github.com/company/repo',
    email: 'operator@localhost',
    phone: '123',
  }))
  assert.deepEqual(actions, [])
})

test('progress updates preserve the lead, cap activity, and retain legacy status labels', () => {
  const history = Array.from({ length: 50 }, (_, index) => ({
    id: `activity-${index}`,
    type: 'Status changed' as const,
    occurredAt: `2026-07-${String((index % 28) + 1).padStart(2, '0')}T12:00:00.000Z`,
  }))
  const source = lead({ id: 'stable-lead', status: 'Paid', outreachActivity: history })
  assert.equal(getLeadPipelineLabel(source), 'Won')
  const updated = applyLeadProgressUpdate(source, {
    status: 'Not now',
    occurredAt: '2026-07-29T12:00:00.000Z',
    nextFollowUpDate: '2026-08-05',
  })
  assert.equal(updated.id, 'stable-lead')
  assert.equal(updated.businessName, source.businessName)
  assert.equal(updated.status, 'Not now')
  assert.equal(updated.nextFollowUpDate, '2026-08-05')
  assert.equal(updated.outreachActivity?.length, 50)
  assert.equal(updated.outreachActivity?.at(-2)?.type, 'Not now')
  assert.equal(updated.outreachActivity?.at(-1)?.type, 'Follow-up scheduled')
})

test('not-now prospects retain their operator-scheduled revisit', () => {
  const actions = buildTodaysRevenueActions({
    leads: [lead({ status: 'Not now', nextFollowUpDate: '2026-07-28' })],
    proposals: [],
    now: new Date(2026, 6, 29),
  })
  assert.equal(actions[0]?.kind, 'Follow up')
  assert.equal(actions[0]?.isOverdue, true)
})

test('funnel counts use canonical and legacy outcomes without double-writing records', () => {
  const leads = [
    lead({ id: 'a', status: 'Snapshot made' }),
    lead({ id: 'b', status: 'Sent' }),
    lead({ id: 'c', status: 'Replied' }),
    lead({ id: 'd', status: 'Call booked' }),
    lead({ id: 'e', status: 'Won' }),
    lead({ id: 'f', status: 'Paid' }),
  ]
  assert.deepEqual(createRevenueFunnelSnapshot(leads, []), {
    researched: 6,
    contacted: 5,
    replied: 4,
    calls: 3,
    proposals: 0,
    won: 2,
  })
})
