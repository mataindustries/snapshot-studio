import type {
  ActionCategory,
  RecommendedAction,
  RecommendedActionEffort,
} from '../types'

export type SprintPhase = {
  day: 1 | 2
  window: 'Hours 0–24' | 'Hours 24–48'
  actionIds: string[]
  headline: string
  description: string
  deliverable: string
  whyItMatters: string
  estimatedEffort: RecommendedActionEffort
  expectedBusinessEffect: string
}

export type AuthorityWeek = {
  week: 1 | 2 | 3 | 4
  theme: 'Visibility' | 'Trust' | 'Authority' | 'AI Readiness'
  goal: string
  recommendedWork: string[]
  estimatedEffort: string
  milestone: string
  successSignal: string
  actionIds: string[]
}

export type ConsultingRoadmap = {
  sprint: [SprintPhase, SprintPhase]
  weeks: [AuthorityWeek, AuthorityWeek, AuthorityWeek, AuthorityWeek]
  priorityMatrix: RecommendedAction[]
  dependencies: RecommendedAction[]
  businessOutcomes: RecommendedAction[]
}

function findAction(
  actions: RecommendedAction[],
  categories: readonly ActionCategory[],
  usedIds: Set<string>,
) {
  return actions.find(
    (action) => categories.includes(action.category) && !usedIds.has(action.id),
  ) ?? actions.find((action) => !usedIds.has(action.id))
}

function selectActions(
  actions: RecommendedAction[],
  categories: readonly ActionCategory[],
) {
  return actions.filter((action) => categories.includes(action.category))
}

function workTitles(actions: RecommendedAction[], fallback: string) {
  return actions.length > 0 ? actions.map((action) => action.title) : [fallback]
}

function totalHours(actions: RecommendedAction[]) {
  const hours = actions.reduce((total, action) => total + action.estimatedHours, 0)
  return hours > 0 ? `${hours} estimated hours` : '2–4 estimated hours'
}

export function createConsultingRoadmap(
  actions: RecommendedAction[],
): ConsultingRoadmap {
  const ordered = [...actions].sort(
    (left, right) =>
      left.recommendedOrder - right.recommendedOrder
      || right.priorityScore - left.priorityScore,
  )
  const sprintActions = ordered
  const usedIds = new Set<string>()
  const clarity = findAction(
    sprintActions,
    ['Homepage', 'Brand Positioning', 'Calls To Action'],
    usedIds,
  )
  if (clarity) usedIds.add(clarity.id)
  const proof = findAction(
    sprintActions,
    ['Trust', 'Reviews', 'Conversion', 'Mobile UX'],
    usedIds,
  )

  const sprint: [SprintPhase, SprintPhase] = [
    {
      day: 1,
      window: 'Hours 0–24',
      actionIds: clarity ? [clarity.id] : [],
      headline: 'Review the evidence and clarify the decision path',
      description: clarity?.description
        ?? 'Tighten the first screen around the recorded offer, location, proof, and next step.',
      deliverable: 'An approved first-screen message, support line, proof cue, and primary action.',
      whyItMatters: clarity?.reason
        ?? 'Clarity gives every later trust and authority improvement a stronger foundation.',
      estimatedEffort: clarity?.estimatedEffort ?? 'Small',
      expectedBusinessEffect: clarity?.businessValue
        ?? 'Visitors can decide faster whether the business fits their need.',
    },
    {
      day: 2,
      window: 'Hours 24–48',
      actionIds: proof ? [proof.id] : [],
      headline: 'Implement the highest-priority trust improvement',
      description: proof?.description
        ?? 'Place the strongest decision-making proof beside the primary contact decision.',
      deliverable: 'One implemented trust or contact-path improvement, checked on desktop and mobile.',
      whyItMatters: proof?.reason
        ?? 'Specific proof and a clear next step reduce hesitation before first contact.',
      estimatedEffort: proof?.estimatedEffort ?? 'Small',
      expectedBusinessEffect: proof?.businessValue
        ?? 'Potential customers have fewer unanswered credibility concerns.',
    },
  ]

  const visibilityActions = selectActions(
    ordered,
    ['Homepage', 'Local SEO', 'Google Business Profile', 'Calls To Action'],
  )
  const trustActions = selectActions(ordered, ['Trust', 'Reviews'])
  const authorityActions = selectActions(
    ordered,
    ['Service Pages', 'Authority', 'Content', 'Internal Links'],
  )
  const aiActions = selectActions(ordered, ['FAQ', 'AI Readiness', 'Technical'])

  const weeks: [AuthorityWeek, AuthorityWeek, AuthorityWeek, AuthorityWeek] = [
    {
      week: 1,
      theme: 'Visibility',
      goal: 'Make the offer, service area, and next step consistent across the main entry points.',
      recommendedWork: workTitles(
        visibilityActions,
        'Clarify the primary offer and service area on the homepage.',
      ),
      estimatedEffort: totalHours(visibilityActions),
      milestone: 'The homepage and primary local profile tell the same clear story.',
      successSignal: 'A first-time reviewer can identify the service, location, and next step without prompting.',
      actionIds: visibilityActions.map((action) => action.id),
    },
    {
      week: 2,
      theme: 'Trust',
      goal: 'Move the strongest credible proof into the customer decision path.',
      recommendedWork: workTitles(
        trustActions,
        'Assemble a proof section from reviews, credentials, process, and customer outcomes.',
      ),
      estimatedEffort: totalHours(trustActions),
      milestone: 'Every primary contact point has credible proof close by.',
      successSignal: 'Proof is specific, current, attributable, and visible before the contact step.',
      actionIds: trustActions.map((action) => action.id),
    },
    {
      week: 3,
      theme: 'Authority',
      goal: 'Show expertise through one complete service resource and connected supporting detail.',
      recommendedWork: workTitles(
        authorityActions,
        'Publish one decision-ready service resource with proof and process detail.',
      ),
      estimatedEffort: totalHours(authorityActions),
      milestone: 'The priority offer has a complete page that can stand on its own.',
      successSignal: 'The page answers who it is for, how it works, why to trust it, and what to do next.',
      actionIds: authorityActions.map((action) => action.id),
    },
    {
      week: 4,
      theme: 'AI Readiness',
      goal: 'Turn core service facts and customer questions into clear, structured answers.',
      recommendedWork: workTitles(
        aiActions,
        'Publish direct answers to five common pre-contact questions.',
      ),
      estimatedEffort: totalHours(aiActions),
      milestone: 'Service, location, process, and proof can be summarized from explicit page copy.',
      successSignal: 'A reviewer can extract accurate short answers without inferring missing business details.',
      actionIds: aiActions.map((action) => action.id),
    },
  ]

  const priorityMatrix = [...ordered].sort(
    (left, right) =>
      right.priorityScore - left.priorityScore
      || right.opportunityScore - left.opportunityScore
      || left.recommendedOrder - right.recommendedOrder,
  )

  return {
    sprint,
    weeks,
    priorityMatrix,
    dependencies: ordered.filter(
      (action) => action.blockedBy.length > 0 || action.unlocks.length > 0,
    ),
    businessOutcomes: ordered,
  }
}

export function formatRoadmapText(roadmap: ConsultingRoadmap) {
  const sprint = roadmap.sprint.map((phase) => `${phase.window}: ${phase.headline}
- Description: ${phase.description}
- Deliverable: ${phase.deliverable}
- Decision impact: ${phase.whyItMatters}
- Estimated effort: ${phase.estimatedEffort}
- Expected gain: ${phase.expectedBusinessEffect}`).join('\n\n')
  const weeks = roadmap.weeks.map((week) => `Week ${week.week} — ${week.theme}
- Goal: ${week.goal}
- Priority work: ${week.recommendedWork.join('; ')}
- Estimated effort: ${week.estimatedEffort}
- Milestone: ${week.milestone}
- Success signal: ${week.successSignal}`).join('\n\n')

  return `48-Hour Visibility Sprint

${sprint}

Your First Month of Momentum

${weeks}`
}
