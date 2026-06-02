import type { CtaStyle, SnapshotForm, SnapshotOutputs } from '../types'

const ctaCopy: Record<CtaStyle, string> = {
  'ask-permission': 'Would it be useful if I sent over the quick 3-point snapshot?',
  'send-snapshot': 'I can send the short snapshot over if you want to see the details.',
  'book-call': 'If it is useful, we can book a short call and walk through the easiest fixes.',
}

function valueOrFallback(value: string, fallback: string) {
  return value.trim() || fallback
}

function introByTone(tone: SnapshotForm['tone'], businessName: string) {
  if (tone === 'expert') {
    return `I reviewed ${businessName} from the perspective of how clearly search engines and AI tools can understand the business.`
  }

  if (tone === 'blunt') {
    return `I took a quick look at ${businessName}. A few simple visibility issues stood out.`
  }

  return `I took a quick look at ${businessName} and noticed a few simple ways the site could be clearer for Google and AI search tools.`
}

function closingByTone(tone: SnapshotForm['tone']) {
  if (tone === 'expert') {
    return 'The goal is not to chase hype. It is to make the business easier to understand, cite, and trust.'
  }

  if (tone === 'blunt') {
    return 'None of this requires a full rebuild. It is mostly clarity and structure.'
  }

  return 'These are practical updates, not a big technical project.'
}

export function generateOutputs(
  form: SnapshotForm,
  totalScore: number,
  rating: string,
): SnapshotOutputs {
  const businessName = valueOrFallback(form.businessName, 'the business')
  const city = valueOrFallback(form.city, 'your service area')
  const niche = valueOrFallback(form.niche, 'local business')
  const mainService = valueOrFallback(form.mainService, 'your main service')
  const notes = valueOrFallback(
    form.notes,
    'The site has some useful information, but the strongest selling points could be easier to scan.',
  )
  const weakness = valueOrFallback(
    form.weakness,
    'The main opportunity is making the service, location, and trust signals clearer near the top of the site.',
  )
  const competitorNote = form.competitorNote.trim()
    ? `\n\nCompetitor note: ${form.competitorNote.trim()}`
    : ''
  const cta = ctaCopy[form.ctaStyle]
  const intro = introByTone(form.tone, businessName)
  const closing = closingByTone(form.tone)

  const snapshot = `${businessName} - Free AI Search Visibility Snapshot

Score: ${totalScore}/25 (${rating})

1. What is working
${notes}

2. Main visibility gap
${weakness}

3. Fastest improvement
Make it very obvious that ${businessName} provides ${mainService} in ${city}. Add clear service language, local proof, and a short FAQ so both people and AI search tools can understand the page quickly.${competitorNote}

${closing}`

  const email = `Hi ${businessName} team,

${intro}

Quick snapshot: I would rate the current visibility clarity at ${totalScore}/25 (${rating}). The biggest opportunity I noticed is this: ${weakness}

For a ${niche} in ${city}, I would tighten the page around ${mainService}, service area language, trust proof, and a short FAQ.

${cta}

Thanks.`

  const text = `Hi, I reviewed ${businessName} for AI/search visibility. Quick score: ${totalScore}/25 (${rating}). Main gap: ${weakness} ${cta}`

  const followUp = `Thanks for replying.

The short version: ${businessName} can likely improve visibility by making ${mainService}, ${city}, trust proof, and common customer questions easier to find on the site.

I can turn the quick snapshot into a clear action list if you want the next step.`

  const upsell = `Paid AI Search Readiness PDF

For ${businessName}, I can prepare a concise PDF report for $197 that includes:

- Current visibility score and category breakdown
- The top page clarity issues affecting search and AI readability
- Recommended service-area and trust-proof updates
- FAQ/content suggestions for ${mainService}
- A simple priority checklist for cleanup

The report is written in plain language so it can be used by the owner, marketing person, or web contractor.`

  return {
    snapshot,
    email,
    text,
    followUp,
    upsell,
  }
}
