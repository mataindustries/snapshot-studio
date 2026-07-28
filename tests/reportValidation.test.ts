import assert from 'node:assert/strict'
import test from 'node:test'
import type {
  EvidenceItem,
  RecommendedAction,
  Scores,
  SnapshotForm,
} from '../src/types.ts'
import type {
  BusinessAchievement,
  UpgradeMission,
} from '../src/types/upgradeOS.ts'
import {
  firstCompleteSentence,
  getAudienceNoun,
  getBusinessNameFitClass,
} from '../src/lib/reportDisplay.ts'
import { harborPineDemoReport } from '../src/lib/harborPineDemoReport.ts'
import {
  getRenderableReportConfiguration,
  isValidContactEmail,
  isValidHttpUrl,
  resolveReportConfiguration,
  type ReportConfiguration,
} from '../src/lib/reportConfig.ts'
import type {
  ExecutiveSummary,
  StrategicAsset,
} from '../src/lib/reportStory.ts'
import {
  areScoresDisplayable,
  isKnownDefaultScoreFailure,
  normalizeScoreForDisplay,
} from '../src/lib/scoring.ts'
import {
  validateReportForRender,
  type ReportValidationInput,
} from '../src/lib/reportValidation.ts'
import { createScoreDiagnostics } from '../src/lib/visualDiagnostics.ts'
import { generateOutputs } from '../src/templates/snapshotTemplates.ts'

const validScores: Scores = {
  visibility: 14,
  trust: 17,
  conversion: 11,
  aiSearchReadiness: 9,
  competitorPosition: 12,
}

function form(overrides: Partial<SnapshotForm> = {}): SnapshotForm {
  return {
    businessName: 'Harbor & Pine Heating Co.',
    websiteUrl: '',
    city: 'Riverton',
    niche: 'Residential HVAC',
    mainService: 'Emergency heating and air conditioning repair',
    notes: 'Respectful technicians and clear arrival updates are consistently recorded.',
    weakness: 'The first-screen promise needs more service clarity.',
    competitorNote: '',
    competitorUrl1: '',
    competitorUrl2: '',
    tone: 'premium',
    ctaStyle: 'book-call',
    ...overrides,
  }
}

function action(index: number): RecommendedAction {
  const categories = ['Homepage', 'Trust', 'Service Pages'] as const
  return {
    id: `action-${index + 1}`,
    title: `Action ${index + 1}: ${categories[index]}`,
    description: `Complete the ${categories[index]} improvement.`,
    category: categories[index],
    priority: 'High',
    estimatedEffort: index === 2 ? 'Large' : 'Small',
    estimatedImpact: 'High',
    estimatedHours: index === 2 ? 10 : 3,
    priorityScore: 90 - index,
    opportunityScore: 80 - index,
    reason: `Constraint ${index + 1} is visible in the reviewed material.`,
    expectedOutcome: `Expected outcome ${index + 1} is easier to verify.`,
    objective: `Establish operating standard ${index + 1}.`,
    businessValue: `Decision benefit ${index + 1} is clear.`,
    status: 'Not Started',
    blockedBy: [],
    unlocks: [],
    recommendedOrder: index + 1,
    linkedEvidence: [],
    linkedEvidenceIds: [],
  }
}

function mission(index: number): UpgradeMission {
  const source = action(index)
  return {
    id: `mission-${index + 1}`,
    sourceActionId: source.id,
    sourceStatus: source.status,
    title: `Mission ${index + 1}: ${source.category}`,
    objective: source.objective,
    category: source.category,
    priority: (index + 1) as 1 | 2 | 3,
    evidence: [`Recorded evidence ${index + 1}.`],
    actionSummary: `Complete action summary ${index + 1}.`,
    actionPlan: [
      `Capture baseline ${index + 1}.`,
      `Implement change ${index + 1}.`,
      `Review result ${index + 1}.`,
    ],
    primaryBusinessOutcome: `Distinct operating outcome ${index + 1}.`,
    expectedOutcome: `Expected to improve decision path ${index + 1}.`,
    effort: index === 2 ? 'High' : 'Low',
    timeEstimate: index === 2 ? '2–4 weeks' : '1–2 days',
    successCriteria: [`Distinct success signal ${index + 1} is visible.`],
    verificationMethod: `Verify mission ${index + 1} during the next Snapshot.`,
    unresolvedDependencyIds: [],
    dependencyWarnings: [],
  }
}

function achievement(index: number): BusinessAchievement {
  return {
    id: `achievement-${index + 1}`,
    missionId: `mission-${index + 1}`,
    title: `Operating Standard ${index + 1} Established`,
    description: `Mission ${index + 1} creates a distinct operating condition.`,
    verificationRequirements: [
      `Dated proof for mission ${index + 1} is reviewed.`,
    ],
    status: 'Locked',
  }
}

function asset(index: number): StrategicAsset {
  const types = ['Reputation', 'Contact Path', 'Local Relevance'] as const
  return {
    title: `Competitive asset ${index + 1}`,
    explanation: `Recorded business advantage ${index + 1}.`,
    whyItMatters: `Decision impact ${index + 1} is specific to this asset.`,
    leverage: `Use this asset at decision point ${index + 1}.`,
    sourceLabel: 'Assessment input',
    assetType: types[index],
  }
}

function summary(overrides: Partial<ExecutiveSummary> = {}): ExecutiveSummary {
  return {
    businessSnapshot: 'Harbor & Pine serves Riverton homeowners.',
    currentPosition: '63/100 — Trusted Specialist. The reviewed baseline is ready.',
    largestOpportunity: 'Clarify the first-screen service promise.',
    fastestWin: 'Lead with emergency repair, Riverton, proof, and one next step.',
    longTermGoal: 'Build a repeatable path from discovery to follow-through.',
    estimatedEffort: 'Small effort to start; medium across the first month.',
    expectedOutcome: 'Homeowners can evaluate fit with less friction.',
    ...overrides,
  }
}

const validConfiguration: ReportConfiguration = {
  CONTACT_EMAIL: 'advisor@product.company',
  CONSULTATION_URL: 'https://product.company/consultation',
  BRAND_URL: 'https://product.company',
}

function validInput(): ReportValidationInput {
  return {
    reportMode: 'production',
    snapshotId: 'snapshot-production',
    archetype: 'Reputation Magnet',
    form: form(),
    scores: { ...validScores },
    actions: [action(0), action(1), action(2)],
    missions: [mission(0), mission(1), mission(2)],
    achievements: [achievement(0), achievement(1), achievement(2)],
    strategicAssets: [asset(0), asset(1), asset(2)],
    executiveSummary: summary(),
    evidenceItems: [],
    configuration: { ...validConfiguration },
    resolvedOutput: {
      heading: 'Harbor & Pine Heating Co. operating manual',
      market: 'Residential HVAC · Riverton',
    },
  }
}

function codes(input: ReportValidationInput) {
  return validateReportForRender(input).issues.map((issue) => issue.code)
}

test('a complete report model passes pre-render validation', () => {
  assert.deepEqual(validateReportForRender(validInput()), {
    valid: true,
    issues: [],
  })
})

test('Demo Mode accepts only the canonical labeled Harbor & Pine report', () => {
  const input = validInput()
  input.reportMode = 'demo'
  input.snapshotId = harborPineDemoReport.ids.snapshot
  input.archetype = harborPineDemoReport.archetype
  input.configuration = {
    CONTACT_EMAIL: '',
    CONSULTATION_URL: '',
    BRAND_URL: '',
  }
  input.resolvedOutput = {
    heading: harborPineDemoReport.sampleLabel,
    business: harborPineDemoReport.business.name,
  }

  assert.deepEqual(validateReportForRender(input), {
    valid: true,
    issues: [],
  })
})

test('Demo Mode rejects noncanonical identity, scores, URLs, evidence, and missing label', () => {
  const input = validInput()
  input.reportMode = 'demo'
  input.snapshotId = 'another-snapshot'
  input.archetype = 'Category Builder'
  input.form = form({
    businessName: 'Another Company',
    city: 'Elsewhere',
    niche: 'Plumbing',
    mainService: 'Drain repair',
    websiteUrl: 'https://public.company',
  })
  input.scores = { ...validScores, trust: 16 }
  input.evidenceItems = [{
    id: 'evidence-1',
    evidenceType: 'Website',
    sentiment: 'Opportunity',
    title: 'Recorded service-path observation',
    sourceUrl: 'https://public.company/service',
    pageLabel: 'Public-facing website review',
    observation: 'The service path requires clarification.',
    whyItMatters: 'Homeowners need a direct next step.',
    recommendedChange: 'Clarify the request path.',
    expectedOutcome: 'The next step becomes easier to understand.',
    linkedActionIds: [],
    createdAt: '2026-06-16T16:00:00.000Z',
    updatedAt: '2026-06-18T18:30:00.000Z',
  } satisfies EvidenceItem]
  input.resolvedOutput = { heading: 'Operating Manual' }

  const result = codes(input)
  assert.ok(result.includes('demo-canonical-snapshot'))
  assert.ok(result.includes('demo-canonical-business-name'))
  assert.ok(result.includes('demo-canonical-city'))
  assert.ok(result.includes('demo-canonical-category'))
  assert.ok(result.includes('demo-canonical-primary-service'))
  assert.ok(result.includes('demo-business-url-present'))
  assert.ok(result.includes('demo-canonical-archetype'))
  assert.ok(result.includes('demo-canonical-score-trust'))
  assert.ok(result.includes('demo-source-url-present'))
  assert.ok(result.includes('demo-sample-label-missing'))
})

test('personalization requires business name, service area, and category', () => {
  const input = validInput()
  input.form = form({ businessName: '', city: '', niche: '' })

  const result = codes(input)
  assert.ok(result.includes('personalization-business-name'))
  assert.ok(result.includes('personalization-city'))
  assert.ok(result.includes('personalization-category'))
})

test('score validation catches missing, nonnumeric, out-of-range, and known default values', () => {
  const invalid = validInput()
  invalid.scores = {
    ...validScores,
    visibility: undefined,
    trust: '17',
    conversion: 21,
  }
  const invalidCodes = codes(invalid)
  assert.ok(invalidCodes.includes('score-visibility-missing'))
  assert.ok(invalidCodes.includes('score-trust-missing'))
  assert.ok(invalidCodes.includes('score-conversion-range'))

  const knownDefault = validInput()
  knownDefault.scores = {
    visibility: 10,
    trust: 10,
    conversion: 10,
    aiSearchReadiness: 10,
    competitorPosition: 10,
  }
  assert.ok(codes(knownDefault).includes('scores-known-default-state'))

  const legitimateEqual = validInput()
  legitimateEqual.scores = {
    visibility: 12,
    trust: 12,
    conversion: 12,
    aiSearchReadiness: 12,
    competitorPosition: 12,
  }
  assert.equal(validateReportForRender(legitimateEqual).valid, true)
})

test('score normalization keeps labels and fills consistent', () => {
  assert.deepEqual(normalizeScoreForDisplay(9), {
    available: true,
    score: 9,
    percentage: 45,
  })
  assert.deepEqual(normalizeScoreForDisplay(17), {
    available: true,
    score: 17,
    percentage: 85,
  })
  assert.deepEqual(normalizeScoreForDisplay(82, 100), {
    available: true,
    score: 82,
    percentage: 82,
  })
  assert.equal(normalizeScoreForDisplay(21).available, false)

  const diagnostics = createScoreDiagnostics(validScores)
  assert.equal(diagnostics.find((item) => item.key === 'trust')?.percentage, 85)
  assert.equal(diagnostics.find((item) => item.key === 'aiSearchReadiness')?.percentage, 45)

  const defaults = {
    visibility: 10,
    trust: 10,
    conversion: 10,
    aiSearchReadiness: 10,
    competitorPosition: 10,
  }
  assert.equal(isKnownDefaultScoreFailure(defaults), true)
  assert.equal(areScoresDisplayable(defaults), false)
  assert.ok(createScoreDiagnostics(defaults).every((item) =>
    item.available === false
    && item.score === null
    && item.percentage === null,
  ))
})

test('mission validation requires exactly three unique and meaningfully distinct missions', () => {
  const wrongCount = validInput()
  wrongCount.missions = wrongCount.missions.slice(0, 2)
  assert.ok(codes(wrongCount).includes('missions-exactly-three'))

  const duplicates = validInput()
  duplicates.missions[1] = {
    ...duplicates.missions[1],
    id: duplicates.missions[0].id,
    title: ` ${duplicates.missions[0].title.toLocaleUpperCase()}! `,
    actionPlan: [...duplicates.missions[0].actionPlan],
    primaryBusinessOutcome: duplicates.missions[0].primaryBusinessOutcome,
    successCriteria: [...duplicates.missions[0].successCriteria],
  }
  const duplicateCodes = codes(duplicates)
  assert.ok(duplicateCodes.includes('missions-duplicate-ids'))
  assert.ok(duplicateCodes.includes('missions-duplicate-titles'))
  assert.ok(duplicateCodes.includes('missions-duplicate-action-plans'))
  assert.ok(duplicateCodes.includes('missions-duplicate-outcomes'))
  assert.ok(duplicateCodes.includes('missions-duplicate-success-signals'))
})

test('achievement titles, descriptions, and verification requirements must be distinct', () => {
  const input = validInput()
  input.achievements[1] = {
    ...input.achievements[1],
    title: input.achievements[0].title,
    description: input.achievements[0].description,
    verificationRequirements: [...input.achievements[0].verificationRequirements],
  }
  const result = codes(input)
  assert.ok(result.includes('achievements-duplicate-titles'))
  assert.ok(result.includes('achievements-duplicate-descriptions'))
  assert.ok(result.includes('achievements-duplicate-verification'))
})

test('Competitive Asset decision guidance cannot repeat', () => {
  const input = validInput()
  input.strategicAssets[1] = {
    ...input.strategicAssets[1],
    whyItMatters: input.strategicAssets[0].whyItMatters,
    leverage: input.strategicAssets[0].leverage,
  }
  const duplicateCodes = codes(input)
  assert.ok(duplicateCodes.includes('assets-duplicate-impact'))
  assert.ok(duplicateCodes.includes('assets-duplicate-next-use'))
})

test('Executive Summary fields cannot end in a print-facing ellipsis', () => {
  const ascii = validInput()
  ascii.executiveSummary = summary({ fastestWin: 'Clarify the first screen...' })
  assert.ok(codes(ascii).includes('summary-trailing-ellipsis'))

  const unicode = validInput()
  unicode.executiveSummary = summary({ longTermGoal: 'Build a stronger system…' })
  assert.ok(codes(unicode).includes('summary-trailing-ellipsis'))
})

test('missing client contact configuration stays optional while configured invalid values block export', () => {
  const missing = validInput()
  missing.configuration = {
    CONTACT_EMAIL: '',
    CONSULTATION_URL: '',
    BRAND_URL: '',
  }
  const missingCodes = codes(missing)
  assert.ok(!missingCodes.some((code) => code.startsWith('configuration-')))

  const invalid = validInput()
  invalid.configuration = {
    CONTACT_EMAIL: 'snapshot-studio@localhost',
    CONSULTATION_URL: 'http://127.0.0.1:4173/consultation',
    BRAND_URL: 'https://github.com/mataindustries/snapshot-studio',
  }
  const invalidCodes = codes(invalid)
  assert.ok(invalidCodes.includes('configuration-contact-email-invalid'))
  assert.ok(invalidCodes.includes('configuration-consultation_url-invalid'))
  assert.ok(invalidCodes.includes('configuration-brand_url-invalid'))
})

test('configuration resolution hides absent or invalid optional output cleanly', () => {
  const resolved = resolveReportConfiguration({
    VITE_UPGRADEOS_CONTACT_EMAIL: '  snapshot-studio@localhost ',
    VITE_UPGRADEOS_CONSULTATION_URL: 'http://127.0.0.1:4173/consultation',
    VITE_UPGRADEOS_BRAND_URL: 'not-a-url',
  })
  assert.deepEqual(getRenderableReportConfiguration(resolved), {
    CONTACT_EMAIL: '',
    CONSULTATION_URL: '',
    BRAND_URL: '',
  })
})

test('client-facing configuration rejects development hosts and preserves explicit public values', () => {
  const invalidUrls = [
    'http://localhost:4173/consultation',
    'http://127.0.0.1/consultation',
    'http://127.9.8.7/consultation',
    'http://0.0.0.0/consultation',
    'http://[::1]/consultation',
    'https://snapshot.local/consultation',
    'https://snapshot.test/consultation',
    'https://github.com/mataindustries/snapshot-studio',
  ]
  invalidUrls.forEach((value) => assert.equal(isValidHttpUrl(value), false))
  assert.equal(isValidContactEmail('snapshot-studio@localhost'), false)
  assert.equal(isValidContactEmail('advisor@snapshot.local'), false)

  const publicConfiguration = resolveReportConfiguration({
    VITE_UPGRADEOS_CONTACT_EMAIL: 'advisor@product.company',
    VITE_UPGRADEOS_CONSULTATION_URL: 'https://product.company/consultation',
    VITE_UPGRADEOS_BRAND_URL: 'https://product.company',
  })
  assert.deepEqual(getRenderableReportConfiguration(publicConfiguration), {
    CONTACT_EMAIL: 'advisor@product.company',
    CONSULTATION_URL: 'https://product.company/consultation',
    BRAND_URL: 'https://product.company',
  })
})

test('every forbidden client token blocks resolved output case-insensitively', () => {
  const forbiddenValues = [
    'LOCAL BUSINESS',
    'local area',
    '[Category]',
    '[Business Name]',
    '[City]',
    'fictional',
    'https://example.com',
    'https://upgradeos.example',
    'https://harborpine.example',
    'demo-call',
    'placeholder record',
    'supplied review notes',
    'Audit complete',
    'http://localhost:4173/consultation',
    'http://127.0.0.1/consultation',
    'http://0.0.0.0/consultation',
    'http://[::1]/consultation',
    'snapshot-studio@localhost',
    'https://github.com/mataindustries/snapshot-studio',
  ]

  forbiddenValues.forEach((value) => {
    const input = validInput()
    input.resolvedOutput = { copy: value }
    assert.equal(
      validateReportForRender(input).valid,
      false,
      `Expected “${value}” to block export`,
    )
  })
})

test('audience nouns are deterministic by category', () => {
  const patientCategories = [
    'Dental',
    'Dentist',
    'Orthodontist',
    'Medical',
    'Clinic',
    'Med Spa',
    'Medical Spa',
  ]
  patientCategories.forEach((niche) => {
    assert.equal(getAudienceNoun(form({ niche, mainService: '' })).plural, 'patients')
  })

  const homeownerCategories = [
    'HVAC',
    'Heating and Air Conditioning',
    'Contractor',
    'General Contractor',
    'Home Services',
    'Plumbing',
    'Electrician',
    'Roofing',
    'Landscaping',
  ]
  homeownerCategories.forEach((niche) => {
    assert.equal(getAudienceNoun(form({ niche, mainService: '' })).plural, 'homeowners')
  })

  assert.deepEqual(getAudienceNoun(form({ niche: 'Attorney', mainService: '' })), {
    singular: 'customer',
    plural: 'customers',
  })
})

test('business-name fitting uses deterministic short through very-long classes', () => {
  assert.equal(getBusinessNameFitClass('Pine HVAC'), 'business-name-short')
  assert.equal(
    getBusinessNameFitClass('Harbor & Pine Heating Company'),
    'business-name-medium',
  )
  assert.equal(
    getBusinessNameFitClass('Harbor & Pine Residential Heating and Cooling Professionals'),
    'business-name-long',
  )
  assert.equal(
    getBusinessNameFitClass(
      'Harbor & Pine Residential Heating Air Conditioning and Indoor Environmental Services Incorporated',
    ),
    'business-name-very-long',
  )
})

test('sentence compression skips company abbreviations', () => {
  const first = 'Homeowners should recognize that Harbor & Pine Heating Co. handles emergency repair in Riverton.'
  const second = 'Lead with that message and one clear next step.'

  assert.equal(firstCompleteSentence(`${first} ${second}`), first)
})

test('report output generation tolerates missing optional URLs and notes', () => {
  const output = generateOutputs(
    form({
      websiteUrl: '',
      notes: '',
      weakness: '',
      competitorNote: '',
      competitorUrl1: '',
      competitorUrl2: '',
    }),
    validScores,
    63,
  )

  assert.match(output.snapshot, /Harbor & Pine Heating Co\./)
  assert.doesNotMatch(output.snapshot, /Website:\s*$/m)
  assert.doesNotMatch(output.snapshot, /(?:\.{3}|…)\s*$/m)
})
