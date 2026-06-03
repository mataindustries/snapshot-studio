import type { ScoreKey, Scores, SnapshotForm, SnapshotOutputs, Tone } from '../types'

type Archetype =
  | 'The Hidden Gem'
  | 'The Local Legend'
  | 'The Sleeping Giant'
  | 'The Invisible Expert'
  | 'The Trust Magnet'
  | 'The Wandering Generalist'
  | 'The AI Blind Spot'
  | 'The Competitor Snack'

type BusinessHoroscope = {
  archetype: Archetype
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

function valueOrFallback(value: string, fallback: string) {
  return value.trim() || fallback
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

  if (scores.competitorPosition <= 6) return 'The Competitor Snack'
  if (scores.aiSearchReadiness <= 7) return 'The AI Blind Spot'
  if (scores.visibility <= 7 && scores.trust >= 13) return 'The Hidden Gem'
  if (scores.visibility <= 8) return 'The Invisible Expert'
  if (scores.trust >= 17) return 'The Trust Magnet'
  if (scores.visibility >= 16 && scores.competitorPosition >= 15 && totalScore >= 78) {
    return 'The Local Legend'
  }
  if (scores.conversion <= 9 || lowest === 'conversion') return 'The Sleeping Giant'
  return 'The Wandering Generalist'
}

function buildStrengths(form: SnapshotForm, scores: Scores) {
  const businessName = valueOrFallback(form.businessName, 'The business')
  const city = valueOrFallback(form.city, 'the local market')
  const industry = valueOrFallback(form.niche, 'its industry')
  const service = valueOrFallback(form.mainService, 'its core offer')

  const strengthMap: Record<ScoreKey, string> = {
    visibility: `${businessName} has enough public-facing signal to start competing for ${industry} searches in ${city}.`,
    trust: `Trust is already a workable asset: proof, reviews, credentials, or credibility cues can be turned into faster buyer confidence.`,
    conversion: `The site has a path toward inquiries; sharpening the ask around ${service} can turn more visitors into calls.`,
    aiSearchReadiness: `There is a base for AI/search engines to understand who the business helps, where it operates, and what it offers.`,
    competitorPosition: `The business is not starting from zero against nearby alternatives; clearer positioning can make the comparison easier to win.`,
  }

  const scoredStrengths = getHighestScores(scores).map((key) => strengthMap[key])
  const note = form.notes.trim()

  if (!note) return scoredStrengths
  return [note, ...scoredStrengths].slice(0, 3)
}

function buildWeaknesses(form: SnapshotForm, scores: Scores) {
  const city = valueOrFallback(form.city, 'the target city')
  const industry = valueOrFallback(form.niche, 'the market')
  const service = valueOrFallback(form.mainService, 'the main service')

  const weaknessMap: Record<ScoreKey, string> = {
    visibility: `Searchers may not immediately see the strongest ${industry} and ${city} signals, which can suppress calls from ready buyers.`,
    trust: `Decision-making proof is too quiet; visitors need reviews, outcomes, credentials, guarantees, or examples before they feel safe reaching out.`,
    conversion: `The next step is not doing enough work. Calls, forms, and service-page CTAs should make the decision feel obvious.`,
    aiSearchReadiness: `AI and search systems may struggle to summarize the business cleanly because services, locations, FAQs, and proof are not explicit enough.`,
    competitorPosition: `Competitors may look easier to choose if they explain ${service}, pricing/process cues, proof, or local relevance more clearly.`,
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
  const competitors = [form.competitorUrl1, form.competitorUrl2].filter((url) => url.trim())
  const note = form.competitorNote.trim()
  const city = valueOrFallback(form.city, 'the local market')

  if (competitors.length > 0) {
    const position = scores.competitorPosition >= 14 ? 'can compete well' : 'needs a sharper reason to choose it'
    return `Compared with ${competitors.join(' and ')}, this business ${position}. The easiest comparison win is to make service fit, proof, and the next step visible before a visitor has to scroll or hunt.${note ? ` ${note}` : ''}`
  }

  return `No competitor URLs were added, so this reads as a market-position check. In ${city}, the site should make the choice easier by showing who it serves, what outcomes it creates, and why calling now is low-risk.${note ? ` ${note}` : ''}`
}

function buildMissedOpportunity(form: SnapshotForm, scores: Scores) {
  const lowest = getLowestScore(scores)
  const service = valueOrFallback(form.mainService, 'the highest-value service')
  const city = valueOrFallback(form.city, 'the local market')

  const map: Record<ScoreKey, string> = {
    visibility: `Create or tighten a dedicated ${service} page for ${city} so high-intent visitors and search systems can connect the business to the exact need.`,
    trust: `Move the best proof near the decision point: reviews, before/after examples, credentials, guarantees, or real customer outcomes.`,
    conversion: `Turn the primary CTA into a decision helper: what happens after they call, how fast they hear back, and why the first step is easy.`,
    aiSearchReadiness: `Add plain-language FAQs, service schema-friendly structure, and answer-style sections that AI/search tools can quote confidently.`,
    competitorPosition: `Spell out why this business is the safer or easier choice versus nearby alternatives, using proof instead of broad claims.`,
  }

  return map[lowest]
}

function buildFixPlan(form: SnapshotForm, scores: Scores) {
  const service = valueOrFallback(form.mainService, 'primary service')
  const city = valueOrFallback(form.city, 'service city')
  const weakest = scoreNames[getLowestScore(scores)]

  return [
    `Day 1: Rewrite the top section so ${service}, ${city}, proof, and the call/request action are visible immediately.`,
    'Day 2: Add three trust assets near the CTA: reviews, credentials, project examples, guarantees, financing, awards, or real results.',
    `Day 3: Build or improve one focused ${service} page with process, service area, FAQs, and who it is best for.`,
    'Day 4: Add answer-style FAQ sections for the questions buyers ask before contacting the business.',
    'Day 5: Compare the strongest competitor page and add one proof point or differentiator they make clearer.',
    'Day 6: Clean up buttons, forms, phone visibility, and page flow so the next step feels low-friction on mobile.',
    `Day 7: Review ${weakest} again and publish the smallest fix that would make a buyer choose faster.`,
  ]
}

export function buildBusinessHoroscope(
  form: SnapshotForm,
  scores: Scores,
  totalScore: number,
): BusinessHoroscope {
  const businessName = valueOrFallback(form.businessName, 'Business name')
  const city = valueOrFallback(form.city, 'City')
  const industry = valueOrFallback(form.niche, 'Industry')
  const archetype = getDigitalZodiac(scores, totalScore)
  const missedOpportunity = buildMissedOpportunity(form, scores)
  const competitorSummary = buildCompetitorSummary(form, scores)
  const tone = normalizeTone(form.tone)

  return {
    archetype,
    strengths: buildStrengths(form, scores),
    weaknesses: buildWeaknesses(form, scores),
    competitorSummary,
    missedOpportunity,
    fixPlan: buildFixPlan(form, scores),
    outreachSummary: `${businessName} scores ${totalScore}/100 and shows up as ${archetype}. The practical opportunity is not vague SEO; it is making ${industry} buyers in ${city} understand the offer faster, trust it sooner, and choose the next step with less hesitation.`,
    cta: `Want the premium version? Turn this into a screenshot-backed action plan with page-by-page fixes, competitor notes, and the exact copy updates most likely to produce more calls.`,
    premiumUpsell:
      tone === 'premium'
        ? `Premium recommendation: a Website Revenue Clarity Audit with screenshots, competitor positioning, AI/search readiness notes, and a prioritized 30-day implementation map.`
        : `Premium upsell: a $297 Business Horoscope Deep Dive with screenshots, competitor receipts, service-page copy fixes, and a 30-day plan built to create more calls and easier customer decisions.`,
  }
}

function buildSnapshot(form: SnapshotForm, scores: Scores, totalScore: number) {
  const report = buildBusinessHoroscope(form, scores, totalScore)
  const businessName = valueOrFallback(form.businessName, 'Business name')
  const websiteUrl = valueOrFallback(form.websiteUrl, 'Website URL')
  const city = valueOrFallback(form.city, 'City')
  const industry = valueOrFallback(form.niche, 'Industry')
  const tone = toneLine[normalizeTone(form.tone)]
  const categoryScores = (Object.keys(scores) as ScoreKey[])
    .map((key) => `- ${scoreNames[key]}: ${scores[key]}/20`)
    .join('\n')

  return `Business Horoscope: ${businessName}
Website: ${websiteUrl}
Market: ${city} - ${industry}
Tone: ${tone}

1. Business Digital Zodiac archetype
${report.archetype}

2. Overall score
${totalScore}/100

3. Category scores
${categoryScores}

4. 3 strengths
${formatList(report.strengths)}

5. 3 weaknesses
${formatList(report.weaknesses)}

6. Competitor comparison summary
${report.competitorSummary}

7. Biggest missed opportunity
${report.missedOpportunity}

8. 7-day fix plan
${formatList(report.fixPlan)}

9. Outreach-ready summary
${report.outreachSummary}

10. CTA section
${report.cta}

${report.premiumUpsell}`
}

function buildText(form: SnapshotForm, totalScore: number, archetype: Archetype) {
  const businessName = valueOrFallback(form.businessName, 'your business')
  const city = valueOrFallback(form.city, 'your market')
  const message = `Hi, I made a quick Business Horoscope for ${businessName}: ${totalScore}/100, ${archetype}. Biggest opportunity: make the site easier to trust and act on for buyers in ${city}. Want me to send it?`

  return message.length <= 280 ? message : `${message.slice(0, 276).trimEnd()}...`
}

function buildEmail(form: SnapshotForm, totalScore: number, archetype: Archetype) {
  const businessName = valueOrFallback(form.businessName, 'your business')
  const industry = valueOrFallback(form.niche, 'your industry')
  const city = valueOrFallback(form.city, 'your city')

  return `Subject: Quick website Business Horoscope for ${businessName}

Hi ${businessName} team,

I put together a short Business Horoscope for your website. It scored ${totalScore}/100 and landed as ${archetype}.

The useful part: this is focused on practical buyer outcomes, not generic SEO. I looked at whether the site makes ${industry} buyers in ${city} understand the offer, trust the business, compare it to alternatives, and take the next step.

The biggest opportunity is making the service pages, trust proof, and call/request path easier to choose from a phone.

Worth sending over the one-page version?`
}

function buildShareable(form: SnapshotForm, totalScore: number, archetype: Archetype) {
  const businessName = valueOrFallback(form.businessName, 'This business')
  const city = valueOrFallback(form.city, 'its market')
  const industry = valueOrFallback(form.niche, 'its industry')

  return `${businessName} scored ${totalScore}/100 in its Business Horoscope and landed as ${archetype}. The site has real business potential, but the fastest win is making ${industry} buyers in ${city} understand the offer faster, trust it sooner, compare it more easily, and contact the business without second-guessing the next step.`
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
    shareable: buildShareable(form, totalScore, report.archetype),
    upsell: report.premiumUpsell,
  }
}
