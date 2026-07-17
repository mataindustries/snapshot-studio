import { BarChart3 } from 'lucide-react'
import { preliminaryEvidenceNote, upgradeOsSupportingText } from '../lib/reportStory'
import './PoweredByFooter.css'

export function PoweredByFooter({ preliminary = false }: { preliminary?: boolean }) {
  return (
    <footer className="report-footer upgradeos-footer report-closing-group">
      <div className="upgradeos-brand-lockup">
        <span className="upgradeos-mark" aria-hidden="true">
          <BarChart3 size={17} />
        </span>
        <span>
          <strong>Snapshot Studio</strong>
          <small>Powered by UpgradeOS</small>
        </span>
      </div>
      <p>{upgradeOsSupportingText}</p>
      {preliminary && <p className="preliminary-evidence-note">{preliminaryEvidenceNote}</p>}
    </footer>
  )
}
