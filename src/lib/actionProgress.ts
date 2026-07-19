import type {
  ActionStatusChange,
  RecommendedAction,
  RecommendedActionStatus,
} from '../types'

export const actionStatusOptions: readonly RecommendedActionStatus[] = [
  'Not Started',
  'Scheduled',
  'In Progress',
  'Completed',
  'Needs Review',
  'Deferred',
]

const legacyStatusMap: Record<string, RecommendedActionStatus> = {
  'Not Started': 'Not Started',
  'Not started': 'Not Started',
  Planned: 'Not Started',
  Scheduled: 'Scheduled',
  'In Progress': 'In Progress',
  'In progress': 'In Progress',
  Completed: 'Completed',
  Complete: 'Completed',
  'Needs Review': 'Needs Review',
  Deferred: 'Deferred',
  Skipped: 'Deferred',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseActionStatus(value: unknown): RecommendedActionStatus | null {
  return typeof value === 'string' ? legacyStatusMap[value] ?? null : null
}

export function normalizeActionStatus(value: unknown): RecommendedActionStatus {
  return parseActionStatus(value) ?? 'Not Started'
}

export function normalizeActionStatusHistory(value: unknown): ActionStatusChange[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((entry) => {
    if (!isRecord(entry)) return []
    const actionId = typeof entry.actionId === 'string' ? entry.actionId : ''
    const previousStatus = parseActionStatus(entry.previousStatus)
    const newStatus = parseActionStatus(entry.newStatus)
    const changedAt = typeof entry.changedAt === 'string' ? entry.changedAt : ''
    if (!actionId || !previousStatus || !newStatus || !changedAt) return []
    return [{ actionId, previousStatus, newStatus, changedAt }]
  }).slice(-50)
}

export function appendActionStatusHistory(
  history: ActionStatusChange[],
  changes: ActionStatusChange[],
) {
  return [...history, ...changes].slice(-50)
}

export function orderActionsByPriority(actions: RecommendedAction[]) {
  return [...actions].sort(
    (left, right) =>
      right.priorityScore - left.priorityScore
      || right.opportunityScore - left.opportunityScore
      || left.recommendedOrder - right.recommendedOrder,
  )
}

export function orderActionsByRecommendation(actions: RecommendedAction[]) {
  return [...actions].sort(
    (left, right) =>
      left.recommendedOrder - right.recommendedOrder
      || right.priorityScore - left.priorityScore,
  )
}

export function getBlockingActions(
  action: RecommendedAction,
  actions: RecommendedAction[],
) {
  const actionById = new Map(actions.map((candidate) => [candidate.id, candidate]))
  return action.blockedBy
    .map((id) => actionById.get(id))
    .filter((candidate): candidate is RecommendedAction =>
      Boolean(candidate) && candidate?.status !== 'Completed',
    )
}

export function getNextMilestone(actions: RecommendedAction[]) {
  return orderActionsByPriority(actions).find(
    (action) =>
      action.status !== 'Completed'
      && action.status !== 'Deferred'
      && getBlockingActions(action, actions).length === 0,
  )
}

export function getNextMilestoneLabel(actions: RecommendedAction[]) {
  if (actions.length > 0 && actions.every((action) => action.status === 'Completed')) {
    return 'Implementation plan complete — generate a follow-up Snapshot.'
  }

  return getNextMilestone(actions)?.title
    ?? 'No active milestone — review deferred actions and unfinished dependencies.'
}

export function requiresDependencyOverride(status: RecommendedActionStatus) {
  return status === 'Scheduled' || status === 'In Progress' || status === 'Completed'
}

export function actionStatusClass(status: RecommendedActionStatus) {
  return status.toLocaleLowerCase().replace(/\s+/g, '-')
}

export function formatActionStatusText(actions: RecommendedAction[]) {
  const lines = orderActionsByRecommendation(actions).map(
    (action) => `- [${action.status}] ${action.title}`,
  )

  return `Implementation Status\n\n${lines.join('\n')}`
}
