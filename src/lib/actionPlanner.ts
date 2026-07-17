import type {
  ActionCategory,
  RecommendedAction,
  RecommendedActionEffort,
  RecommendedActionImpact,
  RecommendedActionStatus,
  Scores,
  SnapshotForm,
} from '../types'
import { createStableId } from './evidence'
import { getDisplayCity, getRecommendationSubject } from './reportDisplay'
import { scoreAction } from './prioritization'
import { emptyScores } from './scoring'

type ActionProfile = {
  objective: string
  businessValue: string
  reason: string
  expectedOutcome: string
}

type ActionCandidate = ActionProfile & {
  category: ActionCategory
  title: string
  description: string
  estimatedEffort: RecommendedActionEffort
  estimatedImpact: RecommendedActionImpact
  estimatedHours: number
}

const actionCategories: readonly ActionCategory[] = [
  'Homepage',
  'Trust',
  'Authority',
  'Local SEO',
  'Service Pages',
  'Reviews',
  'Conversion',
  'Google Business Profile',
  'Content',
  'FAQ',
  'Mobile UX',
  'Calls To Action',
  'Internal Links',
  'Technical',
  'Brand Positioning',
  'AI Readiness',
] as const

const profileByCategory: Record<ActionCategory, ActionProfile> = {
  Homepage: {
    objective: 'Make the primary offer and service area clear at first glance.',
    businessValue: 'Visitors can decide faster whether the business fits their need.',
    reason: 'The first screen has to orient a visitor before proof or detail can help.',
    expectedOutcome: 'Visitors understand the main service, location, and next step faster.',
  },
  Trust: {
    objective: 'Place concrete proof beside the main decision point.',
    businessValue: 'Potential customers have fewer unanswered credibility concerns.',
    reason: 'Proof is most useful where a visitor is deciding whether to make contact.',
    expectedOutcome: 'Reduce hesitation before a visitor calls or submits a request.',
  },
  Authority: {
    objective: 'Demonstrate subject-matter depth around the primary service.',
    businessValue: 'The business is easier to recognize as a knowledgeable specialist.',
    reason: 'Specific expertise is more persuasive than broad claims of quality.',
    expectedOutcome: 'Clarify expertise with useful, service-specific guidance.',
  },
  'Local SEO': {
    objective: 'Connect the offer to the actual communities served.',
    businessValue: 'Local visitors can confirm service-area fit without searching for it.',
    reason: 'Clear geographic context helps people and machines interpret local relevance.',
    expectedOutcome: 'Make service-area coverage easier to understand.',
  },
  'Service Pages': {
    objective: 'Give the primary service a complete, focused decision page.',
    businessValue: 'Visitors can evaluate the service without piecing details together.',
    reason: 'A focused page can explain fit, process, proof, and next steps in one place.',
    expectedOutcome: 'Clarify expertise and make the service easier to evaluate.',
  },
  Reviews: {
    objective: 'Turn customer feedback into accessible decision support.',
    businessValue: 'Visitors can see relevant customer experience before contacting the business.',
    reason: 'Specific, recent feedback answers trust questions better than generic claims.',
    expectedOutcome: 'Increase trust with specific customer proof.',
  },
  Conversion: {
    objective: 'Remove friction from the inquiry path.',
    businessValue: 'Interested visitors can complete the next step with less uncertainty.',
    reason: 'A clear handoff keeps qualified interest from stalling at the form or phone step.',
    expectedOutcome: 'Make the contact path easier to complete.',
  },
  'Google Business Profile': {
    objective: 'Align the public business profile with current services and proof.',
    businessValue: 'People comparing local options see accurate, useful information.',
    reason: 'The profile often shapes the decision before a visitor reaches the website.',
    expectedOutcome: 'Present a more complete and consistent local business summary.',
  },
  Content: {
    objective: 'Answer one high-value customer question in depth.',
    businessValue: 'Prospects can learn from the business before they are ready to contact it.',
    reason: 'Useful answers demonstrate expertise without relying on promotional claims.',
    expectedOutcome: 'Build authority around a real customer concern.',
  },
  FAQ: {
    objective: 'Publish direct answers to common pre-contact questions.',
    businessValue: 'Visitors spend less time looking elsewhere for basic decision information.',
    reason: 'Plain-language questions and answers are easy for visitors and AI systems to interpret.',
    expectedOutcome: 'Help visitors and AI systems understand the offering more clearly.',
  },
  'Mobile UX': {
    objective: 'Make the core decision path work comfortably on a phone.',
    businessValue: 'Mobile visitors can read, compare, and act with less friction.',
    reason: 'Small-screen friction can hide otherwise strong service and proof content.',
    expectedOutcome: 'Create a clearer mobile path from first screen to contact.',
  },
  'Calls To Action': {
    objective: 'Explain the next step and what happens after contact.',
    businessValue: 'Visitors know what they are agreeing to before they reach out.',
    reason: 'A specific call to action feels safer than a generic request to get in touch.',
    expectedOutcome: 'Make the first contact step clearer and lower-friction.',
  },
  'Internal Links': {
    objective: 'Connect related service, proof, and answer pages.',
    businessValue: 'Visitors can move naturally from a question to supporting detail.',
    reason: 'Useful pathways prevent important pages from becoming isolated.',
    expectedOutcome: 'Make supporting information easier to discover.',
  },
  Technical: {
    objective: 'Resolve a technical barrier affecting access or interpretation.',
    businessValue: 'Visitors and systems can use the site more reliably.',
    reason: 'Technical foundations have to work before content can do its job consistently.',
    expectedOutcome: 'Improve the reliability of the public-facing experience.',
  },
  'Brand Positioning': {
    objective: 'State a specific, supportable reason to choose the business.',
    businessValue: 'Comparison shoppers can distinguish the offer from nearby alternatives.',
    reason: 'Clear differentiation makes proof and service detail easier to interpret.',
    expectedOutcome: 'Clarify why the business is a relevant choice.',
  },
  'AI Readiness': {
    objective: 'Structure core facts so AI systems can summarize them accurately.',
    businessValue: 'Service, location, proof, and process are less likely to be misunderstood.',
    reason: 'Clear entities and direct answers reduce ambiguity in machine-generated summaries.',
    expectedOutcome: 'Help AI systems understand the business and its offerings.',
  },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === 'string')))
    : []
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function inferCategory(value: Record<string, unknown>): ActionCategory {
  if (
    typeof value.category === 'string'
    && actionCategories.includes(value.category as ActionCategory)
  ) {
    return value.category as ActionCategory
  }

  const copy = `${stringValue(value.title)} ${stringValue(value.description)}`
  if (/top section|hero|above the fold|homepage/i.test(copy)) return 'Homepage'
  if (/review|testimonial|credential|proof|guarantee|before.?after/i.test(copy)) return 'Trust'
  if (/service page|focused .* page/i.test(copy)) return 'Service Pages'
  if (/google business|business profile/i.test(copy)) return 'Google Business Profile'
  if (/faq|question|answer-style/i.test(copy)) return 'FAQ'
  if (/mobile|phone visibility/i.test(copy)) return 'Mobile UX'
  if (/button|call to action|cta|contact|form/i.test(copy)) return 'Calls To Action'
  if (/city|service area|local/i.test(copy)) return 'Local SEO'
  if (/ai|schema|machine/i.test(copy)) return 'AI Readiness'
  if (/competitor|differentiat|position/i.test(copy)) return 'Brand Positioning'
  if (/content|guide|article/i.test(copy)) return 'Content'
  return 'Authority'
}

function normalizeStatus(value: unknown): RecommendedActionStatus {
  const statusMap: Record<string, RecommendedActionStatus> = {
    'Not Started': 'Not Started',
    'Not started': 'Not Started',
    Planned: 'Not Started',
    'In Progress': 'In Progress',
    'In progress': 'In Progress',
    Completed: 'Completed',
    Complete: 'Completed',
    Skipped: 'Skipped',
    'Needs Review': 'Needs Review',
  }
  return typeof value === 'string' ? statusMap[value] ?? 'Not Started' : 'Not Started'
}

function normalizeEffort(value: unknown): RecommendedActionEffort {
  if (value === 'Small' || value === 'Medium' || value === 'Large') return value
  if (value === 'Low') return 'Small'
  if (value === 'High') return 'Large'
  return 'Medium'
}

function normalizeImpact(value: unknown): RecommendedActionImpact {
  if (value === 'Low' || value === 'Medium' || value === 'High') return value
  return 'Medium'
}

function hoursForEffort(effort: RecommendedActionEffort) {
  if (effort === 'Small') return 2
  if (effort === 'Large') return 10
  return 5
}

export function normalizeRecommendedAction(
  value: unknown,
  index: number,
  scores: Scores = emptyScores,
): RecommendedAction | null {
  if (!isRecord(value)) return null

  const title = stringValue(value.title)
  const description = stringValue(value.description, title)
  const category = inferCategory(value)
  const profile = profileByCategory[category]
  const estimatedEffort = normalizeEffort(value.estimatedEffort ?? value.difficulty)
  const estimatedImpact = normalizeImpact(value.estimatedImpact)
  const calculated = scoreAction({
    category,
    scores,
    impact: estimatedImpact,
    effort: estimatedEffort,
  })
  const linkedEvidence = stringArray(value.linkedEvidenceIds ?? value.linkedEvidence)

  return {
    ...value,
    id: stringValue(value.id, createStableId('action', [category, title, index])),
    title,
    description,
    category,
    priority: calculated.priority,
    estimatedEffort,
    estimatedImpact,
    estimatedHours: Math.max(1, numberValue(value.estimatedHours, hoursForEffort(estimatedEffort))),
    priorityScore: calculated.priorityScore,
    opportunityScore: calculated.opportunityScore,
    reason: stringValue(value.reason, profile.reason),
    expectedOutcome: stringValue(value.expectedOutcome, profile.expectedOutcome),
    objective: profile.objective,
    businessValue: profile.businessValue,
    status: normalizeStatus(value.status),
    blockedBy: stringArray(value.blockedBy),
    unlocks: stringArray(value.unlocks),
    recommendedOrder: Math.max(
      1,
      Math.round(numberValue(value.recommendedOrder, index + 1)),
    ),
    linkedEvidence,
    linkedEvidenceIds: linkedEvidence,
    evidenceReference: stringValue(value.evidenceReference) || undefined,
    implementationNote: stringValue(value.implementationNote) || undefined,
  }
}

function buildCandidates(form: SnapshotForm): ActionCandidate[] {
  const service = getRecommendationSubject(form)
  const city = getDisplayCity(form)

  return [
    {
      ...profileByCategory.Homepage,
      category: 'Homepage',
      title: `Clarify the homepage around ${service}`,
      description: `Rewrite the first screen to name ${service}, ${city}, one supportable proof point, and a clear next step.`,
      estimatedEffort: 'Small',
      estimatedImpact: 'High',
      estimatedHours: 2,
    },
    {
      ...profileByCategory.Trust,
      category: 'Trust',
      title: 'Build a proof section beside the primary CTA',
      description: 'Combine the strongest relevant reviews, credentials, guarantees, process proof, or before-and-after examples in one scannable section.',
      estimatedEffort: 'Small',
      estimatedImpact: 'High',
      estimatedHours: 3,
    },
    {
      ...profileByCategory['Service Pages'],
      category: 'Service Pages',
      title: `Create a decision-ready ${service} page`,
      description: `Explain who the service is for, the process, service-area fit, proof, common concerns, and the next step for ${city}.`,
      estimatedEffort: 'Large',
      estimatedImpact: 'High',
      estimatedHours: 10,
    },
    {
      ...profileByCategory.FAQ,
      category: 'FAQ',
      title: 'Publish answers to five pre-contact questions',
      description: 'Use short, direct answers covering fit, process, timing, preparation, and what happens after an inquiry.',
      estimatedEffort: 'Medium',
      estimatedImpact: 'Medium',
      estimatedHours: 5,
    },
    {
      ...profileByCategory['Google Business Profile'],
      category: 'Google Business Profile',
      title: 'Bring the Google Business Profile up to date',
      description: `Confirm the primary category, ${service} details, service area, description, photos, and review response cadence.`,
      estimatedEffort: 'Medium',
      estimatedImpact: 'Medium',
      estimatedHours: 4,
    },
    {
      ...profileByCategory['Calls To Action'],
      category: 'Calls To Action',
      title: 'Define one clear contact promise',
      description: 'Standardize button language and add a short explanation of the response, timing, and first conversation.',
      estimatedEffort: 'Small',
      estimatedImpact: 'Medium',
      estimatedHours: 2,
    },
  ]
}

function addDependencies(actions: RecommendedAction[]) {
  const idByCategory = new Map(actions.map((action) => [action.category, action.id]))
  const dependencyCategories: Partial<Record<ActionCategory, ActionCategory[]>> = {
    Trust: ['Homepage'],
    'Service Pages': ['Trust'],
    FAQ: ['Service Pages'],
    'Calls To Action': ['Homepage'],
  }

  const blockedByById = new Map<string, string[]>()
  actions.forEach((action) => {
    const blockedBy = (dependencyCategories[action.category] ?? [])
      .map((category) => idByCategory.get(category))
      .filter((id): id is string => Boolean(id))
    blockedByById.set(action.id, blockedBy)
  })

  return actions.map((action, index) => ({
    ...action,
    blockedBy: blockedByById.get(action.id) ?? [],
    unlocks: actions
      .filter((candidate) => blockedByById.get(candidate.id)?.includes(action.id))
      .map((candidate) => candidate.id),
    recommendedOrder: index + 1,
  }))
}

export function deduplicateRecommendations(actions: RecommendedAction[]) {
  const categories = new Set<ActionCategory>()
  const objectives = new Set<string>()
  const businessValues = new Set<string>()

  return actions.filter((action) => {
    const objective = action.objective.toLowerCase()
    const businessValue = action.businessValue.toLowerCase()
    if (
      categories.has(action.category)
      || objectives.has(objective)
      || businessValues.has(businessValue)
    ) {
      return false
    }
    categories.add(action.category)
    objectives.add(objective)
    businessValues.add(businessValue)
    return true
  })
}

export function planRecommendations(input: {
  form: SnapshotForm
  scores: Scores
  existingActions?: RecommendedAction[]
}) {
  const candidates = buildCandidates(input.form)
  const existing = (input.existingActions ?? [])
    .map((action, index) => normalizeRecommendedAction(action, index, input.scores))
    .filter((action): action is RecommendedAction => action !== null)
  const source = existing.length > 0
    ? existing.map((action) => {
        const generated = candidates.find((candidate) =>
          createStableId('action', [candidate.category, candidate.objective]) === action.id,
        )
        return generated
          ? {
              ...action,
              title: generated.title,
              description: generated.description,
              objective: generated.objective,
              businessValue: generated.businessValue,
              reason: generated.reason,
              expectedOutcome: generated.expectedOutcome,
            }
          : action
      })
    : candidates.map((candidate, index) => {
        const scoring = scoreAction({
          category: candidate.category,
          scores: input.scores,
          impact: candidate.estimatedImpact,
          effort: candidate.estimatedEffort,
        })
        const id = createStableId('action', [candidate.category, candidate.objective])
        return {
          ...candidate,
          ...scoring,
          id,
          status: 'Not Started' as const,
          blockedBy: [],
          unlocks: [],
          recommendedOrder: index + 1,
          linkedEvidence: [],
          linkedEvidenceIds: [],
        }
      })

  return addDependencies(deduplicateRecommendations(source))
}
