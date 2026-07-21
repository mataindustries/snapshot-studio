import type { ScoreKey, Scores, SnapshotForm, SnapshotOutputs, Tone } from '../types'
import {
  formatSentencePhrase,
  getClientFacingCategoryLabel,
  getDisplayBusinessName,
  getDisplayCity,
  getRecommendationSubject,
  hasClientFacingValue,
} from '../lib/reportDisplay'
import { filterClientFacingStrengths } from '../lib/clientStrengths'

type Archetype =
  | 'Hidden Authority'
  | 'Local Legend'
  | 'Sleeping Giant'
  | 'Invisible Expert'
  | 'Reputation Magnet'
  | 'Category Builder'
  | 'Search Signal Builder'
  | 'Market Challenger'

type ArchetypeArtworkKey =
  | 'hiddengem'
  | 'locallegend'
  | 'sleepinggiant'
  | 'invisibleexpert'
  | 'trustmagnet'
  | 'wanderinggeneralist'
  | 'aiblindspot'
  | 'competitorsnack'

type BusinessHoroscope = {
  archetype: Archetype
  archetypeExplanation: string
  biggestStrength: string
  blindSpot: string
  fastestWin: string
  archetypeSummary: string
  archetypeImagePath: string
  shareSummary: string
  shareCta: string
  scoreExplanations: string[]
  strengths: string[]
  weaknesses: string[]
  competitorSummary: string
  missedOpportunity: string
  fixPlan: string[]
  outreachSummary: string
  cta: string
  premiumUpsell: string
}

const scoreNames: Record<ScoreKey, string> = {
  visibility: 'Visibility',
  trust: 'Trust',
  conversion: 'Conversion',
  aiSearchReadiness: 'AI Search Readiness',
  competitorPosition: 'Competitor Position',
}

const toneLine: Record<Tone, string> = {
  fun: 'playful but useful',
  professional: 'clear and business-focused',
  spicy: 'direct, punchy, and a little spicy',
  premium: 'polished, strategic, and calm',
  friendly: 'playful but useful',
  expert: 'clear and business-focused',
  blunt: 'direct, punchy, and a little spicy',
}

function normalizeTone(tone: Tone): Tone {
  if (tone === 'friendly') return 'fun'
  if (tone === 'expert') return 'professional'
  if (tone === 'blunt') return 'spicy'
  return tone
}

function formatList(items: string[]) {
  return items.map((item) => `- ${item}`).join('\n')
}

function formatUrlLabel(url: string) {
  const trimmed = url.trim()
  if (!trimmed) return ''

  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    const host = parsed.hostname.replace(/^www\./, '')
    const path = parsed.pathname.replace(/\/$/, '')
    return path && path !== '/' ? `${host}${path}` : host
  } catch {
    return trimmed.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')
  }
}

function isPatientIndustry(form: SnapshotForm) {
  const signal = `${form.niche} ${form.mainService}`.toLowerCase()
  return /dental|dentist|orthodont|periodont|endodont|implant|veneers|teeth|medical|clinic|patient/.test(signal)
}

function getAudiencePhrase(form: SnapshotForm, style: 'local-first' | 'in-city' = 'in-city') {
  const city = getDisplayCity(form)
  const industry = getClientFacingCategoryLabel(form)
  const hasCity = hasClientFacingValue(form.city)
  const hasCategory = hasClientFacingValue(form.mainService) || hasClientFacingValue(form.niche)

  if (isPatientIndustry(form)) {
    if (!hasCity) return 'local patients'
    return style === 'local-first' ? `${city} patients` : `patients in ${city}`
  }

  if (!hasCategory) return hasCity ? 'buyers in ' + city : 'local buyers'
  if (!hasCity) return industry.toLowerCase() + ' buyers in the local market'
  return style === 'local-first' ? `${city} ${industry.toLowerCase()} buyers` : `${industry.toLowerCase()} buyers in ${city}`
}

function getLowestScore(scores: Scores) {
  return (Object.keys(scores) as ScoreKey[]).reduce((lowest, key) =>
    scores[key] < scores[lowest] ? key : lowest,
  'visibility')
}

function getHighestScores(scores: Scores) {
  return (Object.keys(scores) as ScoreKey[])
    .sort((left, right) => scores[right] - scores[left])
    .slice(0, 3)
}

export function getDigitalZodiac(scores: Scores, totalScore: number): Archetype {
  const lowest = getLowestScore(scores)

  if (scores.competitorPosition <= 6) return 'Market Challenger'
  if (scores.aiSearchReadiness <= 7) return 'Search Signal Builder'
  if (scores.visibility <= 7 && scores.trust >= 13) return 'Hidden Authority'
  if (scores.visibility <= 8) return 'Invisible Expert'
  if (scores.trust >= 17) return 'Reputation Magnet'
  if (scores.visibility >= 16 && scores.competitorPosition >= 15 && totalScore >= 78) {
    return 'Local Legend'
  }
  if (scores.conversion <= 9 || lowest === 'conversion') return 'Sleeping Giant'
  return 'Category Builder'
}

const archetypeArtworkKeys = {
  'Hidden Authority': 'hiddengem',
  'Local Legend': 'locallegend',
  'Sleeping Giant': 'sleepinggiant',
  'Invisible Expert': 'invisibleexpert',
  'Reputation Magnet': 'trustmagnet',
  'Category Builder': 'wanderinggeneralist',
  'Search Signal Builder': 'aiblindspot',
  'Market Challenger': 'competitorsnack',
} as const satisfies Record<Archetype, ArchetypeArtworkKey>

const archetypeArtworkPaths = {
  hiddengem: '/archetypes/hidden-gem.png',
  locallegend: '/archetypes/local-legend.png',
  sleepinggiant: '/archetypes/sleeping-giant.png',
  invisibleexpert: '/archetypes/invisible-expert.png',
  trustmagnet: '/archetypes/trust-magnet.png',
  wanderinggeneralist: '/archetypes/wandering-generalist.png',
  aiblindspot: '/archetypes/ai-blind-spot.png',
  competitorsnack: '/archetypes/competitor-snack.png',
} as const satisfies Record<ArchetypeArtworkKey, string>

const knownArchetypeArtworkKeys = new Set<ArchetypeArtworkKey>(
  Object.values(archetypeArtworkKeys),
)
const fallbackArchetypeArtworkPath = archetypeArtworkPaths.wanderinggeneralist

function normalizeArchetypeArtworkKey(identity: string) {
  return identity
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/^the/, '')
}

export function getArchetypeImagePath(archetype: string) {
  const exactArtworkKey = archetypeArtworkKeys[archetype as Archetype]
  if (exactArtworkKey) return archetypeArtworkPaths[exactArtworkKey]

  const artworkKey = normalizeArchetypeArtworkKey(archetype)

  if (knownArchetypeArtworkKeys.has(artworkKey as ArchetypeArtworkKey)) {
    return archetypeArtworkPaths[artworkKey as ArchetypeArtworkKey]
  }

  return fallbackArchetypeArtworkPath
}

function buildShareSummary(form: SnapshotForm, archetype: Archetype) {
  const localAudience = getAudiencePhrase(form, 'local-first')
  const service = formatSentencePhrase(getRecommendationSubject(form))

  const summaries: Record<Archetype, string> = {
    'Hidden Authority': `Trusted business substance is already present, but ${localAudience} may not see it soon enough to act.`,
    'Local Legend': 'A strong local presence is already working; sharper proof and next steps can extend that advantage.',
    'Sleeping Giant': 'Strong business potential is being held back by friction between customer interest and the first inquiry.',
    'Invisible Expert': `The expertise is credible; the ${service} story needs to become visible before buyers compare alternatives.`,
    'Reputation Magnet': 'Credibility is the strongest asset, and bringing it closer to the next step can turn trust into action.',
    'Category Builder': 'The foundation can support growth once one audience, service, and local promise lead the story.',
    'Search Signal Builder': 'Service, location, and proof need clearer structure for customers, search engines, and answer systems.',
    'Market Challenger': 'The business can compete more confidently once its proof, process, and local fit are easier to compare.',
  }

  return summaries[archetype]
}

function buildArchetypeSummary(form: SnapshotForm, archetype: Archetype, scores: Scores, totalScore: number) {
  const businessName = getDisplayBusinessName(form)
  const city = getDisplayCity(form)
  const service = formatSentencePhrase(getRecommendationSubject(form))

  const profiles: Record<Archetype, string> = {
    'Hidden Authority': `${businessName} already shows signs of a business people could trust, but that value is not yet prominent enough for first-time visitors. The priority is to bring the strongest proof and ${city} relevance closer to the first interaction.`,
    'Local Legend': `${businessName} has a strong public-facing foundation. The next move is focused refinement: clearer proof, a more explicit contact path, and a credible reason to choose ${service}.`,
    'Sleeping Giant': `${businessName} has useful business substance, but the handoff from visitor to inquiry creates conversion friction. Clearer next-step language, process detail, and mobile flow can improve decision confidence.`,
    'Invisible Expert': `${businessName} has expertise that is not yet visible enough to ${getAudiencePhrase(form)}. Clearer service pages, local context, and direct answers can turn that knowledge into stronger local authority.`,
    'Reputation Magnet': `${businessName} has credibility to work with. Place customer proof closer to forms, phone numbers, process cues, and the first step.`,
    'Category Builder': `${businessName} presents several broad signals without one clear focus. Making the primary audience, service, and local promise explicit will make the offer easier to evaluate.`,
    'Search Signal Builder': `${businessName} may be understandable to someone who already knows the company, but search and answer systems need more explicit facts. Plain-language service, location, FAQ, and proof sections will reduce ambiguity.`,
    'Market Challenger': `${businessName} faces conversion friction in a side-by-side comparison. Nearby alternatives may feel easier to choose when their proof, offer, process, or local fit is more explicit.`,
  }

  return `${profiles[archetype]} Current position: ${totalScore}/100, with the primary improvement pressure in ${scoreNames[getLowestScore(scores)]}.`
}

function scoreRead(score: number) {
  if (score >= 16) return 'Strong'
  if (score >= 11) return 'Workable'
  if (score >= 7) return 'Thin'
  return 'At risk'
}

function buildScoreExplanations(form: SnapshotForm, scores: Scores) {
  const city = getDisplayCity(form)
  const industry = getClientFacingCategoryLabel(form)
  const service = formatSentencePhrase(getRecommendationSubject(form))

  const map: Record<ScoreKey, string> = {
    visibility: `Visibility measures whether a ready buyer can quickly connect the site to ${industry}, ${service}, and ${city}.`,
    trust: `Trust measures whether reviews, credentials, before/after examples, guarantees, financing, awards, or real customer/patient outcomes are close enough to the decision point.`,
    conversion: `Conversion measures whether the phone/form/request path tells visitors what to do next and why the first step is low-friction.`,
    aiSearchReadiness: `AI Search Readiness measures whether services, locations, FAQs, and proof are written plainly enough for search and AI summaries.`,
    competitorPosition: `Competitor Position measures whether the site gives a clearer reason to choose this business over nearby alternatives.`,
  }

  return (Object.keys(scores) as ScoreKey[]).map((key) => {
    const read = scoreRead(scores[key])
    return `${scoreNames[key]}: ${scores[key]}/20 (${read}) - ${map[key]}`
  })
}

function buildStrengths(form: SnapshotForm, scores: Scores) {
  const businessName = getDisplayBusinessName(form)
  const city = getDisplayCity(form)
  const industry = getClientFacingCategoryLabel(form)
  const service = formatSentencePhrase(getRecommendationSubject(form))

  const strengthMap: Record<ScoreKey, string> = {
    visibility: `${businessName} already gives buyers a way to connect ${industry}, ${service}, and ${city} without starting from a blank page.`,
    trust: `Credible proof is available to feature more deliberately: reviews, credentials, before/after examples, guarantees, financing, awards, or real customer/patient outcomes.`,
    conversion: `The site has an inquiry path to build on; a clearer phone/form ask around ${service} could turn more visits into conversations.`,
    aiSearchReadiness: `The business has enough service and location signal to shape clearer search and answer-system summaries with cleaner page structure.`,
    competitorPosition: `The business has a defensible position; the next win is making its best proof easier to compare at a glance.`,
  }

  const scoredStrengths = getHighestScores(scores).map((key) => strengthMap[key])
  const note = form.notes.trim()

  return filterClientFacingStrengths(note ? [note, ...scoredStrengths] : scoredStrengths)
    .slice(0, 3)
}

function buildWeaknesses(form: SnapshotForm, scores: Scores) {
  const city = getDisplayCity(form)
  const industry = getClientFacingCategoryLabel(form)
  const service = formatSentencePhrase(getRecommendationSubject(form))

  const weaknessMap: Record<ScoreKey, string> = {
    visibility: `The page may not say ${industry}, ${service}, and ${city} quickly enough for a ready buyer scanning on a phone.`,
    trust: `The proof is not close enough to the decision. Reviews, credentials, before/after examples, guarantees, financing, awards, or real customer/patient outcomes should sit near the CTA, not buried.`,
    conversion: `The call/request path needs a cleaner promise: what happens next, how fast they respond, and why reaching out is low-risk.`,
    aiSearchReadiness: `Search and answer-system summaries may miss the business because services, locations, FAQs, and proof are not written as clear answers.`,
    competitorPosition: `Nearby alternatives may feel easier to choose when they explain ${service}, process, proof, pricing cues, or local fit more clearly.`,
  }

  const scoredWeaknesses = (Object.keys(scores) as ScoreKey[])
    .sort((left, right) => scores[left] - scores[right])
    .slice(0, 3)
    .map((key) => weaknessMap[key])
  const note = form.weakness.trim()

  if (!note) return scoredWeaknesses
  return [note, ...scoredWeaknesses].slice(0, 3)
}

function buildCompetitorSummary(form: SnapshotForm, scores: Scores) {
  const competitors = [form.competitorUrl1, form.competitorUrl2]
    .map(formatUrlLabel)
    .filter(Boolean)
  const note = form.competitorNote.trim()
  const city = getDisplayCity(form)
  const service = formatSentencePhrase(getRecommendationSubject(form))

  if (competitors.length > 0) {
    const position =
      scores.competitorPosition >= 16
        ? `is already credible in the comparison, so the win is to make its strongest proof easier to spot than ${competitors.join(' and ')}.`
        : scores.competitorPosition >= 10
          ? `is in a winnable middle position, but the page needs a sharper why-us reason before a visitor opens ${competitors.join(' or ')} in another tab.`
          : `is exposed in the comparison; ${competitors.join(' and ')} may feel easier to choose if they show clearer proof, process, pricing cues, or local relevance.`
    const manualNote = note ? ` Manual comparison note: ${note}` : ''
    return `Against ${competitors.join(' and ')}, this business ${position} The practical fix is to put ${service} fit, proof, and the next step above the fold on mobile.${manualNote}`
  }

  return `No competitor URLs were added, so this reads as a market-position check. In ${city}, the site still has to answer the comparison question: why this business, why this service, and why contact now?${note ? ` Manual comparison note: ${note}` : ''}`
}

function buildMissedOpportunity(form: SnapshotForm, scores: Scores) {
  const lowest = getLowestScore(scores)
  const service = formatSentencePhrase(getRecommendationSubject(form))
  const city = getDisplayCity(form)

  const map: Record<ScoreKey, string> = {
    visibility: `Create or tighten a dedicated ${service} page for ${city} so high-intent visitors and search systems can connect the business to the exact need.`,
    trust: `Move the best proof near the decision point: reviews, credentials, before/after examples, guarantees, financing, awards, or real customer/patient outcomes.`,
    conversion: `Turn the primary CTA into a decision helper: what happens after they call, how fast they hear back, and why the first step is easy.`,
    aiSearchReadiness: 'Add plain-language FAQs and clearly labeled service, location, process, and proof sections that reduce ambiguity for customers, search engines, and answer systems.',
    competitorPosition: `Spell out why this business is the safer or easier choice versus nearby alternatives, using proof instead of broad claims.`,
  }

  return map[lowest]
}

function buildFixPlan(form: SnapshotForm) {
  const service = formatSentencePhrase(getRecommendationSubject(form))
  const city = getDisplayCity(form)

  return [
    `Hours 0–24: Review the evidence and clarify the first screen around ${service}, ${city}, credible proof, and one next step.`,
    'Hours 24–48: Implement the highest-priority trust or contact-path improvement, then check it on desktop and mobile.',
  ]
}

export function buildBusinessHoroscope(
  form: SnapshotForm,
  scores: Scores,
  totalScore: number,
): BusinessHoroscope {
  const businessName = getDisplayBusinessName(form)
  const archetype = getDigitalZodiac(scores, totalScore)
  const missedOpportunity = buildMissedOpportunity(form, scores)
  const competitorSummary = buildCompetitorSummary(form, scores)
  const strengths = buildStrengths(form, scores)
  const weaknesses = buildWeaknesses(form, scores)
  const fixPlan = buildFixPlan(form)
  const archetypeExplanation = buildShareSummary(form, archetype)

  return {
    archetype,
    archetypeExplanation,
    biggestStrength: strengths[0] ?? 'A practical foundation is in place to support the next improvement.',
    blindSpot: weaknesses[0] ?? missedOpportunity,
    fastestWin: fixPlan[0].replace(/^Hours 0–24:\s*/, ''),
    archetypeSummary: buildArchetypeSummary(form, archetype, scores, totalScore),
    archetypeImagePath: getArchetypeImagePath(archetype),
    shareSummary: archetypeExplanation,
    shareCta: 'Want me to send the three fixes I would make first?',
    scoreExplanations: buildScoreExplanations(form, scores),
    strengths,
    weaknesses,
    competitorSummary,
    missedOpportunity,
    fixPlan,
    outreachSummary: `${businessName} scored ${totalScore}/100 and matches the ${archetype} archetype. The focus is to help ${getAudiencePhrase(form)} understand the offer faster, use customer proof, compare with confidence, and complete the next step on a phone.`,
    cta: 'The next conversation can confirm the first implementation move, the evidence behind it, and who will own the work.',
    premiumUpsell: 'Optional implementation path: a screenshot-backed 48-Hour Visibility Sprint focused on the highest-priority improvements. Scope and investment can be tailored before the report is shared.',
  }
}

function buildSnapshot(form: SnapshotForm, scores: Scores, totalScore: number) {
  const report = buildBusinessHoroscope(form, scores, totalScore)
  const businessName = getDisplayBusinessName(form)
  const websiteLine = form.websiteUrl.trim() ? "\nWebsite: " + form.websiteUrl.trim() : ""
  const city = getDisplayCity(form)
  const industry = getClientFacingCategoryLabel(form)
  const tone = toneLine[normalizeTone(form.tone)]
  const categoryScores = (Object.keys(scores) as ScoreKey[])
    .map((key) => `- ${scoreNames[key]}: ${scores[key]}/20`)
    .join('\n')

  return `Business Archetype: ${businessName}${websiteLine}
Market: ${city} | ${industry}
Tone: ${tone}

1. Business Archetype
${businessName}
${report.archetype}
Image: ${report.archetypeImagePath}
${report.archetypeExplanation}
Biggest Strength: ${report.biggestStrength}
Blind Spot: ${report.blindSpot}
Fastest Win: ${report.fastestWin}

Business Snapshot
Business: ${businessName} serves ${getAudiencePhrase(form)} looking for ${formatSentencePhrase(getRecommendationSubject(form))} in ${city}.
Current Position: ${totalScore}/100 — ${report.archetype}.
Largest Opportunity: ${report.missedOpportunity}
Fastest Win: ${report.fixPlan[0]}
Long-term Goal: Become easier to discover, trust, and choose across the local market.
Estimated Effort: Two focused work windows across 48 hours to establish momentum.
Expected Outcome: Customers understand the offer, proof, and next step before comparing another option.

2. Current Position
${totalScore}/100

3. Category scores
${categoryScores}

Score explanations
${formatList(report.scoreExplanations)}

4. What You're Already Winning
${formatList(report.strengths)}

5. Priority observations
${formatList(report.weaknesses)}

6. Competitor comparison summary
${report.competitorSummary}

7. The Highest-Leverage Improvement
${report.missedOpportunity}

8. 48-Hour Visibility Sprint
${formatList(report.fixPlan)}

9. Outreach-ready summary
${report.outreachSummary}

10. Implementation conversation
${report.cta}

Share card
Image: ${report.archetypeImagePath}
Business Archetype: ${report.archetype}
Summary: ${report.shareSummary}
Score: ${totalScore}/100
CTA: ${report.shareCta}

${report.premiumUpsell}`
}

function buildText(form: SnapshotForm, totalScore: number, archetype: Archetype) {
  const businessName = getDisplayBusinessName(form)
  const shareSummary = buildShareSummary(form, archetype)
  const message = `Hi, I made a quick website snapshot for ${businessName}: ${totalScore}/100, ${archetype}. ${shareSummary} Want me to send the three fixes I’d make first?`

  return message.length <= 280 ? message : `${message.slice(0, 276).trimEnd()}...`
}

function buildEmail(form: SnapshotForm, totalScore: number, archetype: Archetype) {
  const businessName = getDisplayBusinessName(form)
  const service = formatSentencePhrase(getRecommendationSubject(form))
  const shareSummary = buildShareSummary(form, archetype)

  return `Subject: Quick website snapshot for ${businessName}

Hi ${businessName} team,

I prepared a concise Business Archetype snapshot for your website. It scored ${totalScore}/100 and matches the ${archetype} archetype.

The short version: ${shareSummary}

I looked at whether ${getAudiencePhrase(form)} can quickly understand ${service}, trust the business, compare it with alternatives, and reach out from a phone.

Want me to send the three fixes I’d make first?`
}

function buildShareable(
  form: SnapshotForm,
  totalScore: number,
  report: BusinessHoroscope,
) {
  const businessName = getDisplayBusinessName(form)
  const service = formatSentencePhrase(getRecommendationSubject(form))
  const city = getDisplayCity(form)

  return `Your Business Archetype

${businessName}
${report.archetype}
${report.archetypeExplanation}

Current Score
${totalScore}/100

Biggest Opportunity
${report.missedOpportunity}

Fastest Win
${report.fastestWin}

48-Hour Sprint
${report.fixPlan.join('\n')}

One Month Roadmap
Week 1 — Clarity: Make ${service} and ${city} relevance unmistakable.
Week 2 — Trust: Place the strongest proof beside the customer decision.
Week 3 — Authority: Strengthen the service story with useful local detail.
Week 4 — AI Readiness: Publish direct answers about service, location, process, and proof.

Generate your own Snapshot Studio report.`
}

export function generateOutputs(
  form: SnapshotForm,
  scores: Scores,
  totalScore: number,
): SnapshotOutputs {
  const report = buildBusinessHoroscope(form, scores, totalScore)

  return {
    snapshot: buildSnapshot(form, scores, totalScore),
    email: buildEmail(form, totalScore, report.archetype),
    text: buildText(form, totalScore, report.archetype),
    shareable: buildShareable(form, totalScore, report),
    upsell: report.premiumUpsell,
  }
}
