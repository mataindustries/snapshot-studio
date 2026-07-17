import type {
  ActionCategory,
  EvidenceItem,
  RecommendedAction,
  ScoreKey,
  Scores,
  SnapshotForm,
} from '../types'
import {
  getDisplayBusinessName,
  getDisplayCity,
  getRecommendationSubject,
  hasClientFacingValue,
} from './reportDisplay'
import { isEvidenceReportReady } from './evidence'

export type StrategicAssetSource =
  | 'Verified observation'
  | 'Operator-provided'
  | 'Measured Foundation'

export type StrategicAsset = {
  title: string
  explanation: string
  whyItMatters: string
  leverage: string
  sourceLabel: StrategicAssetSource
}

export type FeaturedOpportunity = {
  title: string
  currentSituation: string
  whyItMatters: string
  recommendedFirstMove: string
  potentialBusinessBenefit: string
  evidenceTitle?: string
}

export type ImplementationPath = {
  option: 'Option A' | 'Option B'
  title: string
  description: string
  includes: string[]
  featured?: boolean
}

export type ReportStory = {
  strategicAssets: StrategicAsset[]
  featuredOpportunity: FeaturedOpportunity
}

export const implementationPaths: readonly ImplementationPath[] = [
  {
    option: 'Option A',
    title: 'DIY',
    description: 'Follow the included roadmap yourself, in the recommended order.',
    includes: [
      'Use the 48-hour sprint to create early momentum',
      'Work through the 30-day blueprint one week at a time',
      'Run another Snapshot after implementation to verify progress',
    ],
  },
  {
    option: 'Option B',
    title: '48-Hour Visibility Sprint',
    description: 'Professional implementation focused on the highest-priority improvements.',
    includes: [
      'Evidence review',
      'Website improvements',
      'Implementation of highest-priority actions',
      'Updated Snapshot',
      'Progress review',
    ],
    featured: true,
  },
] as const

export const upgradeOsSupportingText =
  'UpgradeOS helps local businesses become easier to discover, easier to trust, and easier to choose through structured improvement plans.'

export const preliminaryEvidenceNote =
  'This preliminary Snapshot is based on a manual public-facing review. Screenshot-backed evidence can be added during implementation planning.'

const scoreKeys: ScoreKey[] = [
  'visibility',
  'trust',
  'conversion',
  'aiSearchReadiness',
  'competitorPosition',
]

const scoreLabel: Record<ScoreKey, string> = {
  visibility: 'visibility',
  trust: 'trust',
  conversion: 'conversion',
  aiSearchReadiness: 'AI understanding',
  competitorPosition: 'market position',
}

function assetTitle(key: ScoreKey, score: number) {
  const titles: Record<ScoreKey, [string, string]> = {
    visibility: ['Local relevance to build on', 'Strong local visibility'],
    trust: ['Credibility cues to build on', 'Established trust'],
    conversion: ['Contact path to build on', 'Clear contact path'],
    aiSearchReadiness: ['Business information to build on', 'Clear AI understanding'],
    competitorPosition: ['Positioning foundation', 'Distinct market position'],
  }

  return titles[key][score >= 16 ? 1 : 0]
}

function measuredAsset(key: ScoreKey, score: number, form: SnapshotForm): StrategicAsset {
  const businessName = getDisplayBusinessName(form)
  const service = getRecommendationSubject(form)
  const city = getDisplayCity(form)
  const focus: Record<ScoreKey, string> = {
    visibility: 'how clearly ' + service + ' connects to ' + city,
    trust: 'the credibility signals available to a first-time visitor',
    conversion: 'the path from interest to a call or request',
    aiSearchReadiness: 'how explicitly services, location, proof, and common questions are explained',
    competitorPosition: 'how confidently the offer can be compared with nearby alternatives',
  }
  const why: Record<ScoreKey, string> = {
    visibility: 'Clear local relevance helps the right customer recognize fit without extra searching.',
    trust: 'Credible proof reduces uncertainty at the moment a visitor is deciding what to do next.',
    conversion: 'A usable contact path preserves intent and reduces avoidable conversion friction.',
    aiSearchReadiness: 'Explicit business information improves understanding for both people and AI systems.',
    competitorPosition: 'A supportable point of difference gives comparison shoppers more decision confidence.',
  }
  const leverage: Record<ScoreKey, string> = {
    visibility: 'Repeat the strongest service-and-location language across the homepage, service pages, and local profile.',
    trust: 'Place the most relevant reviews, credentials, and outcomes beside primary calls to action.',
    conversion: 'Standardize the next-step promise across buttons, forms, phone links, and mobile layouts.',
    aiSearchReadiness: 'Turn core facts and customer questions into short, direct, well-labeled answers.',
    competitorPosition: 'Carry the clearest differentiator into headlines, proof sections, and service comparisons.',
  }

  return {
    title: assetTitle(key, score),
    explanation: businessName + "'s " + scoreLabel[key] + ' score is ' + score + '/20. This is a measured planning signal about ' + focus[key] + ', not a verified factual claim.',
    whyItMatters: why[key],
    leverage: leverage[key],
    sourceLabel: 'Measured Foundation',
  }
}

function buildStrategicAssets(form: SnapshotForm, scores: Scores, evidenceItems: EvidenceItem[]) {
  const assets: StrategicAsset[] = []
  const seen = new Set<string>()
  const add = (asset: StrategicAsset) => {
    const key = asset.title.trim().toLocaleLowerCase()
    if (!key || seen.has(key) || assets.length >= 5) return
    seen.add(key)
    assets.push(asset)
  }

  evidenceItems
    .filter((item) => item.sentiment === 'Strength' && isEvidenceReportReady(item))
    .forEach((item) => add({
      title: item.observation.trim(),
      explanation: item.title.trim() + (item.pageLabel.trim() ? ' — ' + item.pageLabel.trim() : ''),
      whyItMatters: item.whyItMatters.trim(),
      leverage: item.recommendedChange.trim(),
      sourceLabel: 'Verified observation',
    }))

  if (form.notes.trim()) {
    add({
      title: form.notes.trim(),
      explanation: 'This strength was recorded directly in the operator review notes.',
      whyItMatters: 'Operator-entered context can identify credible details that should remain visible in the improvement plan.',
      leverage: 'Confirm the detail against the public-facing experience and place it near the most relevant customer decision point.',
      sourceLabel: 'Operator-provided',
    })
  }

  if (hasClientFacingValue(form.mainService)) {
    const service = getRecommendationSubject(form)
    add({
      title: service + ' focus',
      explanation: service + ' is the specific primary service recorded for this Snapshot.',
      whyItMatters: 'A specific service focus makes recommendations and customer-facing copy more decision-ready.',
      leverage: 'Use the same service language consistently across the homepage, focused service page, proof, and calls to action.',
      sourceLabel: 'Operator-provided',
    })
  }

  if (hasClientFacingValue(form.city)) {
    const city = getDisplayCity(form)
    add({
      title: city + ' service area',
      explanation: city + ' is the market recorded for this Snapshot.',
      whyItMatters: 'Clear market context helps local customers recognize whether the business serves their area.',
      leverage: 'Connect the city to the specific service wherever local fit affects the customer decision.',
      sourceLabel: 'Operator-provided',
    })
  }

  const ranked = scoreKeys
    .map((key, index) => ({ key, score: scores[key], index }))
    .sort((left, right) => right.score - left.score || left.index - right.index)

  ranked.forEach(({ key, score }) => {
    if (assets.length < 3) add(measuredAsset(key, score, form))
  })

  return assets
}

function currentSituationFor(category: ActionCategory, form: SnapshotForm) {
  const service = getRecommendationSubject(form)
  const city = getDisplayCity(form)

  if (category === 'Homepage' || category === 'Brand Positioning') {
    return 'The first screen can state ' + service + ', ' + city + ', credible proof, and the next step more clearly.'
  }
  if (category === 'Trust' || category === 'Reviews') {
    return 'Relevant proof can sit closer to the point where a visitor decides whether to make contact.'
  }
  if (category === 'Service Pages' || category === 'Authority' || category === 'Content' || category === 'FAQ') {
    return service + ' expertise and service detail can be organized into a more complete decision resource.'
  }
  if (category === 'Conversion' || category === 'Calls To Action' || category === 'Mobile UX') {
    return 'The contact path can explain the next step with less uncertainty and less conversion friction.'
  }
  if (category === 'Local SEO' || category === 'Google Business Profile') {
    return service + ' and ' + city + ' details can be made more consistent across the website and local profile.'
  }

  return 'Core ' + service + ' facts can be structured more explicitly so visitors and AI systems interpret them consistently.'
}

function findSupportingEvidence(action: RecommendedAction, evidenceItems: EvidenceItem[]) {
  return evidenceItems.find(
    (item) => action.linkedEvidenceIds.includes(item.id) || item.linkedActionIds.includes(action.id),
  )
}

function buildFeaturedOpportunity(
  form: SnapshotForm,
  actions: RecommendedAction[],
  evidenceItems: EvidenceItem[],
): FeaturedOpportunity {
  const action = actions.find(
    (candidate) => candidate.status !== 'Completed' && candidate.status !== 'Skipped',
  ) ?? actions[0]

  if (!action) {
    const service = getRecommendationSubject(form)
    return {
      title: 'Clarify the ' + service + ' customer decision path',
      currentSituation: 'The Snapshot has identified an opportunity to connect the offer, proof, and next step more clearly.',
      whyItMatters: 'Clarity and trust give every later visibility improvement a stronger foundation.',
      recommendedFirstMove: 'Make the audience, local fit, proof, and next step for ' + service + ' explicit on the first screen.',
      potentialBusinessBenefit: 'Potential customers can evaluate fit with greater confidence and less friction.',
    }
  }

  const evidence = findSupportingEvidence(action, evidenceItems)

  return {
    title: action.title,
    currentSituation: evidence?.observation || currentSituationFor(action.category, form),
    whyItMatters: evidence?.whyItMatters || action.reason,
    recommendedFirstMove: action.implementationNote || action.description,
    potentialBusinessBenefit: action.businessValue,
    evidenceTitle: evidence?.title,
  }
}

export function createReportStory(input: {
  form: SnapshotForm
  scores: Scores
  actions: RecommendedAction[]
  evidenceItems: EvidenceItem[]
}): ReportStory {
  return {
    strategicAssets: buildStrategicAssets(input.form, input.scores, input.evidenceItems),
    featuredOpportunity: buildFeaturedOpportunity(input.form, input.actions, input.evidenceItems),
  }
}

export function formatStrategicAssetsText(assets: StrategicAsset[]) {
  return 'Strategic Assets\n\n' + assets.map((asset) => asset.title + '\n- Basis: ' + asset.sourceLabel + '\n- What we see: ' + asset.explanation + '\n- Why it matters: ' + asset.whyItMatters + '\n- How to leverage it: ' + asset.leverage).join('\n\n')
}

export function formatFeaturedOpportunityText(opportunity: FeaturedOpportunity) {
  return 'Biggest Opportunity\n\n' + opportunity.title + '\n- Current situation: ' + opportunity.currentSituation + '\n- Why it matters: ' + opportunity.whyItMatters + '\n- Recommended first move: ' + opportunity.recommendedFirstMove + '\n- Potential business benefit: ' + opportunity.potentialBusinessBenefit + (opportunity.evidenceTitle ? '\n- Supporting evidence: ' + opportunity.evidenceTitle : '')
}

export function formatImplementationPathsText() {
  return 'DIY vs Done-For-You\n\n' + implementationPaths.map((path) => path.option + ' — ' + path.title + '\n' + path.description + '\n' + path.includes.map((item) => '- ' + item).join('\n')).join('\n\n')
}
