import type {
  ActionCategory,
  RecommendedActionStatus,
  VerificationStatus,
} from '../types'

export type UpgradeMissionEffort = 'Low' | 'Medium' | 'High'

export type UpgradeMission = {
  id: string
  sourceActionId: string
  sourceStatus: RecommendedActionStatus
  sourceVerificationStatus?: VerificationStatus
  title: string
  objective: string
  category: ActionCategory
  priority: 1 | 2 | 3
  evidence: string[]
  actionSummary: string
  actionPlan: [string, string, string]
  primaryBusinessOutcome: string
  expectedOutcome: string
  effort: UpgradeMissionEffort
  timeEstimate: string
  successCriteria: string[]
  verificationMethod: string
  unresolvedDependencyIds: string[]
  dependencyWarnings: string[]
}

export type ImpactLedgerStatus =
  | 'Planned'
  | 'In Progress'
  | 'Completed'
  | 'Verified'

export type ImpactLedgerEntry = {
  missionId: string
  missionTitle: string
  status: ImpactLedgerStatus
  baselineEvidence: string[]
  actionTaken?: string
  completionDate?: string
  verificationEvidence?: string[]
  verificationMethod?: string
  businessImpact?: string
  nextProofRequired: string
  verificationTiming: string
}

export type AchievementStatus = 'Locked' | 'In Progress' | 'Earned'

export type BusinessAchievement = {
  id: string
  missionId: string
  title: string
  description: string
  verificationRequirements: string[]
  status: AchievementStatus
  earnedDate?: string
}

export type UpgradeJourney = {
  businessName: string
  snapshotNumber: string
  snapshotDate: string
  currentArchetype: string
  currentHealthScore: number | null
  currentGrowthStage: string
  nextEvolutionTitle: string
  nextEvolutionExplanation: string
  targetScoreRange: string
  planningHorizon: string
  missions: UpgradeMission[]
  operatingFocus: string
  ownerLabel: string
  reviewDate: string
}

export type SnapshotRecordStatus = 'Baseline Recorded' | 'To be recorded'

export type SnapshotRecordCheckpoint = {
  id: string
  label: string
  dateLabel: string
  archetype: string | null
  businessHealthScore: number | null
  status: SnapshotRecordStatus
}

export type UpgradeOSReportModel = {
  journey: UpgradeJourney
  missions: UpgradeMission[]
  impactLedger: ImpactLedgerEntry[]
  achievements: BusinessAchievement[]
  snapshotRecord: SnapshotRecordCheckpoint[]
}
