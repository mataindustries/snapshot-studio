import { CalendarDays, Save, ShieldCheck } from 'lucide-react'
import { followUpScoreKeys } from '../lib/proofLoop'
import { scoreLabels } from '../lib/scoring'
import type { SavedSnapshot, ScoreKey, Scores } from '../types'
import type { Proposal } from '../types/proposal'
import './FollowUpSnapshotPanel.css'

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date not recorded'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function FollowUpSnapshotPanel({
  baseline,
  followUpDate,
  scores,
  reviewedScoreKeys,
  reviewDate,
  proposal,
  hasUnsavedChanges,
  onScoreReviewChange,
  onReviewDateChange,
  onSave,
}: {
  baseline: SavedSnapshot
  followUpDate: string
  scores: Scores
  reviewedScoreKeys: ScoreKey[]
  reviewDate: string
  proposal?: Proposal
  hasUnsavedChanges: boolean
  onScoreReviewChange: (key: ScoreKey, reviewed: boolean) => void
  onReviewDateChange: (value: string) => void
  onSave: () => void
}) {
  const reviewed = new Set(reviewedScoreKeys)
  const allReviewed = followUpScoreKeys.every((key) => reviewed.has(key))

  return (
    <section
      className="panel follow-up-review screen-only"
      id="follow-up-snapshot-review"
      aria-labelledby="follow-up-review-title"
    >
      <header>
        <div>
          <p className="section-kicker">Linked implementation review</p>
          <h2 id="follow-up-review-title">Follow-Up Snapshot</h2>
          <p>
            Baseline scores are carried forward only as unreviewed starting values. Confirm the
            current value for every category and add current after-state evidence before export.
          </p>
        </div>
        <span className={allReviewed ? 'reviewed' : 'pending'}>
          <ShieldCheck size={17} aria-hidden="true" />
          {reviewed.size}/{followUpScoreKeys.length} scores reviewed
        </span>
      </header>

      <dl className="follow-up-identity-grid">
        <div>
          <dt>Baseline Snapshot</dt>
          <dd>{formatDate(baseline.createdAt)}</dd>
        </div>
        <div>
          <dt>Follow-Up Snapshot</dt>
          <dd>{formatDate(followUpDate)}</dd>
        </div>
        <div>
          <dt>Engagement</dt>
          <dd>{proposal?.proposalTitle || 'Accepted proposal not linked'}</dd>
        </div>
        <div>
          <dt>Scope status</dt>
          <dd>{proposal?.proposalStatus === 'Accepted' ? 'Accepted' : 'Acceptance not recorded'}</dd>
        </div>
      </dl>

      <div className="follow-up-score-list" aria-label="Baseline and follow-up score review">
        {followUpScoreKeys.map((key) => {
          const isReviewed = reviewed.has(key)
          return (
            <article className={isReviewed ? 'reviewed' : 'pending'} key={key}>
              <div>
                <strong>{scoreLabels[key]}</strong>
                <span>{isReviewed ? 'Reviewed current value' : 'Not reviewed'}</span>
              </div>
              <dl>
                <div><dt>Baseline</dt><dd>{baseline.scores[key]}/20</dd></div>
                <div><dt>Follow-up</dt><dd>{scores[key]}/20</dd></div>
              </dl>
              <label>
                <input
                  type="checkbox"
                  checked={isReviewed}
                  onChange={(event) => onScoreReviewChange(key, event.target.checked)}
                />
                <span>Current value reviewed</span>
              </label>
            </article>
          )
        })}
      </div>

      <div className="follow-up-review-footer">
        <label>
          <span>
            <CalendarDays size={16} aria-hidden="true" />
            Next review date
          </span>
          <input
            type="date"
            value={reviewDate}
            onChange={(event) => onReviewDateChange(event.target.value)}
          />
        </label>
        <button className="primary-button" type="button" onClick={onSave}>
          <Save size={17} aria-hidden="true" />
          Save Follow-Up Snapshot
        </button>
        <strong className={hasUnsavedChanges ? 'unsaved' : 'saved'} role="status">
          {hasUnsavedChanges ? 'Unsaved follow-up changes' : 'Saved in this browser'}
        </strong>
      </div>
    </section>
  )
}
