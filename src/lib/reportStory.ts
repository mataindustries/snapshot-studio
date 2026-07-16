import type {
  ActionCategory,
  EvidenceItem,
  RecommendedAction,
  ScoreKey,
  Scores,
  SnapshotForm,
} from '../types'

export type StrategicAsset = {
  title: string
  explanation: string
  whyItMatters: string
  leverage: string
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

function valueOrFallback(value: string, fallback: string) {
  return value.trim() || fallback
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

function assetExplanation(
  key: ScoreKey,
  score: number,
  form: SnapshotForm,
) {
  const businessName = valueOrFallback(form.businessName, 'The business')
  const service = valueOrFallback(form.mainService, 'the primary service')
  const city = valueOrFallback(form.city, 'the local market')
  const focus: Record<ScoreKey, string> = {
    visibility: `how clearly ${service} connects to ${city}`,
    trust: 'the credibility signals available to a first-time visitor',
    conversion: 'the path from interest to a call or request',
    aiSearchReadiness: 'how explicitly services, location, proof, and common questions are explained',
    competitorPosition: 'how confidently the offer can be compared with nearby alternatives',
  }

  return `${businessName}'s ${scoreLabel[key]} score is ${score}/20, making ${focus[key]} one of the measured foundations this plan can build on.`
}

const assetWhyItMatters: Record<ScoreKey, string> = {
  visibility: 'Clear local relevance helps the right customer recognize fit without extra searching.',
  trust: 'Credible proof reduces uncertainty at the moment a visitor is deciding what to do next.',
  conversion: 'A usable contact path preserves intent and reduces avoidable conversion friction.',
  aiSearchReadiness: 'Explicit business information improves understanding for both people and AI systems.',
  competitorPosition: 'A supportable point of difference gives comparison shoppers more decision confidence.',
}

const assetLeverage: Record<ScoreKey, string> = {
  visibility: 'Repeat the strongest service-and-location language across the homepage, service pages, and local profile.',
  trust: 'Place the most relevant reviews, credentials, and outcomes beside primary calls to action.',
  conversion: 'Standardize the next-step promise across buttons, forms, phone links, and mobile layouts.',
  aiSearchReadiness: 'Turn core facts and customer questions into short, direct, well-labeled answers.',
  competitorPosition: 'Carry the clearest differentiator into headlines, proof sections, and service comparisons.',
}

function buildStrategicAssets(form: SnapshotForm, scores: Scores) {
  const ranked = scoreKeys
    .map((key, index) => ({ key, score: scores[key], index }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
  const establishedCount = ranked.filter(({ score }) => score >= 11).length
  const assetCount = Math.min(5, Math.max(3, establishedCount))

  return ranked.slice(0, assetCount).map(({ key, score }) => ({
    title: assetTitle(key, score),
    explanation: assetExplanation(key, score, form),
    whyItMatters: assetWhyItMatters[key],
    leverage: assetLeverage[key],
  }))
}

function currentSituationFor(
  category: ActionCategory,
  form: SnapshotForm,
) {
  const service = valueOrFallback(form.mainService, 'the primary service')
  const city = valueOrFallback(form.city, 'the service area')

  if (category === 'Homepage' || category === 'Brand Positioning') {
    return `The first screen can state ${service}, ${city}, credible proof, and the next step more clearly.`
  }
  if (category === 'Trust' || category === 'Reviews') {
    return 'Relevant proof can sit closer to the point where a visitor decides whether to make contact.'
  }
  if (
    category === 'Service Pages'
    || category === 'Authority'
    || category === 'Content'
    || category === 'FAQ'
  ) {
    return 'Expertise and service detail can be organized into a more complete decision resource.'
  }
  if (
    category === 'Conversion'
    || category === 'Calls To Action'
    || category === 'Mobile UX'
  ) {
    return 'The contact path can explain the next step with less uncertainty and less conversion friction.'
  }
  if (category === 'Local SEO' || category === 'Google Business Profile') {
    return 'Service and location details can be made more consistent across the website and local profile.'
  }

  return 'Core business facts can be structured more explicitly so visitors and AI systems interpret them consistently.'
}

function findSupportingEvidence(
  action: RecommendedAction,
  evidenceItems: EvidenceItem[],
) {
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
    return {
      title: 'Clarify the primary customer decision path',
      currentSituation: 'The Snapshot has identified an opportunity to connect the offer, proof, and next step more clearly.',
      whyItMatters: 'Clarity and trust give every later visibility improvement a stronger foundation.',
      recommendedFirstMove: 'Choose one primary service and make its audience, local fit, proof, and next step explicit on the first screen.',
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
    strategicAssets: buildStrategicAssets(input.form, input.scores),
    featuredOpportunity: buildFeaturedOpportunity(
      input.form,
      input.actions,
      input.evidenceItems,
    ),
  }
}

export function formatStrategicAssetsText(assets: StrategicAsset[]) {
  return `Strategic Assets

${assets.map((asset) => `${asset.title}
- What we see: ${asset.explanation}
- Why it matters: ${asset.whyItMatters}
- How to leverage it: ${asset.leverage}`).join('\n\n')}`
}

export function formatFeaturedOpportunityText(opportunity: FeaturedOpportunity) {
  return `Biggest Opportunity

${opportunity.title}
- Current situation: ${opportunity.currentSituation}
- Why it matters: ${opportunity.whyItMatters}
- Recommended first move: ${opportunity.recommendedFirstMove}
- Potential business benefit: ${opportunity.potentialBusinessBenefit}${opportunity.evidenceTitle ? `\n- Supporting evidence: ${opportunity.evidenceTitle}` : ''}`
}

export function formatImplementationPathsText() {
  return `DIY vs Done-For-You

${implementationPaths.map((path) => `${path.option} — ${path.title}
${path.description}
${path.includes.map((item) => `- ${item}`).join('\n')}`).join('\n\n')}`
}
