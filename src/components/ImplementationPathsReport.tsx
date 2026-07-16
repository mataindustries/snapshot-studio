import { Check, Wrench } from 'lucide-react'
import { implementationPaths } from '../lib/reportStory'
import './ImplementationPathsReport.css'

export function ImplementationPathsReport() {
  return (
    <section
      className="report-page implementation-paths-page"
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
            className={`implementation-path-card ${path.featured ? 'featured' : ''}`}
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
            {path.featured && (
              <div className="editable-investment-line">
                <span>Investment</span>
                <strong
                  aria-label="Edit implementation investment"
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck={false}
                  title="Click to edit before printing"
                >
                  ________________
                </strong>
              </div>
            )}
          </article>
        ))}
      </div>

      <p className="implementation-choice-note">
        Either path should end with a new Snapshot. That follow-up provides the verified
        before-and-after view; projected scores are not guarantees.
      </p>
    </section>
  )
}
