import { AlertTriangle } from 'lucide-react'
import type { ReportValidationResult } from '../lib/reportValidation'

export function ReportValidationBanner({
  validation,
}: {
  validation: ReportValidationResult
}) {
  if (validation.valid) return null

  return (
    <aside
      className="report-validation-banner screen-only"
      role="alert"
      aria-labelledby="report-validation-title"
    >
      <header>
        <AlertTriangle size={18} aria-hidden="true" />
        <strong id="report-validation-title">Export blocked — review the report</strong>
      </header>
      <ul>
        {validation.issues.map((issue) => (
          <li key={issue.code}>
            <strong>{issue.section}:</strong> {issue.message}
          </li>
        ))}
      </ul>
    </aside>
  )
}
