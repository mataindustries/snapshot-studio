import type {
  ActionCategory,
  EvidenceItem,
  EvidenceSentiment,
  EvidenceType,
  RecommendedAction,
  RecommendedActionEffort,
  RecommendedActionImpact,
  SavedSnapshot,
  Scores,
  SnapshotForm,
  Tone,
} from '../../src/types.ts'
import { normalizeRecommendedAction } from '../../src/lib/actionPlanner.ts'
import { createStableId } from '../../src/lib/evidence.ts'
import { createGrowthFoundation } from '../../src/lib/growthPlanning.ts'
import { getTotalScore } from '../../src/lib/scoring.ts'
import {
  generateOutputs,
  getDigitalZodiac,
} from '../../src/templates/snapshotTemplates.ts'

type ActionSpec = {
  title: string
  category: ActionCategory
  description: string
  reason: string
  expectedOutcome: string
  effort: RecommendedActionEffort
  impact: RecommendedActionImpact
  hours: number
}

type EvidenceSpec = {
  title: string
  evidenceType: EvidenceType
  sentiment: EvidenceSentiment
  pageLabel: string
  observation: string
  whyItMatters: string
  recommendedChange: string
  mission: 1 | 2 | 3
}

type SampleManualSpec = {
  slug: string
  businessName: string
  city: string
  category: string
  primaryService: string
  businessType: string
  targetArchetype: string
  score: number
  originalScores: Scores
  scores: Scores
  archetypeAdjustment: string | null
  coverLine: string
  topAsset: string
  blindSpot: string
  fastestWin: string
  nextEvolution: string
  operatingDirection: string
  voice: string
  competitorNote: string
  competitiveAssets: string[]
  actions: [ActionSpec, ActionSpec, ActionSpec]
  evidence: [
    EvidenceSpec,
    EvidenceSpec,
    EvidenceSpec,
    EvidenceSpec,
    EvidenceSpec,
    EvidenceSpec,
  ]
  createdAt: string
}

export type SampleManualFixture = {
  slug: string
  fictionalSample: true
  targetArchetype: string
  actualArchetype: string
  score: number
  originalScores: Scores
  scores: Scores
  archetypeAdjustment: string | null
  coverLine: string
  fastestWin: string
  nextEvolution: string
  operatingDirection: string
  voice: string
  businessType: string
  snapshot: SavedSnapshot
}

const sampleSpecs: SampleManualSpec[] = [
  {
    slug: 'summit-comfort-heating-air',
    businessName: 'Summit Comfort Heating & Air',
    city: 'Glendora, California',
    category: 'Residential HVAC',
    primaryService: 'Same-day AC repair',
    businessType: 'Home services',
    targetArchetype: 'Reputation Magnet',
    score: 63,
    originalScores: {
      visibility: 14,
      trust: 17,
      conversion: 11,
      aiSearchReadiness: 9,
      competitorPosition: 12,
    },
    scores: {
      visibility: 14,
      trust: 17,
      conversion: 11,
      aiSearchReadiness: 9,
      competitorPosition: 12,
    },
    archetypeAdjustment: null,
    coverLine: 'Trust is already working. Urgent-service clarity is the next unlock.',
    topAsset: 'Sample review data records a 4.8 average across 126 reviews, with recurring mentions of respectful technicians, accurate arrival updates, and clean work areas.',
    blindSpot: 'The first screen says “Comfort you can count on” before naming same-day AC repair, Glendora, or the response process.',
    fastestWin: 'Lead with same-day AC repair in Glendora and set a clear callback expectation beside the request action.',
    nextEvolution: 'Turn strong customer trust into an urgent-service experience that is just as clear as the field work.',
    operatingDirection: 'Use the next 60–90 days to make urgent service unmistakable, move proof to the decision point, and define the response promise.',
    voice: 'Direct, practical, calm, and urgency-aware.',
    competitorNote: 'Nearby providers make same-day availability and dispatch expectations easier to compare from the first screen.',
    competitiveAssets: [
      'Same-day AC repair is the specific primary service recorded for Glendora homeowners.',
      'Glendora is the local service area recorded for the urgent repair offer.',
      'Licensed and insured residential HVAC service is recorded in the sample assessment.',
      'Arrival updates are already part of the customer experience described in the sample service pattern.',
      'Respectful technicians and clean work areas are recurring themes in the sample review record.',
    ],
    actions: [
      {
        title: 'Make same-day AC repair in Glendora unmistakable',
        category: 'Homepage',
        description: 'Rewrite the first screen around same-day AC repair in Glendora, one verified review cue, and one service-request action.',
        reason: 'Urgent homeowners need to confirm service fit and market coverage before they compare response promises.',
        expectedOutcome: 'same-day repair fit and the next step are expected to become easier to recognize at a glance',
        effort: 'Small',
        impact: 'High',
        hours: 3,
      },
      {
        title: 'Put technician proof beside the service request',
        category: 'Trust',
        description: 'Place verified review themes about respect, arrival updates, and clean work beside the request-service decision.',
        reason: 'The strongest customer proof should support the moment a homeowner decides whether to make contact.',
        expectedOutcome: 'verified technician proof is expected to reduce uncertainty at the service-request decision',
        effort: 'Medium',
        impact: 'High',
        hours: 5,
      },
      {
        title: 'Turn “Request Service” into a response promise',
        category: 'Calls To Action',
        description: 'Explain the callback window, the first triage questions, and what the homeowner can expect before dispatch.',
        reason: 'A generic request button leaves an urgent homeowner uncertain about timing and next steps.',
        expectedOutcome: 'the inquiry path is designed to feel more predictable without promising unavailable response times',
        effort: 'Large',
        impact: 'Medium',
        hours: 9,
      },
    ],
    evidence: [
      {
        title: 'Review themes support technician trust',
        evidenceType: 'Review Platform',
        sentiment: 'Strength',
        pageLabel: 'Sample public-profile review summary',
        observation: 'The sample review record shows a 4.8 average across 126 reviews and recurring praise for respectful technicians, arrival updates, and clean work areas.',
        whyItMatters: 'Specific homeowner proof can lower perceived risk before an urgent service request.',
        recommendedChange: 'Verify the current figures before delivery, then place the strongest themes beside the request action.',
        mission: 2,
      },
      {
        title: 'Licensing and insurance are recorded',
        evidenceType: 'Other',
        sentiment: 'Strength',
        pageLabel: 'Sample business-profile observation',
        observation: 'The sample assessment records licensed and insured residential HVAC service.',
        whyItMatters: 'Relevant credentials help homeowners screen an urgent provider before inviting a technician on-site.',
        recommendedChange: 'Confirm the current credentials and show them beside the urgent-service promise.',
        mission: 2,
      },
      {
        title: 'A service-request path already exists',
        evidenceType: 'Conversion Path',
        sentiment: 'Strength',
        pageLabel: 'Recorded contact-path observation',
        observation: 'The sample customer journey includes a visible request-service action on the first screen.',
        whyItMatters: 'The existing path can carry clearer response expectations without adding another contact choice.',
        recommendedChange: 'Keep one primary action and add the response promise directly beneath it.',
        mission: 3,
      },
      {
        title: 'The first-screen promise is too broad',
        evidenceType: 'Website',
        sentiment: 'Opportunity',
        pageLabel: 'Recorded homepage headline',
        observation: '“Comfort you can count on” appears before same-day AC repair, Glendora, or the response process.',
        whyItMatters: 'A homeowner with a failed system should recognize urgent service fit before comparing another provider.',
        recommendedChange: 'Lead with same-day AC repair in Glendora, then add one proof point and the request action.',
        mission: 1,
      },
      {
        title: 'Response timing is not defined',
        evidenceType: 'Conversion Path',
        sentiment: 'Opportunity',
        pageLabel: 'Recorded service-path observation',
        observation: 'The sample request path does not state when a homeowner should expect a callback or what happens before dispatch.',
        whyItMatters: 'Unclear timing can send urgent demand toward a provider with a more predictable first step.',
        recommendedChange: 'State a verified response window and the first triage step beside every primary request action.',
        mission: 3,
      },
      {
        title: 'Technician proof sits away from the decision',
        evidenceType: 'Website',
        sentiment: 'Opportunity',
        pageLabel: 'Public-facing website review',
        observation: 'The sample review themes are not summarized near the request-service decision.',
        whyItMatters: 'The most relevant proof is less useful when homeowners must search for it.',
        recommendedChange: 'Add a concise, verified proof block beside the service request.',
        mission: 2,
      },
    ],
    createdAt: '2026-07-01T16:00:00.000Z',
  },
  {
    slug: 'arroyo-dental-arts',
    businessName: 'Arroyo Dental Arts',
    city: 'Pasadena, California',
    category: 'Family and restorative dentistry',
    primaryService: 'Dental implants and full-mouth restoration',
    businessType: 'Dental practice',
    targetArchetype: 'Hidden Authority',
    score: 72,
    originalScores: {
      visibility: 12,
      trust: 19,
      conversion: 13,
      aiSearchReadiness: 12,
      competitorPosition: 16,
    },
    scores: {
      visibility: 7,
      trust: 19,
      conversion: 16,
      aiSearchReadiness: 14,
      competitorPosition: 16,
    },
    archetypeAdjustment: 'Reallocated five points from Visibility into Conversion and AI Search Readiness; total remains 72 and the profile now resolves to Hidden Authority.',
    coverLine: 'Clinical authority is established. The digital patient journey understates it.',
    topAsset: 'Sample practice data records eighteen years of local care, advanced restorative training, and a 4.9 average across 214 reviews.',
    blindSpot: 'Implants, cleanings, emergencies, cosmetics, and family care receive similar emphasis, hiding the practice’s restorative authority.',
    fastestWin: 'Make implants and full-mouth restoration the clear restorative path, then explain the first consultation.',
    nextEvolution: 'Make established restorative authority visible before patients begin comparing treatment options.',
    operatingDirection: 'Use the next 60–90 days to organize the implant decision, connect authority to patient concerns, and make the consultation predictable.',
    voice: 'Reassuring, precise, and clinical without sounding cold.',
    competitorNote: 'Comparison practices lead with implant candidacy, technology, and consultation steps more clearly.',
    competitiveAssets: [
      'Advanced restorative training supports the implant and full-mouth restoration focus.',
      'The sample patient journey includes a direct consultation request path to build on.',
      'A 4.9 sample review average across 214 reviews provides a strong reputation signal.',
      'Careful explanations and respectful care are recorded patient-experience themes.',
      'Eighteen years of local practice are recorded in the sample assessment.',
    ],
    actions: [
      {
        title: 'Build the complete implant decision page',
        category: 'Service Pages',
        description: 'Create one implant and full-mouth restoration page covering candidacy, sequence, options, proof, common concerns, and the consultation step.',
        reason: 'Patients need one coherent decision resource instead of assembling restorative details across broad service lists.',
        expectedOutcome: 'implant fit and the consultation path are expected to become easier for patients to evaluate',
        effort: 'Small',
        impact: 'High',
        hours: 8,
      },
      {
        title: 'Put clinical authority beside patient uncertainty',
        category: 'Trust',
        description: 'Place verified restorative training, experience, and relevant patient proof beside candidacy, comfort, and treatment-planning questions.',
        reason: 'Clinical authority matters most where a patient is deciding whether the practice understands a complex case.',
        expectedOutcome: 'verified restorative authority is expected to reduce uncertainty during treatment comparison',
        effort: 'Medium',
        impact: 'High',
        hours: 6,
      },
      {
        title: 'Make the first consultation feel predictable',
        category: 'Conversion',
        description: 'Explain what records to bring, what the first visit covers, who the patient meets, and what decisions do not need to be made that day.',
        reason: 'An undefined first appointment can make a complex restorative decision feel larger than it needs to be.',
        expectedOutcome: 'the consultation request is designed to feel clearer and lower-pressure for prospective patients',
        effort: 'Large',
        impact: 'Medium',
        hours: 10,
      },
    ],
    evidence: [
      {
        title: 'Long local tenure supports continuity',
        evidenceType: 'Other',
        sentiment: 'Strength',
        pageLabel: 'Sample practice-profile observation',
        observation: 'The sample practice profile records eighteen years of care in the Pasadena market.',
        whyItMatters: 'Continuity can reassure patients considering a multi-step restorative treatment plan.',
        recommendedChange: 'Confirm the tenure and connect it to long-term restorative follow-through.',
        mission: 2,
      },
      {
        title: 'Advanced restorative training is available',
        evidenceType: 'Other',
        sentiment: 'Strength',
        pageLabel: 'Recorded credential observation',
        observation: 'The sample assessment records advanced training relevant to implants and full-mouth restoration.',
        whyItMatters: 'Relevant credentials help patients evaluate clinical fit for a complex treatment decision.',
        recommendedChange: 'Verify the training details and place them beside the restorative process.',
        mission: 2,
      },
      {
        title: 'Review proof supports the patient experience',
        evidenceType: 'Review Platform',
        sentiment: 'Strength',
        pageLabel: 'Sample public-profile review summary',
        observation: 'The sample review record shows a 4.9 average across 214 reviews, with themes of careful explanations and respectful care.',
        whyItMatters: 'Patient experience proof can make a high-consideration consultation feel less uncertain.',
        recommendedChange: 'Confirm the current figures and feature the most relevant restorative themes.',
        mission: 2,
      },
      {
        title: 'Restorative authority is diluted by the service list',
        evidenceType: 'Website',
        sentiment: 'Opportunity',
        pageLabel: 'Public-facing website review',
        observation: 'Implants, cleanings, emergencies, cosmetics, and family care receive similar first-level emphasis.',
        whyItMatters: 'Patients may not recognize the practice as a restorative option before comparing specialists.',
        recommendedChange: 'Create a clear restorative pathway led by implants and full-mouth restoration.',
        mission: 1,
      },
      {
        title: 'Implant decision questions are fragmented',
        evidenceType: 'Website',
        sentiment: 'Opportunity',
        pageLabel: 'Recorded service-path observation',
        observation: 'The sample service review does not present candidacy, sequence, alternatives, and consultation expectations in one place.',
        whyItMatters: 'Patients must assemble a complex decision without a complete clinical guide.',
        recommendedChange: 'Build one decision page that resolves the major pre-consultation questions.',
        mission: 1,
      },
      {
        title: 'The first consultation is not fully explained',
        evidenceType: 'Conversion Path',
        sentiment: 'Opportunity',
        pageLabel: 'Recorded contact-path observation',
        observation: 'The sample consultation path asks patients to request an appointment before explaining what the first visit includes.',
        whyItMatters: 'A high-consideration treatment feels riskier when the first step is undefined.',
        recommendedChange: 'Set expectations for records, examination, discussion, and next decisions before the request.',
        mission: 3,
      },
    ],
    createdAt: '2026-07-02T16:00:00.000Z',
  },
  {
    slug: 'maison-luma-aesthetics',
    businessName: 'Maison Luma Aesthetics',
    city: 'Arcadia, California',
    category: 'Medical spa',
    primaryService: 'Natural-looking injectables',
    businessType: 'Medical aesthetics practice',
    targetArchetype: 'Category Builder',
    score: 54,
    originalScores: {
      visibility: 11,
      trust: 12,
      conversion: 10,
      aiSearchReadiness: 9,
      competitorPosition: 12,
    },
    scores: {
      visibility: 11,
      trust: 12,
      conversion: 10,
      aiSearchReadiness: 9,
      competitorPosition: 12,
    },
    archetypeAdjustment: null,
    coverLine: 'The experience feels premium. The offer still asks visitors to assemble the story themselves.',
    topAsset: 'A natural-results philosophy is supported by a sample visual library and an engaged sample social audience.',
    blindSpot: 'Twenty-five treatments and promotions compete before visitors understand the signature point of view or consultation process.',
    fastestWin: 'Lead with the natural-injectables point of view and show what the consultation is designed to protect.',
    nextEvolution: 'Own a restrained natural-injectables category instead of presenting a menu of unrelated treatments.',
    operatingDirection: 'Use the next 60–90 days to establish the signature, convert visual proof into decision proof, and make the consultation feel considered.',
    voice: 'Editorial, restrained, confident, and premium; no hype or exaggerated results.',
    competitorNote: 'Nearby med spas often lead with promotions, leaving room for a calmer, philosophy-led position.',
    competitiveAssets: [
      'A natural-results philosophy gives the practice a distinct point of view.',
      'Natural-looking injectables provide a focused specialty to own in Arcadia.',
      'The sample visual library shows a restrained patient experience across several presentation styles.',
      'An educational publishing process earns engagement without promotion-led claims.',
      'The consultation path already exists and can carry clearer expectations.',
    ],
    actions: [
      {
        title: 'Establish the natural-injectables signature',
        category: 'Brand Positioning',
        description: 'Lead with a clear natural-results philosophy, define who it fits, and organize the treatment menu beneath that signature.',
        reason: 'A memorable point of view helps visitors understand the practice before comparing promotions.',
        expectedOutcome: 'the natural-injectables specialty is expected to become easier to remember and compare',
        effort: 'Small',
        impact: 'High',
        hours: 4,
      },
      {
        title: 'Turn visual proof into decision proof',
        category: 'Trust',
        description: 'Curate verified visual examples by concern, treatment intent, and restraint, with context that avoids implying identical results.',
        reason: 'A large visual library needs decision context before it can reduce uncertainty.',
        expectedOutcome: 'curated visual context is expected to help patients evaluate philosophy and fit without exaggerated claims',
        effort: 'Medium',
        impact: 'High',
        hours: 8,
      },
      {
        title: 'Explain the consultation before asking for the booking',
        category: 'Conversion',
        description: 'Describe the goals discussion, assessment, recommendation boundaries, pricing conversation, and no-pressure next step before booking.',
        reason: 'Visitors should understand the professional consultation before committing to the appointment.',
        expectedOutcome: 'the booking decision is designed to feel more informed and less promotion-led',
        effort: 'Large',
        impact: 'Medium',
        hours: 10,
      },
    ],
    evidence: [
      {
        title: 'A natural-results philosophy is present',
        evidenceType: 'Website',
        sentiment: 'Strength',
        pageLabel: 'Recorded positioning observation',
        observation: 'The sample source material repeatedly emphasizes subtle, natural-looking treatment choices.',
        whyItMatters: 'A consistent philosophy gives patients a reason to choose the practice beyond a treatment list.',
        recommendedChange: 'Turn the philosophy into the lead promise and define what it means in practice.',
        mission: 1,
      },
      {
        title: 'Visual proof is available to curate',
        evidenceType: 'Social Profile',
        sentiment: 'Strength',
        pageLabel: 'Sample visual-library observation',
        observation: 'The sample content library documents a restrained patient experience through varied treatment images.',
        whyItMatters: 'Relevant visual context can help patients judge whether the practice’s style matches their goals.',
        recommendedChange: 'Verify consent and accuracy, then organize examples by concern and treatment intent.',
        mission: 2,
      },
      {
        title: 'An educational publishing process earns engagement',
        evidenceType: 'Social Profile',
        sentiment: 'Strength',
        pageLabel: 'Sample social-profile observation',
        observation: 'The sample educational publishing process shows stronger engagement than promotion-led posts.',
        whyItMatters: 'Education can support a premium position without relying on urgency or exaggerated results.',
        recommendedChange: 'Use the strongest educational themes to frame the signature consultation.',
        mission: 1,
      },
      {
        title: 'The treatment menu leads the story',
        evidenceType: 'Website',
        sentiment: 'Opportunity',
        pageLabel: 'Public-facing website review',
        observation: 'Twenty-five treatments and rotating promotions appear before the signature point of view is clear.',
        whyItMatters: 'Patients must assemble the practice’s specialty from a broad menu.',
        recommendedChange: 'Organize the offer around the natural-injectables signature and supporting concerns.',
        mission: 1,
      },
      {
        title: 'Visual examples lack decision context',
        evidenceType: 'Social Profile',
        sentiment: 'Opportunity',
        pageLabel: 'Recorded proof-path observation',
        observation: 'The sample visual library does not consistently explain the concern, treatment intent, or limits of comparison.',
        whyItMatters: 'Images alone can create ambiguity or unrealistic comparison expectations.',
        recommendedChange: 'Add concise context while preserving clear boundaries around individual results.',
        mission: 2,
      },
      {
        title: 'Consultation expectations arrive too late',
        evidenceType: 'Conversion Path',
        sentiment: 'Opportunity',
        pageLabel: 'Recorded contact-path observation',
        observation: 'The sample booking path asks for an appointment before explaining the assessment and recommendation process.',
        whyItMatters: 'Patients considering injectables may hesitate when the professional first step is undefined.',
        recommendedChange: 'Explain the consultation sequence before the booking request.',
        mission: 3,
      },
    ],
    createdAt: '2026-07-03T16:00:00.000Z',
  },
  {
    slug: 'foothill-shield-roofing',
    businessName: 'Foothill Shield Roofing',
    city: 'Monrovia, California',
    category: 'Residential roofing',
    primaryService: 'Leak diagnosis and roof repair',
    businessType: 'Home services',
    targetArchetype: 'Sleeping Giant',
    score: 58,
    originalScores: {
      visibility: 11,
      trust: 17,
      conversion: 9,
      aiSearchReadiness: 8,
      competitorPosition: 13,
    },
    scores: {
      visibility: 11,
      trust: 16,
      conversion: 9,
      aiSearchReadiness: 8,
      competitorPosition: 14,
    },
    archetypeAdjustment: 'Reallocated one point from Trust to Competitive Position; total remains 58 and the profile now resolves to Sleeping Giant.',
    coverLine: 'Twenty-seven years of operating credibility are present. The website still behaves like a digital brochure.',
    topAsset: 'Sample company data records twenty-seven years of local roofing work, licensing and insurance, and a 4.8 average across 64 reviews mentioning honest repair recommendations.',
    blindSpot: 'A homeowner with an active leak cannot quickly understand the inspection process, response window, documentation standard, or repair-versus-replacement criteria.',
    fastestWin: 'Define the leak inspection as a named service with a clear arrival, documentation, and recommendation sequence.',
    nextEvolution: 'Turn established field judgment into a visible inspection standard homeowners can evaluate before calling.',
    operatingDirection: 'Use the next 60–90 days to productize leak diagnosis, document repair decisions, and separate urgent work from planned replacement.',
    voice: 'Plainspoken, inspection-led, risk-aware, and skeptical of sales pressure.',
    competitorNote: 'Several nearby roofers lead with replacement offers, leaving room for a credible diagnosis-first position.',
    competitiveAssets: [
      'Leak diagnosis and roof repair provide a specific specialty to lead with.',
      'Project photography can become a clear case-file structure for repair decisions.',
      'Licensing and insurance are part of the recorded operating foundation.',
      'Sample reviews repeatedly mention honest repair recommendations rather than automatic replacement pressure.',
      'Twenty-seven years of local roofing work are recorded in the sample company profile.',
    ],
    actions: [
      {
        title: 'Productize the leak inspection',
        category: 'Conversion',
        description: 'Name the inspection, define the response window, explain the roof and attic checks, and show the documentation delivered afterward.',
        reason: 'An active leak requires a predictable first step before a homeowner can compare repair advice.',
        expectedOutcome: 'the inspection request is expected to feel more concrete and less sales-led',
        effort: 'Small',
        impact: 'High',
        hours: 4,
      },
      {
        title: 'Convert project photos into roof case files',
        category: 'Content',
        description: 'Turn selected project photos into concise case files showing the symptom, diagnosis, documented choice, repair, and verification.',
        reason: 'Unlabeled photos do not show the judgment behind an honest repair recommendation.',
        expectedOutcome: 'documented case context is expected to make repair judgment easier for homeowners to assess',
        effort: 'Medium',
        impact: 'High',
        hours: 8,
      },
      {
        title: 'Separate urgent repair from planned replacement',
        category: 'Brand Positioning',
        description: 'Create distinct paths for active leaks, repairable conditions, maintenance planning, and replacement consultations.',
        reason: 'Homeowners under time pressure should not have to interpret one broad roofing offer.',
        expectedOutcome: 'urgent repair and planned replacement are designed to become easier to compare without sales pressure',
        effort: 'Large',
        impact: 'Medium',
        hours: 12,
      },
    ],
    evidence: [
      {
        title: 'Long tenure supports local credibility',
        evidenceType: 'Other',
        sentiment: 'Strength',
        pageLabel: 'Sample company-profile observation',
        observation: 'The sample company profile records twenty-seven years of local roofing work.',
        whyItMatters: 'Long operating history can reduce uncertainty when homeowners need a consequential roof decision.',
        recommendedChange: 'Confirm the tenure and connect it to the diagnosis and documentation standard.',
        mission: 1,
      },
      {
        title: 'Licensing and insurance are recorded',
        evidenceType: 'Other',
        sentiment: 'Strength',
        pageLabel: 'Recorded credential observation',
        observation: 'The sample assessment records current licensing and insurance as proof points requiring delivery verification.',
        whyItMatters: 'Verified credentials are foundational when work affects the structure and weather protection of a home.',
        recommendedChange: 'Confirm current status and place the proof beside the inspection request.',
        mission: 1,
      },
      {
        title: 'Review themes support diagnosis-first trust',
        evidenceType: 'Review Platform',
        sentiment: 'Strength',
        pageLabel: 'Sample public-profile review summary',
        observation: 'The sample review record shows a 4.8 average across 64 reviews and recurring mentions of honest repair recommendations.',
        whyItMatters: 'Homeowners want evidence that replacement will not be recommended without a reason.',
        recommendedChange: 'Verify the figures and feature the diagnosis-first review theme near the inspection path.',
        mission: 2,
      },
      {
        title: 'The leak inspection is not defined',
        evidenceType: 'Conversion Path',
        sentiment: 'Opportunity',
        pageLabel: 'Recorded service-path observation',
        observation: 'The sample path does not explain the response window, inspection sequence, documentation, or recommendation criteria.',
        whyItMatters: 'A homeowner with an active leak needs a predictable first step before making contact.',
        recommendedChange: 'Publish a named inspection standard with a clear deliverable.',
        mission: 1,
      },
      {
        title: 'Project photos do not explain the repair decision',
        evidenceType: 'Website',
        sentiment: 'Opportunity',
        pageLabel: 'Recorded project-gallery observation',
        observation: 'The sample project gallery shows roof work without consistently labeling the symptom, diagnosis, or verification.',
        whyItMatters: 'Photos cannot demonstrate honest judgment unless the decision path is visible.',
        recommendedChange: 'Convert selected projects into concise, documented roof case files.',
        mission: 2,
      },
      {
        title: 'Urgent repair and replacement share one path',
        evidenceType: 'Website',
        sentiment: 'Opportunity',
        pageLabel: 'Public-facing website review',
        observation: 'The sample service structure presents leak repair and replacement within one broad roofing path.',
        whyItMatters: 'Homeowners with different risk and timing needs cannot quickly identify the right next step.',
        recommendedChange: 'Separate urgent diagnosis from planned replacement guidance.',
        mission: 3,
      },
    ],
    createdAt: '2026-07-04T16:00:00.000Z',
  },
  {
    slug: 'canopy-stone-tree-care',
    businessName: 'Canopy & Stone Tree Care',
    city: 'West Covina, California',
    category: 'Tree service',
    primaryService: 'Emergency hazard-tree response',
    businessType: 'Home services',
    targetArchetype: 'Reputation Magnet',
    score: 66,
    originalScores: {
      visibility: 15,
      trust: 18,
      conversion: 11,
      aiSearchReadiness: 10,
      competitorPosition: 12,
    },
    scores: {
      visibility: 15,
      trust: 18,
      conversion: 11,
      aiSearchReadiness: 10,
      competitorPosition: 12,
    },
    archetypeAdjustment: null,
    coverLine: 'Neighbors already trust the crew. The emergency path needs to communicate safety with the same confidence.',
    topAsset: 'Sample review data records a 4.9 average across 176 reviews, with recurring mentions of careful rigging, complete cleanup, and honest advice about whether a tree can be saved.',
    blindSpot: 'The emergency page does not clearly show triage questions, insurance proof, arrival expectations, or property-protection procedures.',
    fastestWin: 'Publish the first emergency triage questions and safety checks beside the call action.',
    nextEvolution: 'Turn neighbor trust into a visible emergency-response standard grounded in safety and property protection.',
    operatingDirection: 'Use the next 60–90 days to define emergency triage, place safety proof at the call decision, and document hazard resolution.',
    voice: 'Safety-first, neighborly, concise, and operational.',
    competitorNote: 'Nearby tree services emphasize rapid response but provide less detail about triage and property protection.',
    competitiveAssets: [
      'Careful rigging and complete cleanup are recurring themes in the sample service record.',
      'Emergency hazard-tree response is a clear high-intent service focus.',
      'Honest advice about whether a tree can be saved supports a preservation-first approach.',
      'Insurance proof is recorded as an available trust signal for emergency work.',
      'Job photography is available and can show how hazards were resolved safely.',
    ],
    actions: [
      {
        title: 'Build the emergency hazard-response standard',
        category: 'FAQ',
        description: 'Publish the triage questions, immediate safety steps, arrival expectations, crew process, and property-protection sequence.',
        reason: 'A homeowner facing a damaged tree needs to understand the response before the crew arrives.',
        expectedOutcome: 'the emergency response path is expected to become clearer without guaranteeing arrival times',
        effort: 'Small',
        impact: 'High',
        hours: 5,
      },
      {
        title: 'Put safety proof beside “Call Now”',
        category: 'Trust',
        description: 'Place verified insurance, careful-rigging proof, cleanup expectations, and one relevant review theme beside the emergency call action.',
        reason: 'Safety proof is most useful when a homeowner is deciding who should enter a hazardous property.',
        expectedOutcome: 'verified safety proof is expected to reduce uncertainty at the emergency call decision',
        effort: 'Medium',
        impact: 'High',
        hours: 6,
      },
      {
        title: 'Turn job photos into hazard-resolution stories',
        category: 'Content',
        description: 'Create concise case stories showing the hazard, protection plan, rigging approach, cleanup, and final site condition.',
        reason: 'Unlabeled job photos do not explain how the crew managed risk or protected the property.',
        expectedOutcome: 'documented job context is designed to make the crew’s safety process easier to evaluate',
        effort: 'Large',
        impact: 'Medium',
        hours: 12,
      },
    ],
    evidence: [
      {
        title: 'Review themes support careful field work',
        evidenceType: 'Review Platform',
        sentiment: 'Strength',
        pageLabel: 'Sample public-profile review summary',
        observation: 'The sample review record shows a 4.9 average across 176 reviews and recurring mentions of careful rigging and complete cleanup.',
        whyItMatters: 'Specific homeowner proof can reduce uncertainty when the work involves property and safety risk.',
        recommendedChange: 'Verify the current figures and place the strongest safety themes beside the emergency call action.',
        mission: 2,
      },
      {
        title: 'Preservation-first advice is a reputation asset',
        evidenceType: 'Other',
        sentiment: 'Strength',
        pageLabel: 'Sample preservation-guidance observation',
        observation: 'The sample assessment includes clear advice about whether a tree can be saved.',
        whyItMatters: 'Preservation-first guidance gives homeowners a reason to trust the diagnosis, not just the removal work.',
        recommendedChange: 'Verify and summarize the theme near the hazard-assessment process.',
        mission: 1,
      },
      {
        title: 'Insurance proof is available',
        evidenceType: 'Other',
        sentiment: 'Strength',
        pageLabel: 'Recorded credential observation',
        observation: 'The sample assessment records insurance proof as available for emergency tree work.',
        whyItMatters: 'Homeowners need verified risk protection before work begins around structures and utilities.',
        recommendedChange: 'Confirm current coverage and place the proof beside the emergency contact path.',
        mission: 2,
      },
      {
        title: 'Emergency triage is not explained',
        evidenceType: 'Website',
        sentiment: 'Opportunity',
        pageLabel: 'Recorded emergency-page observation',
        observation: 'The sample emergency page does not list the first triage questions, immediate safety steps, or arrival expectations.',
        whyItMatters: 'A homeowner facing a hazard needs useful direction before a crew can assess the site.',
        recommendedChange: 'Publish a concise emergency response standard and verified timing language.',
        mission: 1,
      },
      {
        title: 'Safety proof is separated from the call action',
        evidenceType: 'Conversion Path',
        sentiment: 'Opportunity',
        pageLabel: 'Recorded contact-path observation',
        observation: 'The sample call path does not place insurance, rigging, or cleanup proof beside the emergency decision.',
        whyItMatters: 'Homeowners should not have to search for risk-control proof during an urgent situation.',
        recommendedChange: 'Build a compact safety proof block around the primary call action.',
        mission: 2,
      },
      {
        title: 'Job photos do not show hazard resolution',
        evidenceType: 'Website',
        sentiment: 'Opportunity',
        pageLabel: 'Recorded project-gallery observation',
        observation: 'The sample job gallery does not consistently explain the hazard, protection plan, or final site condition.',
        whyItMatters: 'Photos alone cannot show how the crew controlled risk or protected the property.',
        recommendedChange: 'Turn selected jobs into concise hazard-resolution stories.',
        mission: 3,
      },
    ],
    createdAt: '2026-07-05T16:00:00.000Z',
  },
]

function createAction(
  spec: SampleManualSpec,
  action: ActionSpec,
  index: number,
): RecommendedAction {
  const normalized = normalizeRecommendedAction({
    id: createStableId('sample-action', [spec.slug, index + 1]),
    title: action.title,
    description: action.description,
    category: action.category,
    estimatedEffort: action.effort,
    estimatedImpact: action.impact,
    estimatedHours: action.hours,
    reason: action.reason,
    expectedOutcome: action.expectedOutcome,
    objective: action.description,
    businessValue: action.expectedOutcome,
    status: 'Not Started',
    blockedBy: [],
    unlocks: [],
    recommendedOrder: index + 1,
    linkedEvidenceIds: [],
  }, index, spec.scores)

  if (!normalized) throw new Error(`Could not normalize action ${index + 1} for ${spec.businessName}.`)
  return normalized
}

function createEvidence(
  spec: SampleManualSpec,
  item: EvidenceSpec,
  index: number,
  actions: RecommendedAction[],
): EvidenceItem {
  const action = actions[item.mission - 1]
  const reportReady = index === 0 || index === 3
  const linkedActionIds = new Set([
    action.id,
    ...(index === 0 ? [actions[1].id] : []),
    ...(index === 3 ? [actions[2].id] : []),
  ])
  const timestamp = spec.createdAt
  return {
    id: createStableId('sample-evidence', [spec.slug, index + 1]),
    evidenceType: item.evidenceType,
    sentiment: item.sentiment,
    title: item.title,
    sourceUrl: '',
    pageLabel: item.pageLabel,
    observation: item.observation,
    whyItMatters: item.whyItMatters,
    recommendedChange: reportReady ? item.recommendedChange : '',
    expectedOutcome: '',
    linkedActionIds: Array.from(linkedActionIds),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function createSnapshot(spec: SampleManualSpec): SavedSnapshot {
  const score = getTotalScore(spec.scores)
  if (score !== spec.score) {
    throw new Error(`${spec.businessName}: dimensions total ${score}, expected ${spec.score}.`)
  }
  const archetype = getDigitalZodiac(spec.scores, score)
  if (archetype !== spec.targetArchetype) {
    throw new Error(`${spec.businessName}: ${archetype} does not match target ${spec.targetArchetype}.`)
  }

  const form: SnapshotForm = {
    businessName: spec.businessName,
    websiteUrl: '',
    city: spec.city,
    niche: spec.category,
    mainService: spec.primaryService,
    notes: spec.topAsset,
    weakness: spec.blindSpot,
    competitorNote: spec.competitorNote,
    competitorUrl1: '',
    competitorUrl2: '',
    tone: 'premium' satisfies Tone,
    ctaStyle: 'book-call',
  }
  const actions = spec.actions.map((action, index) => createAction(spec, action, index))
  const evidenceItems = spec.evidence.map((item, index) =>
    createEvidence(spec, item, index, actions),
  )
  const actionsWithEvidence = actions.map((action) => {
    const linkedEvidenceIds = evidenceItems
      .filter((item) => item.linkedActionIds.includes(action.id))
      .map((item) => item.id)
    return {
      ...action,
      linkedEvidence: linkedEvidenceIds,
      linkedEvidenceIds,
    }
  })
  const foundation = createGrowthFoundation(spec.scores)

  return {
    ...form,
    ...foundation,
    id: `sample-manual-${spec.slug}`,
    createdAt: spec.createdAt,
    scores: spec.scores,
    outputs: generateOutputs(form, spec.scores, score),
    branding: {
      preparedBy: 'Snapshot Studio',
      brandName: 'Snapshot Studio · Sample Operating Manual',
      contactLine: '',
    },
    offerMode: 'Hide Pricing',
    fixedPrice: '',
    currency: 'USD',
    customInvestmentText: '',
    ctaHeadline: 'Turn the operating priorities into measurable progress.',
    ctaBody: 'Choose the first mission, confirm ownership and access, then capture dated evidence as the work moves forward. Record another Snapshot after implementation to verify what changed.',
    ctaLabel: 'Plan the first mission',
    ctaContactLine: '',
    bookingUrl: '',
    strengths: spec.competitiveAssets,
    visibilityLeaks: [spec.blindSpot],
    operatorDraftAppliedAt: spec.createdAt,
    recommendedActions: actionsWithEvidence,
    actionStatusHistory: [],
    expectedOutcomes: actionsWithEvidence.map((action) => action.expectedOutcome),
    evidenceItems,
    includeIncompleteEvidence: false,
    progressStatus: 'Planning',
    reviewDate: '',
  }
}

export const sampleManualFixtures: SampleManualFixture[] = sampleSpecs.map((spec) => {
  const snapshot = createSnapshot(spec)
  return {
    slug: spec.slug,
    fictionalSample: true,
    targetArchetype: spec.targetArchetype,
    actualArchetype: getDigitalZodiac(spec.scores, spec.score),
    score: spec.score,
    originalScores: spec.originalScores,
    scores: spec.scores,
    archetypeAdjustment: spec.archetypeAdjustment,
    coverLine: spec.coverLine,
    fastestWin: spec.fastestWin,
    nextEvolution: spec.nextEvolution,
    operatingDirection: spec.operatingDirection,
    voice: spec.voice,
    businessType: spec.businessType,
    snapshot,
  }
})

export function getSampleManualFixture(slug: string) {
  return sampleManualFixtures.find((fixture) => fixture.slug === slug)
}
