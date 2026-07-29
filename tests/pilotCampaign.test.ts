import assert from 'node:assert/strict'
import test from 'node:test'
import { addPilotQuery, parsePilotContext } from '../src/lib/pilotCampaign.ts'
import { normalizeRevenueEvent, recordRevenueEvent } from '../src/lib/revenueEvents.ts'

class MemoryStorage {
  value = ''
  getItem() { return this.value || null }
  setItem(_key: string, value: string) { this.value = value }
}

test('pilot context allowlists campaign and industry parameters', () => {
  assert.deepEqual(parsePilotContext('?campaign=direct-outreach&industry=dental'), {
    campaign: 'direct-outreach',
    industry: 'dental',
    sample: {
      industry: 'dental',
      label: 'Dental sample',
      businessName: 'Arroyo Dental Arts',
      category: 'Family and restorative dentistry',
      href: '/sample-manuals/arroyo-dental-arts-business-operating-manual.pdf',
    },
  })
  const fallback = parsePilotContext('?campaign=person%40mail.com&industry=Business%20Name')
  assert.equal(fallback.campaign, 'founding-client')
  assert.equal(fallback.industry, 'general')
})

test('booking links receive only allowlisted campaign context', () => {
  const result = addPilotQuery('https://product.company/book?source=site', {
    campaign: 'founding-client',
    industry: 'roofing',
  })
  const url = new URL(result)
  assert.equal(url.searchParams.get('source'), 'site')
  assert.equal(url.searchParams.get('campaign'), 'founding-client')
  assert.equal(url.searchParams.get('industry'), 'roofing')
  assert.equal(addPilotQuery('javascript:alert(1)', {
    campaign: 'sample',
    industry: 'hvac',
  }), '')
})

test('revenue events discard arbitrary personal fields and retain only funnel context', () => {
  const normalized = normalizeRevenueEvent({
    id: 'event-1',
    type: 'Sample viewed',
    occurredAt: '2026-07-29T12:00:00.000Z',
    campaign: 'sample',
    industry: 'med-spa',
    email: 'private@person.company',
    businessName: 'Private Business',
    message: 'private outreach copy',
  })
  assert.deepEqual(Object.keys(normalized || {}).sort(), [
    'campaign', 'id', 'industry', 'occurredAt', 'type',
  ])
  assert.equal(JSON.stringify(normalized).includes('private@person.company'), false)
})

test('event storage is bounded and contains no outreach content', () => {
  const storage = new MemoryStorage()
  recordRevenueEvent({
    type: 'Pilot CTA clicked',
    campaign: 'founding-client',
    industry: 'hvac',
    occurredAt: '2026-07-29T12:00:00.000Z',
  }, storage)
  const parsed = JSON.parse(storage.value) as { events: Array<Record<string, unknown>> }
  assert.equal(parsed.events.length, 1)
  assert.deepEqual(Object.keys(parsed.events[0]).sort(), [
    'campaign', 'id', 'industry', 'occurredAt', 'type',
  ])
})
