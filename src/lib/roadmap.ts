import type {
  ActionCategory,
  RecommendedAction,
  RecommendedActionEffort,
} from '../types'

export type SprintDay = {
  day: 1 | 2 | 3
  actionId?: string
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
  sprint: [SprintDay, SprintDay, SprintDay]
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
  const usedIds = new Set<string>()
  const homepage = findAction(ordered, ['Homepage', 'Brand Positioning'], usedIds)
  if (homepage) usedIds.add(homepage.id)
  const trust = findAction(ordered, ['Trust', 'Reviews'], usedIds)
  if (trust) usedIds.add(trust.id)
  const authority = findAction(
    ordered,
    ['Service Pages', 'Authority', 'FAQ', 'Content', 'Google Business Profile'],
    usedIds,
  )

  const sprint: [SprintDay, SprintDay, SprintDay] = [
    {
      day: 1,
      actionId: homepage?.id,
      headline: 'Make the offer obvious in five seconds',
      description: homepage?.description
        ?? 'Tighten the first screen around the primary service, location, proof, and next step.',
      deliverable: 'Approved homepage headline, support line, proof cue, and primary button copy.',
      whyItMatters: homepage?.reason
        ?? 'Clarity gives every later proof and authority improvement a stronger foundation.',
      estimatedEffort: homepage?.estimatedEffort ?? 'Small',
      expectedBusinessEffect: homepage?.businessValue
        ?? 'Visitors can decide faster whether the business fits their need.',
    },
    {
      day: 2,
      actionId: trust?.id,
      headline: 'Put credible proof beside the decision',
      description: trust?.description
        ?? 'Choose the strongest reviews, credentials, process proof, or customer outcomes.',
      deliverable: 'One scannable proof section ready to place beside the primary CTA.',
      whyItMatters: trust?.reason
        ?? 'Specific proof answers the concerns that often delay first contact.',
      estimatedEffort: trust?.estimatedEffort ?? 'Small',
      expectedBusinessEffect: trust?.businessValue
        ?? 'Potential customers have fewer unanswered credibility concerns.',
    },
    {
      day: 3,
      actionId: authority?.id,
      headline: 'Publish one useful expertise asset',
      description: authority?.description
        ?? 'Build a focused service or answer page around one important customer need.',
      deliverable: 'A structured page brief with audience, process, proof, questions, and next step.',
      whyItMatters: authority?.reason
        ?? 'Useful specificity makes expertise visible without relying on broad claims.',
      estimatedEffort: authority?.estimatedEffort ?? 'Medium',
      expectedBusinessEffect: authority?.businessValue
        ?? 'The business is easier to recognize as a knowledgeable specialist.',
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
      goal: 'Move the strongest supportable proof into the customer decision path.',
      recommendedWork: workTitles(
        trustActions,
        'Assemble a proof section from reviews, credentials, process, and customer outcomes.',
      ),
      estimatedEffort: totalHours(trustActions),
      milestone: 'Every primary contact point has relevant proof close by.',
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
      milestone: 'The primary service has a complete page that can stand on its own.',
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
  const sprint = roadmap.sprint.map((day) => `Day ${day.day}: ${day.headline}
- Description: ${day.description}
- Deliverable: ${day.deliverable}
- Why it matters: ${day.whyItMatters}
- Estimated effort: ${day.estimatedEffort}
- Expected business effect: ${day.expectedBusinessEffect}`).join('\n\n')
  const weeks = roadmap.weeks.map((week) => `Week ${week.week} — ${week.theme}
- Goal: ${week.goal}
- Recommended work: ${week.recommendedWork.join('; ')}
- Estimated effort: ${week.estimatedEffort}
- Milestone: ${week.milestone}
- Success signal: ${week.successSignal}`).join('\n\n')
  const priorities = roadmap.priorityMatrix.map((action) =>
    `${action.recommendedOrder}. ${action.title} — ${action.category} — Impact ${action.estimatedImpact} — Effort ${action.estimatedEffort} — Priority ${action.priorityScore}/100 — Opportunity ${action.opportunityScore}/100`,
  ).join('\n')
  const titleById = new Map(
    roadmap.businessOutcomes.map((action) => [action.id, action.title]),
  )
  const dependencies = roadmap.dependencies.map((action) => {
    const blockedBy = action.blockedBy.map((id) => titleById.get(id)).filter(Boolean)
    const unlocks = action.unlocks.map((id) => titleById.get(id)).filter(Boolean)
    return `- ${action.title}: blocked by ${blockedBy.join(', ') || 'nothing'}; unlocks ${unlocks.join(', ') || 'no later action'}`
  }).join('\n')
  const outcomes = roadmap.businessOutcomes.map((action) =>
    `- ${action.title}: ${action.expectedOutcome}`,
  ).join('\n')

  return `Three Day Visibility Sprint

${sprint}

30 Day Local Authority Plan

${weeks}

Priority Matrix
${priorities}

Dependencies
${dependencies || '- No dependencies in this plan.'}

Business Outcomes
${outcomes}`
}
