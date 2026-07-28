import assert from 'node:assert/strict'
import test from 'node:test'
import type { SnapshotForm } from '../src/types.ts'
import {
  getReportMode,
  harborPineDemoReport,
} from '../src/lib/harborPineDemoReport.ts'
import { getTotalScore } from '../src/lib/scoring.ts'
import { buildBusinessHoroscope } from '../src/templates/snapshotTemplates.ts'

function canonicalForm(): SnapshotForm {
  return {
    businessName: harborPineDemoReport.business.name,
    websiteUrl: harborPineDemoReport.business.businessUrl ?? '',
    city: harborPineDemoReport.business.city,
    niche: harborPineDemoReport.business.category,
    mainService: harborPineDemoReport.business.primaryService,
    notes: harborPineDemoReport.business.biggestStrength,
    weakness: 'The first-screen promise needs more service clarity.',
    competitorNote: '',
    competitorUrl1: '',
    competitorUrl2: '',
    tone: 'premium',
    ctaStyle: 'book-call',
  }
}

test('the canonical Harbor & Pine descriptor has the approved identity and score profile', () => {
  const scores = { ...harborPineDemoReport.scores }
  const totalScore = getTotalScore(scores)
  const archetype = buildBusinessHoroscope(canonicalForm(), scores, totalScore).archetype

  assert.equal(harborPineDemoReport.business.name, 'Harbor & Pine Heating Co.')
  assert.equal(harborPineDemoReport.business.category, 'Residential HVAC')
  assert.equal(harborPineDemoReport.business.city, 'Riverton')
  assert.equal(
    harborPineDemoReport.business.primaryService,
    'Emergency heating and air conditioning repair',
  )
  assert.equal(harborPineDemoReport.business.businessType, 'Home services')
  assert.equal(harborPineDemoReport.business.businessUrl, null)
  assert.equal(totalScore, harborPineDemoReport.businessHealthScore)
  assert.equal(archetype, harborPineDemoReport.archetype)
  assert.equal(harborPineDemoReport.sampleLabel, 'Sample Operating Manual')
})

test('report mode is derived only from the stable canonical Snapshot ID', () => {
  assert.equal(getReportMode(harborPineDemoReport.ids.snapshot), 'demo')
  assert.equal(getReportMode('another-snapshot'), 'production')
  assert.equal(getReportMode(null), 'production')
})
