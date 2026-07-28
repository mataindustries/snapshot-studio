import { Check, MoveUpRight, Wrench } from 'lucide-react'
import { implementationPaths } from '../lib/reportStory'
import {
  getReportCtaBody,
  getReportCtaHeadline,
  getReportCtaLabel,
  getInvestmentLine,
} from '../lib/reportOffer'
import {
  getRenderableReportConfiguration,
  type ReportConfiguration,
} from '../lib/reportConfig'
import type { ReportOfferFields } from '../types'
import './ImplementationPathsReport.css'

export function ImplementationPathsReport({
  offer,
  configuration,
}: {
  offer: ReportOfferFields
  configuration: ReportConfiguration
}) {
  const investmentLine = getInvestmentLine(offer)
  const configured = getRenderableReportConfiguration(configuration)
  const bookingUrl = configured.CONSULTATION_URL
  const headline = getReportCtaHeadline(offer.ctaHeadline)
  const body = getReportCtaBody(offer.ctaBody)
  const ctaLabel = getReportCtaLabel(offer.ctaLabel)
  const contactLine = configured.CONTACT_EMAIL

  return (
    <section
      className="report-page implementation-paths-page report-closing-group"
      aria-labelledby="implementation-paths-title"
    >
      <div className="report-page-heading">
        <p className="section-kicker">Two practical ways forward</p>
        <h2 id="implementation-paths-title">Two Ways Forward</h2>
        <p>
          The priorities stay the same. Choose the path that fits your available time,
          internal capacity, and preferred pace.
        </p>
      </div>

      <div className="implementation-path-grid">
        {implementationPaths.map((path) => (
          <article
            className={'implementation-path-card ' + (path.featured ? 'featured' : '')}
            key={path.option}
          >
            <header>
              <span>{path.option}</span>
              {path.featured && <Wrench size={20} aria-hidden="true" />}
            </header>
            <h3>{path.title}</h3>
            <p>{path.description}</p>
            <ul>
              {path.includes.map((item) => (
                <li key={item}>
                  <Check size={16} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {path.featured && investmentLine && (
              <div className="investment-line">
                <strong>{investmentLine}</strong>
              </div>
            )}
          </article>
        ))}
      </div>

      <p className="implementation-choice-note">
        Whichever path you choose, finish with a new Snapshot. It will show what improved,
        what still needs attention, and where the next round can create the most value.
      </p>

      <section className="final-report-cta" aria-labelledby="final-cta-title">
        <span className="final-cta-icon" aria-hidden="true">
          <MoveUpRight size={22} />
        </span>
        <div>
          <p className="section-kicker">Next step</p>
          <h2 id="final-cta-title">{headline}</h2>
          <p>{body}</p>
          {(bookingUrl || contactLine) && (
            <div className="final-cta-action-row">
              {bookingUrl && (
              <a className="final-cta-link" href={bookingUrl} target="_blank" rel="noreferrer">
                {ctaLabel}
              </a>
            )}
              {contactLine && (
                <a className="final-cta-contact" href={`mailto:${contactLine}`}>
                  {contactLine}
                </a>
              )}
            </div>
          )}
        </div>
      </section>
    </section>
  )
}
