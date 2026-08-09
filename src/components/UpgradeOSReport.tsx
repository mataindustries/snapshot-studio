import {
  ArrowDown,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  Flag,
  LockKeyhole,
  Medal,
  MoveRight,
  NotebookPen,
  ShieldCheck,
  Target,
} from 'lucide-react'
import { upgradeOSEmptyStateText } from '../lib/upgradeOS'
import type {
  BusinessAchievement,
  ImpactLedgerEntry,
  SnapshotRecordCheckpoint,
  UpgradeJourney,
  UpgradeMission,
} from '../types/upgradeOS'
import './UpgradeOSReport.css'

function statusClass(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, '-')
}

export function UpgradeJourneyReport({
  journey,
}: {
  journey: UpgradeJourney
}) {
  return (
    <section
      className="report-page upgrade-journey-page"
      aria-labelledby="upgrade-journey-title"
    >
      <header className="upgrade-journey-heading">
        <div>
          <p className="section-kicker">UpgradeOS operating roadmap</p>
          <h2 id="upgrade-journey-title">Your Upgrade Journey</h2>
          <p>
            One printable view of today’s position, the next operating condition,
            and the three missions that deserve attention first.
          </p>
        </div>
        <span className="upgrade-journey-post-label">
          Post this page · 60–90 day operating focus
        </span>
      </header>

      <div className="upgrade-position-flow">
        <article className="upgrade-position-card current">
          <span>Current Position</span>
          <h3>{journey.businessName}</h3>
          <dl>
            <div>
              <dt>Snapshot</dt>
              <dd>{journey.snapshotNumber} · {journey.snapshotDate}</dd>
            </div>
            <div>
              <dt>Business Archetype</dt>
              <dd>{journey.currentArchetype}</dd>
            </div>
            <div>
              <dt>Business Health Score</dt>
              <dd>
                {journey.currentHealthScore === null
                  ? 'Score unavailable'
                  : `${journey.currentHealthScore}/100`}
              </dd>
            </div>
            <div>
              <dt>Growth Stage</dt>
              <dd>{journey.currentGrowthStage}</dd>
            </div>
          </dl>
        </article>

        <span className="upgrade-position-arrow" aria-hidden="true">
          <MoveRight className="wide-arrow" size={24} />
          <ArrowDown className="narrow-arrow" size={22} />
        </span>

        <article className="upgrade-position-card next">
          <span>Next Evolution</span>
          <h3>{journey.nextEvolutionTitle}</h3>
          <strong>{journey.planningHorizon}</strong>
          <p>{journey.nextEvolutionExplanation}</p>
          <small>{journey.targetScoreRange} · not a forecast</small>
        </article>
      </div>

      <section className="upgrade-mission-preview" aria-labelledby="journey-missions-title">
        <div className="upgrade-report-section-heading">
          <span>
            <Target size={18} aria-hidden="true" />
            Operating Priorities
          </span>
          <h3 id="journey-missions-title">
            {journey.missions.length === 3 ? 'Top Three Upgrade Missions' : 'Priority Upgrade Missions'}
          </h3>
        </div>

        {journey.missions.length > 0 ? (
          <ol>
            {journey.missions.map((mission) => (
              <li key={mission.id}>
                <article className="upgrade-mission-preview-card">
                  <span
                    className={`journey-mission-checkbox ${mission.sourceStatus === 'Completed' ? 'completed' : ''}`}
                    role="img"
                    aria-label={mission.sourceStatus === 'Completed'
                      ? 'Mission completed'
                      : 'Mission not yet completed'}
                  >
                    {mission.sourceStatus === 'Completed' && <Check size={13} aria-hidden="true" />}
                  </span>
                  <div className="journey-mission-title">
                    <small>Mission {mission.priority}</small>
                    <h4>{mission.title}</h4>
                  </div>
                  <div className="journey-primary-outcome">
                    <small>Primary outcome</small>
                    <p>{mission.primaryBusinessOutcome}</p>
                  </div>
                  <dl>
                    <div>
                      <dt>Effort</dt>
                      <dd>{mission.effort}</dd>
                    </div>
                    <div>
                      <dt>Window</dt>
                      <dd>{mission.timeEstimate}</dd>
                    </div>
                  </dl>
                  <div className="journey-success-signal">
                    <small>Success signal</small>
                    <p>{mission.successCriteria[0]}</p>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        ) : (
          <p className="upgrade-empty-state">{upgradeOSEmptyStateText.missions}</p>
        )}
      </section>

      <blockquote className="upgrade-operating-focus">
        <Flag size={22} aria-hidden="true" />
        <div>
          <span>Operating Focus</span>
          <p>{journey.operatingFocus}</p>
        </div>
      </blockquote>

      <footer className="upgrade-print-utility">
        <div>
          <span>{journey.ownerLabel}</span>
          <strong aria-label="Blank owner or team field">____________________________</strong>
        </div>
        <div>
          <span>Review date</span>
          <strong>{journey.reviewDate}</strong>
        </div>
        <div className="upgrade-notes-field">
          <span>Team notes</span>
          <i />
          <i />
        </div>
      </footer>
    </section>
  )
}

export function UpgradeMissionsReport({
  missions,
}: {
  missions: UpgradeMission[]
}) {
  return (
    <section
      className="report-page upgrade-mission-details-page"
      aria-labelledby="upgrade-missions-title"
    >
      <div className="report-page-heading">
        <p className="section-kicker">From direction to execution</p>
        <h2 id="upgrade-missions-title">Your Upgrade Missions</h2>
        <p>
          Each mission separates what is known now from the action, intended impact,
          and proof required before progress can be verified.
        </p>
      </div>

      {missions.length > 0 ? (
        <ol className="upgrade-mission-detail-list">
          {missions.map((mission) => (
            <li key={mission.id}>
              <UpgradeMissionCard mission={mission} />
            </li>
          ))}
        </ol>
      ) : (
        <p className="upgrade-empty-state">{upgradeOSEmptyStateText.missions}</p>
      )}
    </section>
  )
}

function UpgradeMissionCard({ mission }: { mission: UpgradeMission }) {
  return (
    <article className="upgrade-mission-card">
      <header>
        <div>
          <span>Mission {mission.priority}</span>
          <h3>{mission.title}</h3>
          <small>{mission.category} · {mission.effort} effort · {mission.timeEstimate}</small>
        </div>
        <span
          className={`upgrade-mission-status ${statusClass(mission.sourceStatus)}`}
          aria-label={`Mission status: ${mission.sourceStatus}`}
        >
          {mission.sourceStatus}
        </span>
      </header>

      <section className="upgrade-mission-objective">
        <Target size={18} aria-hidden="true" />
        <div>
          <span>Mission Objective</span>
          <p>{mission.objective}</p>
        </div>
      </section>

      {mission.dependencyWarnings.length > 0 && (
        <aside className="upgrade-dependency-note">
          <Clock3 size={17} aria-hidden="true" />
          <div>
            <strong>Sequence before speed</strong>
            {mission.dependencyWarnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </aside>
      )}

      <div className="upgrade-mission-body">
        <MissionDetail title="Evidence" icon={ShieldCheck}>
          {mission.evidence.length > 0 ? (
            <ul>
              {mission.evidence.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : (
            <p className="upgrade-preliminary-evidence">
              {upgradeOSEmptyStateText.evidence}
            </p>
          )}
        </MissionDetail>

        <MissionDetail title="Action Plan" icon={NotebookPen}>
          <ol>
            {mission.actionPlan.map((step, index) => (
              <li key={step}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </MissionDetail>

        <MissionDetail title="Expected Outcome" icon={MoveRight}>
          <p>{mission.expectedOutcome}</p>
          <small>Planning hypothesis — verify before claiming impact.</small>
        </MissionDetail>

        <MissionDetail title="Success Criteria" icon={CheckCircle2}>
          <ul className="upgrade-success-list">
            {mission.successCriteria.map((item) => (
              <li key={item}>
                <Check size={14} aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </MissionDetail>
      </div>

      <footer className="upgrade-verification-method">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>
          <strong>Verification Method</strong>
          <p>{mission.verificationMethod}</p>
        </span>
      </footer>
    </article>
  )
}

function MissionDetail({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof Target
  children: React.ReactNode
}) {
  return (
    <section className="upgrade-mission-detail">
      <h4>
        <Icon size={16} aria-hidden="true" />
        {title}
      </h4>
      {children}
    </section>
  )
}

export function UpgradeAccountabilityReport({
  ledger,
  achievements,
  snapshotRecord,
}: {
  ledger: ImpactLedgerEntry[]
  achievements: BusinessAchievement[]
  snapshotRecord: SnapshotRecordCheckpoint[]
}) {
  const hasVerifiedEntry = ledger.some((entry) => entry.status === 'Verified')

  return (
    <section
      className="report-page upgrade-accountability-page"
      aria-labelledby="impact-ledger-title"
    >
      <div className="report-page-heading">
        <p className="section-kicker">Evidence before claims</p>
        <h2 id="impact-ledger-title">Impact Ledger</h2>
        <p>
          {hasVerifiedEntry
            ? 'Every mission begins with a baseline. Verification appears only where a recorded method and linked after-state support the observable result.'
            : 'Every mission begins with a baseline, ends with new proof, and remains unverified until a future Snapshot reviews the result.'}
        </p>
      </div>

      <div className="impact-ledger-list">
        {ledger.length === 0 && (
          <p className="upgrade-empty-state">No ledger entries are available until an Upgrade Mission is selected.</p>
        )}
        {ledger.map((entry, index) => (
          <article className="impact-ledger-entry" key={entry.missionId}>
            <header>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{entry.missionTitle}</h3>
              <strong className={statusClass(entry.status)}>{entry.status}</strong>
            </header>
            <dl>
              <div>
                <dt>Baseline</dt>
                <dd>{entry.baselineEvidence[0] ?? upgradeOSEmptyStateText.evidence}</dd>
              </div>
              {entry.completionDate && (
                <div>
                  <dt>Completion date</dt>
                  <dd>{entry.completionDate}</dd>
                </div>
              )}
              {entry.verificationEvidence && entry.verificationEvidence.length > 0 && (
                <div>
                  <dt>After evidence</dt>
                  <dd>{entry.verificationEvidence[0]}</dd>
                </div>
              )}
              {entry.verificationMethod && (
                <div>
                  <dt>Recorded verification method</dt>
                  <dd>{entry.verificationMethod}</dd>
                </div>
              )}
              <div>
                <dt>Next proof required</dt>
                <dd>{entry.nextProofRequired}</dd>
              </div>
              <div>
                <dt>Verification timing</dt>
                <dd>{entry.verificationTiming}</dd>
              </div>
            </dl>
            {entry.actionTaken && (
              <p className="impact-action-taken">
                <strong>Progress note:</strong> {entry.actionTaken}
              </p>
            )}
            {entry.businessImpact && (
              <p className="impact-action-taken">
                <strong>Conservative outcome note:</strong> {entry.businessImpact}
              </p>
            )}
          </article>
        ))}
      </div>

      <section className="achievement-path" aria-labelledby="achievement-path-title">
        <div className="upgrade-report-section-heading">
          <span>
            <Medal size={18} aria-hidden="true" />
            Operating milestones to verify
          </span>
          <h3 id="achievement-path-title">Achievement Path</h3>
        </div>
        {achievements.length > 0 ? (
          <div className="achievement-card-grid">
            {achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        ) : (
          <p className="upgrade-empty-state">{upgradeOSEmptyStateText.achievements}</p>
        )}
      </section>

      <section className="snapshot-record" aria-labelledby="snapshot-record-title">
        <div className="upgrade-report-section-heading">
          <span>
            <Clock3 size={18} aria-hidden="true" />
            A measurable operating history
          </span>
          <h3 id="snapshot-record-title">Snapshot Record</h3>
        </div>
        <ol>
          {snapshotRecord.map((checkpoint) => (
            <li key={checkpoint.id}>
              <article className={checkpoint.status === 'Baseline Recorded' ? 'recorded' : ''}>
                <span className="snapshot-record-marker" aria-hidden="true">
                  {checkpoint.status === 'Baseline Recorded'
                    ? <CheckCircle2 size={18} />
                    : <Circle size={18} />}
                </span>
                <small>{checkpoint.status}</small>
                <h4>{checkpoint.label}</h4>
                <p>{checkpoint.dateLabel}</p>
                <dl>
                  <div>
                    <dt>Archetype</dt>
                    <dd>{checkpoint.archetype ?? 'To be recorded'}</dd>
                  </div>
                  <div>
                    <dt>Business Health Score</dt>
                    <dd>
                      {checkpoint.businessHealthScore === null
                        ? checkpoint.status === 'Baseline Recorded'
                          ? 'Score unavailable'
                          : 'To be recorded'
                        : `${checkpoint.businessHealthScore}/100`}
                    </dd>
                  </div>
                </dl>
              </article>
            </li>
          ))}
        </ol>
        <p className="snapshot-record-note">
          This is the beginning of a measurable history. Future scores and milestones
          appear only after a new reviewed Snapshot.
        </p>
      </section>
    </section>
  )
}

function AchievementCard({
  achievement,
}: {
  achievement: BusinessAchievement
}) {
  const isLocked = achievement.status === 'Locked'
  return (
    <article className={`achievement-card ${statusClass(achievement.status)}`}>
      <span className="achievement-seal" aria-hidden="true">
        {isLocked ? <LockKeyhole size={20} /> : <Medal size={21} />}
      </span>
      <div>
        <small>{achievement.status}</small>
        <h4>{achievement.title}</h4>
        <p>{achievement.description}</p>
        <strong>{achievement.verificationRequirements[0]}</strong>
      </div>
    </article>
  )
}
