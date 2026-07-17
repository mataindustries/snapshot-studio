import { AlertTriangle, CheckCircle2, FileSearch } from 'lucide-react'
import type { ReportReadinessResult } from '../lib/reportReadiness'

export function ReportReadiness({ readiness }: { readiness: ReportReadinessResult }) {
  const Icon = readiness.state === 'Ready to share'
    ? CheckCircle2
    : readiness.state === 'Preliminary snapshot'
      ? FileSearch
      : AlertTriangle

  return (
    <aside className={'report-readiness ' + readiness.state.toLowerCase().replaceAll(' ', '-')}>
      <div>
        <Icon size={18} aria-hidden="true" />
        <strong>{readiness.state === 'Needs details' ? 'Report needs details' : readiness.state}</strong>
      </div>
      {readiness.warnings.length > 0 && (
        <ul>
          {readiness.warnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      )}
    </aside>
  )
}
