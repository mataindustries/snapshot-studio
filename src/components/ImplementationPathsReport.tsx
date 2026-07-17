import { Check, MoveUpRight, Wrench } from 'lucide-react'
import { implementationPaths } from '../lib/reportStory'
import {
  defaultReportOffer,
  getInvestmentLine,
  getSafeBookingUrl,
} from '../lib/reportOffer'
import type { ReportOfferFields } from '../types'
import './ImplementationPathsReport.css'

export function ImplementationPathsReport({ offer }: { offer: ReportOfferFields }) {
  const investmentLine = getInvestmentLine(offer)
  const bookingUrl = getSafeBookingUrl(offer.bookingUrl)
  const headline = offer.ctaHeadline.trim() || defaultReportOffer.ctaHeadline
  const body = offer.ctaBody.trim() || defaultReportOffer.ctaBody
  const ctaLabel = offer.ctaLabel.trim() || defaultReportOffer.ctaLabel
  const contactLine = offer.ctaContactLine.trim()

  return (
    <section
      className="report-page implementation-paths-page report-closing-group"
      aria-labelledby="implementation-paths-title"
    >
      <div className="report-page-heading">
        <p className="section-kicker">Two practical ways forward</p>
        <h2 id="implementation-paths-title">DIY vs Done-For-You</h2>
        <p>
          The strategy stays the same. Choose the implementation path that best fits
          your time, team, and preferred level of support.
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
        Either path should end with a new Snapshot. That follow-up provides the verified
        before-and-after view; projected scores are not guarantees.
      </p>

      <section className="final-report-cta" aria-labelledby="final-cta-title">
        <span className="final-cta-icon" aria-hidden="true">
          <MoveUpRight size={22} />
        </span>
        <div>
          <p className="section-kicker">Next step</p>
          <h2 id="final-cta-title">{headline}</h2>
          <p>{body}</p>
          <div className="final-cta-action-row">
            {bookingUrl ? (
              <a className="final-cta-link" href={bookingUrl} target="_blank" rel="noreferrer">
                {ctaLabel}
              </a>
            ) : (
              <strong className="final-cta-label">{ctaLabel}</strong>
            )}
            {contactLine && <span className="final-cta-contact">{contactLine}</span>}
          </div>
        </div>
      </section>
    </section>
  )
}
