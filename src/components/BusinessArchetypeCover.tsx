import {
  ArrowUpRight,
  BadgeCheck,
  Crown,
  Eye,
  EyeOff,
  Mountain,
  Radio,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { getBusinessNameFitClass } from '../lib/reportDisplay'

type ArchetypePresentation = {
  slug: string
  icon: typeof Target
}

const archetypePresentations: Record<string, ArchetypePresentation> = {
  'Hidden Authority': {
    slug: 'hidden-authority',
    icon: EyeOff,
  },
  'Local Legend': {
    slug: 'local-legend',
    icon: Crown,
  },
  'Sleeping Giant': {
    slug: 'sleeping-giant',
    icon: Mountain,
  },
  'Invisible Expert': {
    slug: 'invisible-expert',
    icon: Search,
  },
  'Reputation Magnet': {
    slug: 'reputation-magnet',
    icon: BadgeCheck,
  },
  'Category Builder': {
    slug: 'category-builder',
    icon: Target,
  },
  'Search Signal Builder': {
    slug: 'search-signal-builder',
    icon: Radio,
  },
  'Market Challenger': {
    slug: 'market-challenger',
    icon: TrendingUp,
  },
}

function conciseInsight(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ')
  if (!normalized) return 'A clear starting point is ready for focused improvement.'

  const firstSentence = normalized.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? normalized
  return /[.!?]$/.test(firstSentence) ? firstSentence : firstSentence + '.'
}

type BusinessArchetypeCoverProps = {
  businessName: string
  marketLabel: string
  archetype: string
  identityStatement: string
  artworkPath?: string
  score: number | null
  biggestStrength: string
  blindSpot: string
  fastestWin: string
  nextEvolution: string
  brandName: string
  reportDate: string
  sampleLabel?: string
}

export function BusinessArchetypeCover({
  businessName,
  marketLabel,
  archetype,
  identityStatement,
  artworkPath,
  score,
  biggestStrength,
  blindSpot,
  fastestWin,
  nextEvolution,
  brandName,
  reportDate,
  sampleLabel,
}: BusinessArchetypeCoverProps) {
  const presentation = archetypePresentations[archetype]
    ?? archetypePresentations['Category Builder']
  const ArchetypeIcon = presentation.icon
  const businessNameFitClass = getBusinessNameFitClass(businessName)
  const insights = [
    {
      title: 'Top Competitive Asset',
      text: conciseInsight(biggestStrength),
      icon: Sparkles,
    },
    {
      title: 'Biggest Blind Spot',
      text: conciseInsight(blindSpot),
      icon: Eye,
    },
    {
      title: 'Fastest Win',
      text: conciseInsight(fastestWin),
      icon: Zap,
    },
    {
      title: 'Next Evolution',
      text: conciseInsight(nextEvolution),
      icon: ArrowUpRight,
    },
  ]

  return (
    <section
      className="share-card archetype-cover-card"
      data-archetype={presentation.slug}
      aria-labelledby="business-archetype-title"
    >
      <div className="archetype-cover-main">
        <div className="archetype-cover-copy">
          <p className="share-card-kicker">
            <span className="archetype-mark" aria-hidden="true">
              <ArchetypeIcon size={20} strokeWidth={1.8} />
            </span>
            Your Business Archetype
          </p>

          <div className="share-card-business">
            <strong className={businessNameFitClass}>{businessName}</strong>
            <small>{marketLabel}</small>
          </div>

          <div className="archetype-identity-row">
            <div className="archetype-title-block">
              <span>Your growth pattern</span>
              <h3 id="business-archetype-title">{archetype}</h3>
            </div>
            <div
              className={`share-card-score ${score === null ? 'score-unavailable' : ''}`}
              aria-label={score === null
                ? 'Business Health Score unavailable'
                : `Business Health Score ${score} out of 100`}
            >
              <strong>{score === null ? '—' : score}</strong>
              <small>{score === null ? 'Review required' : '/100'}</small>
              <span>Business Health Score</span>
            </div>
          </div>

          <p className="share-card-diagnosis">{identityStatement}</p>
        </div>

        <div className="share-card-media archetype-cover-artwork">
          {artworkPath ? (
            <img src={artworkPath} alt={`${archetype} archetype illustration`} />
          ) : (
            <ArchetypeIcon className="archetype-hero-icon" strokeWidth={1.15}
              role="img" aria-label={archetype + ' visual mark'} />
          )}
          <span>UpgradeOS archetype profile</span>
        </div>
      </div>

      <div className="archetype-insight-grid" aria-label="Business Archetype insights">
        {insights.map((insight) => {
          const InsightIcon = insight.icon
          return (
            <article className="archetype-insight-card" key={insight.title}>
              <span className="archetype-insight-icon" aria-hidden="true">
                <InsightIcon size={18} strokeWidth={1.9} />
              </span>
              <div>
                <h4>{insight.title}</h4>
                <p>{insight.text}</p>
              </div>
            </article>
          )
        })}
      </div>

      <footer className="archetype-cover-signature">
        <span>
          {brandName}
          {sampleLabel && <em> · {sampleLabel}</em>}
        </span>
        <small>{reportDate}</small>
        <strong>Powered by UpgradeOS</strong>
      </footer>
    </section>
  )
}
