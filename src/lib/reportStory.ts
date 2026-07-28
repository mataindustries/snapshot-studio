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
  firstCompleteSentence,
  formatSentencePhrase,
  getAudienceNoun,
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
  | 'Recorded observation'
  | 'Assessment input'
  | 'Measured Foundation'

export type StrategicAssetType =
  | 'Reputation'
  | 'Service Clarity'
  | 'Local Relevance'
  | 'Contact Path'
  | 'Credentials'
  | 'Response Expectations'
  | 'Specialization'
  | 'Operational Process'
  | 'Customer Experience'
  | 'Website Structure'

export type StrategicAsset = {
  title: string
  explanation: string
  whyItMatters: string
  leverage: string
  sourceLabel: StrategicAssetSource
  assetType: StrategicAssetType
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
    description: 'A focused implementation engagement for the changes most likely to reduce decision hesitation.',
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
  'UpgradeOS helps service companies become easier to discover, easier to trust, and easier to choose through structured improvement plans.'

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
  const assetTypes: Record<ScoreKey, StrategicAssetType> = {
    visibility: 'Local Relevance',
    trust: 'Reputation',
    conversion: 'Contact Path',
    aiSearchReadiness: 'Website Structure',
    competitorPosition: 'Specialization',
  }
  const guidance = getAssetGuidance(assetTypes[key], form)

  return {
    title: assetTitle(key, score),
    explanation: businessName + "'s " + scoreLabel[key] + ' assessment is ' + score + '/20. This is a measured planning signal about ' + focus[key] + ', not a verified factual claim.',
    whyItMatters: guidance.whyItMatters,
    leverage: guidance.leverage,
    sourceLabel: 'Measured Foundation',
    assetType: assetTypes[key],
  }
}

function classifyAsset(
  value: string,
  evidenceType?: EvidenceItem['evidenceType'],
): StrategicAssetType {
  const signal = value.toLocaleLowerCase()
  if (
    evidenceType === 'Review Platform'
    || /\breview|\brating|\bstars?\b|\btestimonial|\brecommend/.test(signal)
  ) return 'Reputation'
  if (/\blicens|\binsur|\bcertif|\bcredential|\baward/.test(signal)) return 'Credentials'
  if (
    /\bclearly defined\b|\bservice clarity\b|\bclear(?:ly)? (?:service|offer|specialty)\b/.test(signal)
  ) {
    return 'Service Clarity'
  }
  if (/\barrival|\bresponse|\bcallback|\b24\/7|\bemergency|\bsame day|\bupdates?\b/.test(signal)) {
    return 'Response Expectations'
  }
  if (/\brespect|\btidy|\bclean|\bcourteous|\bexperience|\bcareful/.test(signal)) {
    return 'Customer Experience'
  }
  if (evidenceType === 'Conversion Path' || /\bcall|\bcontact|\bbook|\bschedul|\brequest/.test(signal)) {
    return 'Contact Path'
  }
  if (/\bprocess|\bworkflow|\bchecklist|\bfollow[- ]?up|\bstandard/.test(signal)) {
    return 'Operational Process'
  }
  if (/\bspecial|\bfocus|\bexpert|\bprimary service|\bonly\b/.test(signal)) {
    return 'Specialization'
  }
  if (/\bcity|\bservice area|\blocal|\bnearby|\bneighborhood/.test(signal)) {
    return 'Local Relevance'
  }
  if (evidenceType === 'Website' || /\bpage|\bheadline|\bheading|\bsite|\bwebsite|\bstructure/.test(signal)) {
    return 'Website Structure'
  }
  return 'Service Clarity'
}

function getAssetGuidance(
  assetType: StrategicAssetType,
  form: SnapshotForm,
): Pick<StrategicAsset, 'whyItMatters' | 'leverage'> {
  const audience = getAudienceNoun(form)
  const audienceLead = capitalizeFirst(audience.plural)
  const service = formatSentencePhrase(getRecommendationSubject(form))
  const city = getDisplayCity(form)

  const guidance: Record<StrategicAssetType, Pick<StrategicAsset, 'whyItMatters' | 'leverage'>> = {
    Reputation: {
      whyItMatters: `Specific proof lowers perceived risk before a ${audience.singular} makes contact.`,
      leverage: 'Place the strongest review themes beside the service promise and primary contact action.',
    },
    'Service Clarity': {
      whyItMatters: `${audienceLead} decide faster when the offer is easy to understand and compare.`,
      leverage: `Repeat the clearest ${service} language in the headline, service summary, and next-step prompt.`,
    },
    'Local Relevance': {
      whyItMatters: `${audienceLead} should be able to confirm service in ${city} without searching through the site.`,
      leverage: `Pair ${city} with ${service} on the first screen, core service page, and public profile.`,
    },
    'Contact Path': {
      whyItMatters: `A direct next step protects the intent a ${audience.singular} already has when ready to act.`,
      leverage: 'Use one consistent request path and explain what happens immediately after contact.',
    },
    Credentials: {
      whyItMatters: `Relevant credentials reduce uncertainty when a ${audience.singular} compares providers.`,
      leverage: 'Place verified credentials beside the claims and calls to action they substantiate.',
    },
    'Response Expectations': {
      whyItMatters: `Clear response expectations make it easier for ${audience.plural} to choose the next step with confidence.`,
      leverage: 'State the response window beside every primary call, form, and scheduling prompt.',
    },
    Specialization: {
      whyItMatters: `A specific specialty helps ${audience.plural} recognize fit before comparing another provider.`,
      leverage: `Make ${service} the lead promise, then support it with focused proof and one dedicated path.`,
    },
    'Operational Process': {
      whyItMatters: `A visible process reassures ${audience.plural} that follow-through will be organized and predictable.`,
      leverage: 'Turn the strongest internal process into a short public-facing sequence with a clear owner and outcome.',
    },
    'Customer Experience': {
      whyItMatters: `A consistent service experience gives ${audience.plural} a concrete reason to trust the promise.`,
      leverage: 'Turn the recurring experience into a short proof block near the service and request sections.',
    },
    'Website Structure': {
      whyItMatters: `Clear structure helps ${audience.plural} and search systems find the same accurate business facts.`,
      leverage: 'Organize services, location, proof, common questions, and contact details under direct labels.',
    },
  }

  return guidance[assetType]
}

function buildStrategicAssets(
  form: SnapshotForm,
  scores: Scores,
  evidenceItems: EvidenceItem[],
  operatorStrengths: string[] = [],
) {
  const assets: StrategicAsset[] = []
  const seen = new Set<string>()
  const seenGuidance = new Set<string>()
  const add = (asset: StrategicAsset) => {
    if (!isClientFacingStrength(asset.title)) return
    const key = asset.title.trim().toLocaleLowerCase()
    if (!key || seen.has(key) || assets.length >= 5) return
    seen.add(key)
    const guidanceKey = `${asset.whyItMatters} ${asset.leverage}`
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .trim()
      .replace(/\s+/g, ' ')
    const nextAsset = seenGuidance.has(guidanceKey)
      ? {
          ...asset,
          leverage: `Use this ${asset.assetType.toLocaleLowerCase()} asset as visible proof: ${
            firstCompleteSentence(asset.title)
            || 'Connect this asset to the nearest decision point.'
          }`,
        }
      : asset
    seenGuidance.add(
      `${nextAsset.whyItMatters} ${nextAsset.leverage}`
        .toLocaleLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .trim()
        .replace(/\s+/g, ' '),
    )
    assets.push(nextAsset)
  }

  evidenceItems
    .filter((item) => item.sentiment === 'Strength' && isEvidenceReportReady(item))
    .forEach((item) => {
      const assetType = classifyAsset(
        `${item.title} ${item.observation} ${item.whyItMatters}`,
        item.evidenceType,
      )
      const guidance = getAssetGuidance(assetType, form)
      add({
        title: item.observation.trim(),
        explanation: item.title.trim() + (item.pageLabel.trim() ? ' — ' + item.pageLabel.trim() : ''),
        ...guidance,
        sourceLabel: 'Recorded observation',
        assetType,
      })
    })

  operatorStrengths.forEach((strength) => {
    if (!strength.trim()) return
    const assetType = classifyAsset(strength)
    const guidance = getAssetGuidance(assetType, form)
    add({
      title: strength.trim(),
      explanation: 'This competitive asset was selected during the consultant review.',
      ...guidance,
      sourceLabel: 'Assessment input',
      assetType,
    })
  })

  if (form.notes.trim()) {
    const assetType = classifyAsset(form.notes)
    const guidance = getAssetGuidance(assetType, form)
    add({
      title: form.notes.trim(),
      explanation: 'This competitive asset comes from the consultant review notes.',
      ...guidance,
      sourceLabel: 'Assessment input',
      assetType,
    })
  }

  if (hasClientFacingValue(form.mainService)) {
    const service = getRecommendationSubject(form)
    const serviceInSentence = formatSentencePhrase(service)
    const guidance = getAssetGuidance('Specialization', form)
    add({
      title: service + ' focus',
      explanation: serviceInSentence + ' is the specific primary service recorded for this Snapshot.',
      ...guidance,
      sourceLabel: 'Assessment input',
      assetType: 'Specialization',
    })
  }

  if (hasClientFacingValue(form.city)) {
    const city = getDisplayCity(form)
    const guidance = getAssetGuidance('Local Relevance', form)
    add({
      title: city + ' service area',
      explanation: city + ' is the market recorded for this Snapshot.',
      ...guidance,
      sourceLabel: 'Assessment input',
      assetType: 'Local Relevance',
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
    return 'The strongest proof appears too far from the moment ' + audience + ' decide whether to contact ' + businessName + '.'
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
    const audience = getAudienceNoun(form)
    return {
      title: 'Clarify the ' + service + ' decision path',
      currentSituation: operatorOpportunity.trim() || 'The Snapshot has identified an opportunity to connect the offer, proof, and next step more clearly.',
      whyItMatters: 'Clarity and trust give every later visibility improvement a stronger foundation.',
      recommendedFirstMove: 'Make the audience, local fit, proof, and next step for ' + serviceInSentence + ' explicit on the first screen.',
      potentialBusinessBenefit: capitalizeFirst(audience.plural)
        + ' can evaluate fit with greater confidence and less friction.',
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

function completeSummarySentence(value: string, fallback: string) {
  const sentence = firstCompleteSentence(value) || fallback
  return /[.!?]$/.test(sentence) ? sentence : sentence + '.'
}

export function createExecutiveSummary(input: {
  form: SnapshotForm
  opportunity: FeaturedOpportunity
  progress: ProgressJourneyModel
  roadmap: ConsultingRoadmap
  scoreAvailable?: boolean
}): ExecutiveSummary {
  const businessName = getDisplayBusinessName(input.form)
  const service = formatSentencePhrase(getRecommendationSubject(input.form))
  const city = getDisplayCity(input.form)
  const audience = getCustomerAudience(input.form)
  const firstPhase = input.roadmap.sprint[0]
  const scoreAvailable = input.scoreAvailable ?? true

  return {
    businessSnapshot:
      businessName + ' serves ' + audience + ' looking for ' + service + ' in ' + city + '.',
    currentPosition: scoreAvailable
      ? input.progress.currentScore + '/100 — ' + input.progress.currentGrowthStage + '. '
        + completeSummarySentence(
          input.progress.currentPositionMeaning,
          'The reviewed baseline is ready for prioritization.',
        )
      : 'Score unavailable — review all five assessment dimensions before client delivery.',
    largestOpportunity: input.opportunity.title + '. '
      + completeSummarySentence(
        input.opportunity.currentSituation,
        'This is the first constraint to resolve.',
      ),
    fastestWin: completeSummarySentence(
      firstPhase?.description ?? '',
      `Clarify ${service} in ${city}, pair it with proof, and make the next step unmistakable.`,
    ),
    longTermGoal: input.progress.longTermGrowthGoal + '. '
      + completeSummarySentence(
        input.progress.longTermGrowthGoalMeaning,
        'A future Snapshot should verify whether the operating condition improved.',
      ),
    estimatedEffort: (firstPhase?.estimatedEffort ?? 'Medium') + ' effort to start; '
      + (input.roadmap.weeks[0]?.estimatedEffort ?? 'Medium')
      + ' across the first month.',
    expectedOutcome: completeSummarySentence(
      input.opportunity.potentialBusinessBenefit,
      `The intended outcome is a clearer, lower-friction ${getAudienceNoun(input.form).singular} decision.`,
    ),
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
  return 'Competitive Assets\n\n' + assets.map((asset) =>
    asset.title
    + '\n- Source: ' + asset.sourceLabel
    + '\n- Current advantage: ' + asset.explanation
    + '\n- Decision impact: ' + asset.whyItMatters
    + '\n- Best next use: ' + asset.leverage,
  ).join('\n\n')
}

export function formatFeaturedOpportunityText(opportunity: FeaturedOpportunity) {
  return 'Primary Constraint and Highest-Leverage Improvement\n\n' + opportunity.title
    + '\n- Current decision experience: ' + opportunity.currentSituation
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
