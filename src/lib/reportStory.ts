import type {
  ActionCategory,
  EvidenceItem,
  RecommendedAction,
  ScoreKey,
  Scores,
  SnapshotForm,
} from '../types'
import {
  capitalizeFirst,
  formatSentencePhrase,
  getCustomerAudience,
  getDisplayBusinessName,
  getDisplayCity,
  getRecommendationSubject,
  hasClientFacingValue,
} from './reportDisplay'
import { isEvidenceReportReady } from './evidence'
import { isClientFacingStrength } from './clientStrengths'
import type { ProgressJourneyModel } from './progressJourney'
import type { ConsultingRoadmap } from './roadmap'

export type ExecutiveSummary = {
  businessSnapshot: string
  currentPosition: string
  largestOpportunity: string
  fastestWin: string
  longTermGoal: string
  estimatedEffort: string
  expectedOutcome: string
}

export type StrategicAssetSource =
  | 'Verified observation'
  | 'Assessment input'
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
    description: 'Use the prioritized roadmap with your own team, keeping the recommended sequence.',
    includes: [
      'Use the 48-hour sprint to create early momentum',
      'Build momentum through the first-month plan, one week at a time',
      'Run another Snapshot after implementation to verify progress',
    ],
  },
  {
    option: 'Option B',
    title: '48-Hour Visibility Sprint',
    description: 'A focused implementation engagement for the changes most likely to reduce customer hesitation.',
    includes: [
      'Confirm the decision-making evidence',
      'Focused website refinements',
      'Highest-leverage actions completed',
      'A new Snapshot to measure progress',
      'Before-and-after progress review',
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
  const service = formatSentencePhrase(getRecommendationSubject(form))
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
    competitorPosition: 'A credible point of difference gives comparison shoppers more decision confidence.',
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

function buildStrategicAssets(
  form: SnapshotForm,
  scores: Scores,
  evidenceItems: EvidenceItem[],
  operatorStrengths: string[] = [],
) {
  const assets: StrategicAsset[] = []
  const seen = new Set<string>()
  const add = (asset: StrategicAsset) => {
    if (!isClientFacingStrength(asset.title)) return
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

  operatorStrengths.forEach((strength) => {
    if (!strength.trim()) return
    add({
      title: strength.trim(),
      explanation: 'This business strength was selected during the consultant review.',
      whyItMatters: 'A credible business strength earns more trust when customers can see the proof behind it.',
      leverage: 'Verify the detail publicly, then place it beside the customer decision it can strengthen.',
      sourceLabel: 'Assessment input',
    })
  })

  if (form.notes.trim()) {
    add({
      title: form.notes.trim(),
      explanation: 'This business strength comes from the consultant review notes.',
      whyItMatters: 'A strong detail only helps when customers can see it before making a decision.',
      leverage: 'Verify the detail on the public-facing site, then move it closer to the decision it supports.',
      sourceLabel: 'Assessment input',
    })
  }

  if (hasClientFacingValue(form.mainService)) {
    const service = getRecommendationSubject(form)
    const serviceInSentence = formatSentencePhrase(service)
    add({
      title: service + ' focus',
      explanation: serviceInSentence + ' is the specific primary service recorded for this Snapshot.',
      whyItMatters: 'A precise service focus helps customers recognize fit before they compare another provider.',
      leverage: 'Carry the same service language through the homepage, dedicated service page, customer proof, and next-step prompts.',
      sourceLabel: 'Assessment input',
    })
  }

  if (hasClientFacingValue(form.city)) {
    const city = getDisplayCity(form)
    add({
      title: city + ' service area',
      explanation: city + ' is the market recorded for this Snapshot.',
      whyItMatters: 'Local customers should never have to search the site to learn whether they are in the service area.',
      leverage: 'Pair the city with the priority service in the places where customers confirm local fit.',
      sourceLabel: 'Assessment input',
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
  const service = formatSentencePhrase(getRecommendationSubject(form))
  const city = getDisplayCity(form)
  const businessName = getDisplayBusinessName(form)
  const audience = getCustomerAudience(form)
  const audienceLead = capitalizeFirst(audience)

  if (category === 'Homepage' || category === 'Brand Positioning') {
    return audienceLead + ' should see immediately that ' + businessName + ' provides ' + service + ' in ' + city + ', followed by one credibility cue and a clear next step.'
  }
  if (category === 'Trust' || category === 'Reviews') {
    return 'The strongest customer proof appears too far from the moment ' + audience + ' decide whether to contact ' + businessName + '.'
  }
  if (category === 'Service Pages' || category === 'Authority' || category === 'Content' || category === 'FAQ') {
    return audienceLead + ' need one complete ' + service + ' resource that explains fit, process, proof, and the next step in ' + city + '.'
  }
  if (category === 'Conversion' || category === 'Calls To Action' || category === 'Mobile UX') {
    return 'The contact path leaves ' + audience + ' with unanswered questions about what happens after they call or submit a request.'
  }
  if (category === 'Local SEO' || category === 'Google Business Profile') {
    return businessName + "'s " + service + ' and ' + city + ' story is not yet consistent across the website and local profile.'
  }

  return 'Core ' + service + ' facts need clearer structure so ' + audience + ' and AI systems reach the same accurate understanding.'
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
  operatorOpportunity = '',
): FeaturedOpportunity {
  const action = actions.find(
    (candidate) => candidate.status !== 'Completed' && candidate.status !== 'Deferred',
  ) ?? actions[0]

  if (!action) {
    const service = getRecommendationSubject(form)
    const serviceInSentence = formatSentencePhrase(service)
    return {
      title: 'Clarify the ' + service + ' customer decision path',
      currentSituation: operatorOpportunity.trim() || 'The Snapshot has identified an opportunity to connect the offer, proof, and next step more clearly.',
      whyItMatters: 'Clarity and trust give every later visibility improvement a stronger foundation.',
      recommendedFirstMove: 'Make the audience, local fit, proof, and next step for ' + serviceInSentence + ' explicit on the first screen.',
      potentialBusinessBenefit: 'Potential customers can evaluate fit with greater confidence and less friction.',
    }
  }

  const evidence = findSupportingEvidence(action, evidenceItems)

  return {
    title: action.title,
    currentSituation: evidence?.observation || operatorOpportunity.trim() || currentSituationFor(action.category, form),
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
  operatorStrengths?: string[]
  operatorOpportunity?: string
}): ReportStory {
  return {
    strategicAssets: buildStrategicAssets(
      input.form,
      input.scores,
      input.evidenceItems,
      input.operatorStrengths,
    ),
    featuredOpportunity: buildFeaturedOpportunity(
      input.form,
      input.actions,
      input.evidenceItems,
      input.operatorOpportunity,
    ),
  }
}

function limitWords(value: string, maximum: number) {
  const words = value.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean)
  return words.length <= maximum ? words.join(' ') : words.slice(0, maximum).join(' ') + '…'
}

export function createExecutiveSummary(input: {
  form: SnapshotForm
  opportunity: FeaturedOpportunity
  progress: ProgressJourneyModel
  roadmap: ConsultingRoadmap
}): ExecutiveSummary {
  const businessName = getDisplayBusinessName(input.form)
  const service = formatSentencePhrase(getRecommendationSubject(input.form))
  const city = getDisplayCity(input.form)
  const audience = getCustomerAudience(input.form)
  const firstPhase = input.roadmap.sprint[0]

  return {
    businessSnapshot: limitWords(
      businessName + ' serves ' + audience + ' looking for ' + service + ' in ' + city + '.',
      18,
    ),
    currentPosition: limitWords(
      input.progress.currentScore + '/100 — ' + input.progress.currentGrowthStage + '. '
        + input.progress.currentPositionMeaning,
      18,
    ),
    largestOpportunity: limitWords(
      input.opportunity.title + '. ' + input.opportunity.currentSituation,
      18,
    ),
    fastestWin: limitWords(firstPhase.description, 18),
    longTermGoal: limitWords(
      input.progress.longTermGrowthGoal + ': ' + input.progress.longTermGrowthGoalMeaning,
      18,
    ),
    estimatedEffort: limitWords(
      firstPhase.estimatedEffort + ' effort to start; '
        + input.roadmap.weeks[0].estimatedEffort + ' across the first month.',
      14,
    ),
    expectedOutcome: limitWords(input.opportunity.potentialBusinessBenefit, 18),
  }
}

export function formatExecutiveSummaryText(summary: ExecutiveSummary) {
  return `Business Snapshot

${summary.businessSnapshot}

Current Position: ${summary.currentPosition}
Largest Opportunity: ${summary.largestOpportunity}
Fastest Win: ${summary.fastestWin}
Long-term Goal: ${summary.longTermGoal}
Estimated Effort: ${summary.estimatedEffort}
Expected Outcome: ${summary.expectedOutcome}`
}

export function formatStrategicAssetsText(assets: StrategicAsset[]) {
  return "What You're Already Winning\n\n" + assets.map((asset) =>
    asset.title
    + '\n- Source: ' + asset.sourceLabel
    + '\n- Current advantage: ' + asset.explanation
    + '\n- Customer impact: ' + asset.whyItMatters
    + '\n- Best next use: ' + asset.leverage,
  ).join('\n\n')
}

export function formatFeaturedOpportunityText(opportunity: FeaturedOpportunity) {
  return 'The Highest-Leverage Improvement\n\n' + opportunity.title
    + '\n- What customers experience: ' + opportunity.currentSituation
    + '\n- Business consequence: ' + opportunity.whyItMatters
    + '\n- First move: ' + opportunity.recommendedFirstMove
    + '\n- Likely upside: ' + opportunity.potentialBusinessBenefit
    + (opportunity.evidenceTitle ? '\n- Evidence used: ' + opportunity.evidenceTitle : '')
}

export function formatImplementationPathsText() {
  return 'Two Ways Forward\n\n' + implementationPaths.map((path) =>
    path.option + ' — ' + path.title + '\n' + path.description + '\n'
      + path.includes.map((item) => '- ' + item).join('\n'),
  ).join('\n\n')
}
