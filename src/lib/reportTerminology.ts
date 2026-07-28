export const reportTerminology = {
  businessHealthScore: 'Business Health Score',
  competitiveAsset: 'Competitive Asset',
  competitiveAssets: 'Competitive Assets',
  constraint: 'Constraint',
  constraints: 'Constraints',
  growthOpportunity: 'Growth Opportunity',
  growthOpportunities: 'Growth Opportunities',
  upgradeMission: 'Upgrade Mission',
  upgradeMissions: 'Upgrade Missions',
  operatingPriorities: 'Operating Priorities',
  snapshotRecorded: 'Snapshot Recorded',
  operatingManualCreated: 'Operating Manual Created',
} as const

export function formatUpgradeMissionCount(count: number) {
  return `${count} ${count === 1
    ? reportTerminology.upgradeMission
    : reportTerminology.upgradeMissions}`
}
