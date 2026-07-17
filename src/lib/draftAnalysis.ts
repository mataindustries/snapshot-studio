import type {
  BusinessIntakePayload,
  DraftAnalysisResult,
  DraftConfidence,
  DraftEvidenceCaption,
  DraftScoreSuggestion,
  DraftStrategicAsset,
  ScoreKey,
  Scores,
  WebsiteExtractionResult,
} from '../types'
import { getDigitalZodiac } from '../templates/snapshotTemplates'
import { createStableId } from './evidence'
import { normalizeWebsiteUrl } from './intakeParser'

type ScoreSignal = {
  present: boolean
  weight: number
  supplied: string
  missing: string
}

const scoreKeys: ScoreKey[] = [
  'visibility',
  'trust',
  'conversion',
  'aiSearchReadiness',
  'competitorPosition',
]

function hasValue(value: string) {
  return Boolean(value.trim())
}

function lower(value: string) {
  return value.trim().toLocaleLowerCase()
}

function includesEnteredValue(content: string, value: string) {
  const needle = lower(value)
  return needle.length >= 2 && lower(content).includes(needle)
}

function clampScore(value: number) {
  return Math.min(20, Math.max(0, Math.round(value)))
}

function midpoint(suggestion: DraftScoreSuggestion) {
  return Math.round((suggestion.minimum + suggestion.maximum) / 2)
}

function confidenceFor(observedInputs: number): DraftConfidence {
  if (observedInputs >= 6) return 'High'
  if (observedInputs >= 3) return 'Medium'
  return 'Low'
}

function scoreSuggestion(input: {
  label: string
  signals: ScoreSignal[]
  observedInputs: number
  contextAvailable: boolean
  explanation: string
}): DraftScoreSuggestion {
  const presentSignals = input.signals.filter((signal) => signal.present)
  const missingSignals = input.signals.filter((signal) => !signal.present)
  const confidence = confidenceFor(input.observedInputs)

  if (!input.contextAvailable) {
    return {
      minimum: 5,
      maximum: 15,
      explanation: input.label + ' remains a deliberately wide range because the intake does not contain enough relevant observations. Missing intake data is not treated as a verified weakness.',
      basis: [
        'No directly relevant operator-supplied input was available.',
        ...missingSignals.slice(0, 3).map((signal) => 'Not supplied: ' + signal.missing + '.'),
      ],
      confidence: 'Low',
    }
  }

  const weightedTotal = presentSignals.reduce((total, signal) => total + signal.weight, 0)
  const center = clampScore(3 + weightedTotal)
  const spread = confidence === 'High' ? 2 : confidence === 'Medium' ? 3 : 5
  const minimum = clampScore(center - spread)
  const maximum = Math.max(minimum + 2, clampScore(center + spread))
  const boundedMaximum = Math.min(20, maximum)

  return {
    minimum: Math.min(minimum, boundedMaximum - 2),
    maximum: boundedMaximum,
    explanation: input.explanation + ' The range stays wider when the supplied inputs are sparse or have not been confirmed with evidence.',
    basis: [
      ...presentSignals.slice(0, 5).map((signal) => 'Supplied: ' + signal.supplied + '.'),
      ...missingSignals.slice(0, 3).map((signal) => 'Not supplied: ' + signal.missing + '.'),
    ],
    confidence,
  }
}

function websiteContent(intake: BusinessIntakePayload) {
  return Object.values(intake.website).join('\n')
}

function countWebsiteInputs(intake: BusinessIntakePayload) {
  return Object.values(intake.website).filter(hasValue).length
}

function countPublicProfileInputs(intake: BusinessIntakePayload) {
  return Object.values(intake.publicProfile).filter(hasValue).length
}

function competitorInputCount(intake: BusinessIntakePayload) {
  return intake.competitorContext.competitors.reduce(
    (count, competitor) =>
      count + [competitor.name, competitor.url, competitor.notes].filter(hasValue).length,
    hasValue(intake.competitorContext.comparisonNotes) ? 1 : 0,
  )
}

function createScoreSuggestions(
  intake: BusinessIntakePayload,
  extraction: WebsiteExtractionResult,
): Record<ScoreKey, DraftScoreSuggestion> {
  const identity = intake.identity
  const website = intake.website
  const profile = intake.publicProfile
  const content = websiteContent(intake)
  const websiteInputs = countWebsiteInputs(intake)
  const publicInputs = countPublicProfileInputs(intake)
  const competitorInputs = competitorInputCount(intake)
  const serviceMention = hasValue(identity.primaryService)
    && (
      includesEnteredValue(content, identity.primaryService)
      || extraction.servicePhrases.length > 0
      || hasValue(website.servicesListed)
    )
  const locationMention = hasValue(identity.city)
    && (
      includesEnteredValue(content, identity.city)
      || extraction.locationPhrases.length > 0
      || hasValue(identity.serviceAreas)
    )
  const hasTrustLanguage = hasValue(website.trustReviewCopy)
    || extraction.trustPhrases.length > 0
  const hasContactDetails = [
    identity.phone,
    identity.email,
    identity.contactFormUrl,
    identity.bookingUrl,
    website.footerContactDetails,
  ].some(hasValue) || extraction.contactDetails.length > 0
  const hasCompetitor = intake.competitorContext.competitors.some(
    (competitor) => [competitor.name, competitor.url, competitor.notes].some(hasValue),
  )

  return {
    visibility: scoreSuggestion({
      label: 'Visibility',
      observedInputs: websiteInputs
        + [identity.serviceAreas, profile.categories, profile.hours].filter(hasValue).length,
      contextAvailable: websiteInputs > 0 || hasValue(identity.serviceAreas) || publicInputs > 0,
      explanation: 'This range weighs whether the supplied text connects the primary service to its market and whether service coverage is stated plainly.',
      signals: [
        {
          present: serviceMention,
          weight: 4,
          supplied: 'primary-service language appears in the entered website content',
          missing: 'clear primary-service language in the website intake',
        },
        {
          present: locationMention,
          weight: 4,
          supplied: 'city or service-area language appears in the entered content',
          missing: 'city or service-area language in the website intake',
        },
        {
          present: hasValue(website.homepageTitle),
          weight: 2,
          supplied: 'homepage title',
          missing: 'homepage title',
        },
        {
          present: hasValue(website.servicesListed) || extraction.servicePhrases.length >= 2,
          weight: 3,
          supplied: 'multiple service phrases or a service list',
          missing: 'a clear service list',
        },
        {
          present: hasValue(profile.categories),
          weight: 2,
          supplied: 'public-profile categories',
          missing: 'public-profile categories',
        },
        {
          present: hasValue(profile.hours),
          weight: 1,
          supplied: 'public-profile hours',
          missing: 'public-profile hours',
        },
      ],
    }),
    trust: scoreSuggestion({
      label: 'Trust',
      observedInputs: publicInputs
        + [website.trustReviewCopy, identity.ownerFamilyNote, identity.businessAgeOrFoundingYear]
          .filter(hasValue).length,
      contextAvailable: publicInputs > 0 || hasTrustLanguage || hasValue(identity.ownerFamilyNote),
      explanation: 'This range weighs only the reviews, credentials, ownership, guarantees, and related proof entered by the operator.',
      signals: [
        {
          present: hasValue(profile.googleRating),
          weight: 3,
          supplied: 'Google rating observation',
          missing: 'Google rating observation',
        },
        {
          present: hasValue(profile.reviewCount),
          weight: 3,
          supplied: 'review-count observation',
          missing: 'review-count observation',
        },
        {
          present: hasTrustLanguage,
          weight: 3,
          supplied: 'trust or review copy in the website intake',
          missing: 'trust or review copy',
        },
        {
          present: hasValue(profile.credentials) || hasValue(profile.awards),
          weight: 3,
          supplied: 'credentials or awards',
          missing: 'credentials or awards',
        },
        {
          present: hasValue(profile.guarantees) || hasValue(profile.financing),
          weight: 2,
          supplied: 'guarantee or financing details',
          missing: 'guarantee or financing details',
        },
        {
          present: hasValue(identity.ownerFamilyNote)
            || hasValue(identity.businessAgeOrFoundingYear),
          weight: 2,
          supplied: 'ownership or business-age context',
          missing: 'ownership or business-age context',
        },
      ],
    }),
    conversion: scoreSuggestion({
      label: 'Conversion',
      observedInputs: websiteInputs
        + [
          identity.phone,
          identity.email,
          identity.contactFormUrl,
          identity.bookingUrl,
          profile.emergencyAvailability,
        ].filter(hasValue).length,
      contextAvailable: websiteInputs > 0 || hasContactDetails,
      explanation: 'This range weighs the calls to action and contact routes supplied in the intake; it does not test the live path.',
      signals: [
        {
          present: hasValue(website.primaryCta) || extraction.callsToAction.length > 0,
          weight: 4,
          supplied: 'a primary call to action',
          missing: 'a primary call to action',
        },
        {
          present: hasValue(identity.phone),
          weight: 2,
          supplied: 'phone number',
          missing: 'phone number',
        },
        {
          present: hasValue(identity.contactFormUrl),
          weight: 3,
          supplied: 'contact-form URL',
          missing: 'contact-form URL',
        },
        {
          present: hasValue(identity.bookingUrl),
          weight: 3,
          supplied: 'booking URL',
          missing: 'booking URL',
        },
        {
          present: hasValue(website.footerContactDetails) || extraction.contactDetails.length > 0,
          weight: 2,
          supplied: 'footer or pasted contact details',
          missing: 'footer contact details',
        },
        {
          present: hasValue(website.heroSupportCopy),
          weight: 1,
          supplied: 'hero support copy',
          missing: 'support copy explaining the next step',
        },
        {
          present: hasValue(profile.emergencyAvailability),
          weight: 1,
          supplied: 'availability details',
          missing: 'availability details where relevant',
        },
      ],
    }),
    aiSearchReadiness: scoreSuggestion({
      label: 'AI Search Readiness',
      observedInputs: websiteInputs
        + [identity.serviceAreas, profile.categories].filter(hasValue).length,
      contextAvailable: websiteInputs > 0,
      explanation: 'This range weighs explicit service, location, question-and-answer, and contact information in the supplied text.',
      signals: [
        {
          present: hasValue(website.homepageTitle),
          weight: 2,
          supplied: 'homepage title',
          missing: 'homepage title',
        },
        {
          present: hasValue(website.metaDescription),
          weight: 2,
          supplied: 'meta description',
          missing: 'meta description',
        },
        {
          present: serviceMention,
          weight: 3,
          supplied: 'explicit service language',
          missing: 'explicit service language',
        },
        {
          present: locationMention,
          weight: 3,
          supplied: 'explicit city or service-area language',
          missing: 'explicit city or service-area language',
        },
        {
          present: hasValue(website.faqText) || extraction.questionHeadings.length > 0,
          weight: 3,
          supplied: 'FAQ text or question headings',
          missing: 'FAQ text or direct question headings',
        },
        {
          present: hasValue(website.aboutTeamCopy),
          weight: 2,
          supplied: 'about or team copy',
          missing: 'about or team context',
        },
        {
          present: hasContactDetails,
          weight: 2,
          supplied: 'explicit contact details',
          missing: 'explicit contact details',
        },
      ],
    }),
    competitorPosition: scoreSuggestion({
      label: 'Competitor Position',
      observedInputs: competitorInputs
        + [identity.differentiators, website.heroHeadline].filter(hasValue).length,
      contextAvailable: competitorInputs > 0 || hasValue(identity.differentiators),
      explanation: 'This range weighs the entered differentiators and manual competitor notes; it does not compare live competitor sites.',
      signals: [
        {
          present: hasCompetitor,
          weight: 3,
          supplied: 'at least one named or linked competitor',
          missing: 'a named or linked competitor',
        },
        {
          present: intake.competitorContext.competitors.some(
            (competitor) => hasValue(competitor.notes),
          ),
          weight: 4,
          supplied: 'competitor-specific notes',
          missing: 'competitor-specific notes',
        },
        {
          present: hasValue(intake.competitorContext.comparisonNotes),
          weight: 4,
          supplied: 'overall comparison notes',
          missing: 'overall comparison notes',
        },
        {
          present: hasValue(identity.differentiators),
          weight: 4,
          supplied: 'business differentiators',
          missing: 'supportable business differentiators',
        },
        {
          present: hasValue(website.heroHeadline),
          weight: 1,
          supplied: 'hero positioning language',
          missing: 'hero positioning language',
        },
      ],
    }),
  }
}

function getLowestSuggestedScore(scoreSuggestions: Record<ScoreKey, DraftScoreSuggestion>) {
  return scoreKeys.reduce((lowest, key) =>
    midpoint(scoreSuggestions[key]) < midpoint(scoreSuggestions[lowest]) ? key : lowest,
  'visibility')
}

function recommendationFor(key: ScoreKey, intake: BusinessIntakePayload) {
  const service = intake.identity.primaryService.trim()
    || intake.identity.niche.trim()
    || 'primary service'
  const city = intake.identity.city.trim() || 'the service area'
  const recommendations: Record<ScoreKey, { missed: string; primary: string }> = {
    visibility: {
      missed: 'The supplied content does not yet make the connection between ' + service + ' and ' + city + ' consistently clear.',
      primary: 'Make ' + service + ', ' + city + ', and the most important service-area language explicit in the homepage title, hero, and service navigation.',
    },
    trust: {
      missed: 'The intake contains limited decision-stage proof, or the supplied proof is not clearly connected to the primary call to action.',
      primary: 'Place the strongest supplied review, credential, guarantee, or customer-outcome proof beside the primary contact decision.',
    },
    conversion: {
      missed: 'The supplied calls to action and contact details do not yet explain one consistent, low-friction next step.',
      primary: 'Standardize one contact promise across the hero, phone, form, booking path, and footer, including what happens after the inquiry.',
    },
    aiSearchReadiness: {
      missed: 'The supplied material leaves service, location, proof, or common-question facts too implicit for reliable summaries.',
      primary: 'Publish short, direct answers that name ' + service + ', ' + city + ', service areas, proof, and common pre-contact questions.',
    },
    competitorPosition: {
      missed: 'The intake does not yet establish a supportable reason to choose this business over the competitors entered for comparison.',
      primary: 'Turn the strongest differentiator into a specific headline, supporting proof point, and comparison-ready service promise.',
    },
  }
  return recommendations[key]
}

function buildStrengthNotes(
  intake: BusinessIntakePayload,
  extraction: WebsiteExtractionResult,
) {
  const notes: string[] = []
  const identity = intake.identity
  const profile = intake.publicProfile

  if (hasValue(profile.googleRating) || hasValue(profile.reviewCount)) {
    const rating = profile.googleRating.trim()
    const count = profile.reviewCount.trim()
    const detail = [
      rating ? rating + ' rating' : '',
      count ? count + ' reviews' : '',
    ].filter(Boolean).join(' and ')
    notes.push('The manually entered public-profile details include ' + detail + '; confirm the current figures before presenting them as evidence.')
  }
  if (extraction.trustPhrases.length > 0 || hasValue(intake.website.trustReviewCopy)) {
    notes.push('The operator-supplied website text includes trust or review language that can be reviewed for stronger placement near the next step.')
  }
  if (
    hasValue(profile.credentials)
    || hasValue(profile.awards)
    || hasValue(profile.guarantees)
  ) {
    notes.push('The public-profile intake records credentials, awards, or guarantees that may provide supportable proof after operator review.')
  }
  if (
    hasValue(intake.website.primaryCta)
    || extraction.callsToAction.length > 0
    || hasValue(identity.contactFormUrl)
    || hasValue(identity.bookingUrl)
  ) {
    notes.push('The supplied information includes a customer next step or contact route that can be clarified and standardized.')
  }
  if (hasValue(identity.differentiators)) {
    notes.push('A differentiator was entered for review: ' + identity.differentiators.trim())
  }
  if (notes.length === 0 && hasValue(identity.primaryService)) {
    notes.push('The intake identifies ' + identity.primaryService.trim() + ' as the primary service, providing a concrete subject for the assessment.')
  }
  return notes.slice(0, 3)
}

function buildStrategicAssets(
  intake: BusinessIntakePayload,
  extraction: WebsiteExtractionResult,
): DraftStrategicAsset[] {
  const identity = intake.identity
  const profile = intake.publicProfile
  const assets: DraftStrategicAsset[] = []
  const add = (title: string, basis: string) => {
    if (!title.trim() || assets.some((asset) => lower(asset.title) === lower(title))) return
    assets.push({ title, basis })
  }

  if (hasValue(identity.primaryService)) {
    add(identity.primaryService.trim() + ' focus', 'The operator identified this as the primary service.')
  }
  if (hasValue(identity.city) || hasValue(identity.serviceAreas)) {
    add(
      (identity.city.trim() || 'Local') + ' market relevance',
      'The intake supplies ' + (identity.serviceAreas.trim() || identity.city.trim()) + ' as location context.',
    )
  }
  if (hasValue(profile.googleRating) || hasValue(profile.reviewCount)) {
    add(
      'Recorded review foundation',
      'The operator entered rating or review-count information; current figures still require confirmation.',
    )
  }
  if (hasValue(profile.credentials) || hasValue(profile.awards)) {
    add(
      'Credentials and recognition',
      'Credentials or awards were entered in the public-profile observations.',
    )
  }
  if (extraction.trustPhrases.length > 0 || hasValue(intake.website.trustReviewCopy)) {
    add(
      'Trust language to build on',
      'The operator-supplied website text contains trust or review phrases.',
    )
  }
  if (hasValue(identity.differentiators)) {
    add(
      'Supportable point of difference',
      'The intake records this differentiator: ' + identity.differentiators.trim(),
    )
  }
  if (hasValue(intake.website.primaryCta) || extraction.callsToAction.length > 0) {
    add(
      'Existing next-step language',
      'The supplied website content includes at least one call to action.',
    )
  }

  const fallbacks: DraftStrategicAsset[] = [
    {
      title: 'Service clarity foundation',
      basis: 'The business identity intake supplies a niche or service context to refine.',
    },
    {
      title: 'Local relevance foundation',
      basis: 'The business identity intake supplies a city or service-market context to refine.',
    },
    {
      title: 'Evidence-building opportunity',
      basis: 'The Evidence Manager can turn reviewed observations into screenshot-backed proof.',
    },
  ]
  fallbacks.forEach((asset) => add(asset.title, asset.basis))
  return assets.slice(0, 3)
}

function buildEvidenceCaptions(
  extraction: WebsiteExtractionResult,
): DraftEvidenceCaption[] {
  const priority = ['Trust phrase', 'Call to action', 'Location phrase', 'Service phrase']
  const sorted = [...extraction.observations].sort((left, right) => {
    const leftIndex = priority.indexOf(left.kind)
    const rightIndex = priority.indexOf(right.kind)
    return (leftIndex < 0 ? priority.length : leftIndex)
      - (rightIndex < 0 ? priority.length : rightIndex)
  })

  return sorted.slice(0, 3).map((observation) => ({
    observationId: observation.id,
    caption: 'Operator-supplied ' + observation.kind.toLocaleLowerCase()
      + ' for review: “' + observation.text + '”',
    basis: 'Extracted locally from pasted page text. Confirm it against the public page before using it as evidence.',
  }))
}
function suggestionScores(
  suggestions: Record<ScoreKey, DraftScoreSuggestion>,
  edge: 'minimum' | 'maximum' | 'midpoint',
): Scores {
  return scoreKeys.reduce((scores, key) => {
    const suggestion = suggestions[key]
    scores[key] = edge === 'midpoint' ? midpoint(suggestion) : suggestion[edge]
    return scores
  }, {
    visibility: 10,
    trust: 10,
    conversion: 10,
    aiSearchReadiness: 10,
    competitorPosition: 10,
  })
}

function buildHoroscopeCandidates(
  suggestions: Record<ScoreKey, DraftScoreSuggestion>,
) {
  const scenarios: Array<{ label: string; scores: Scores }> = [
    { label: 'suggested midpoint ranges', scores: suggestionScores(suggestions, 'midpoint') },
    { label: 'lower edge of the suggested ranges', scores: suggestionScores(suggestions, 'minimum') },
    { label: 'upper edge of the suggested ranges', scores: suggestionScores(suggestions, 'maximum') },
  ]
  const seen = new Set<string>()

  return scenarios.flatMap(({ label, scores }) => {
    const name = getDigitalZodiac(
      scores,
      Object.values(scores).reduce((total, score) => total + score, 0),
    )
    if (seen.has(name)) return []
    seen.add(name)
    return [{
      name,
      basis: 'Candidate produced by the ' + label
        + ". The final Horoscope follows the operator's final scores.",
    }]
  }).slice(0, 3)
}

function buildMissingInformation(
  intake: BusinessIntakePayload,
  extraction: WebsiteExtractionResult,
) {
  const missing: string[] = []
  if (!hasValue(intake.website.pageText)) {
    missing.push('No large page-text paste was supplied; structured fields are carrying the website analysis.')
  }
  if (countPublicProfileInputs(intake) === 0) {
    missing.push('No public-profile observations were entered.')
  }
  if (competitorInputCount(intake) === 0) {
    missing.push('No competitor observations were entered, so competitor positioning remains uncertain.')
  }
  if (extraction.observations.length === 0) {
    missing.push('The local parser found no reviewable observations in pasted page text.')
  }
  if (!extraction.observations.some(
    (observation) => Boolean(intake.observationEvidenceLinks[observation.id]),
  )) {
    missing.push('No current extracted observation has been connected to Evidence Manager proof.')
  }
  if (
    !hasValue(intake.identity.phone)
    && !hasValue(intake.identity.email)
    && !hasValue(intake.identity.contactFormUrl)
    && !hasValue(intake.identity.bookingUrl)
  ) {
    missing.push('No phone, email, contact-form URL, or booking URL was supplied.')
  }
  return missing
}

export function getDraftInputSignature(
  intake: BusinessIntakePayload,
  extraction: WebsiteExtractionResult,
) {
  const source = JSON.stringify({
    identity: intake.identity,
    website: intake.website,
    publicProfile: intake.publicProfile,
    competitorContext: intake.competitorContext,
    classifications: intake.observationClassifications,
    extraction: extraction.observations.map(({ id, kind, text }) => ({ id, kind, text })),
  })
  return createStableId('intake-basis', [source])
}

export function isDraftCurrent(
  intake: BusinessIntakePayload,
  extraction: WebsiteExtractionResult,
) {
  return Boolean(
    intake.draft
    && intake.draft.inputSignature === getDraftInputSignature(intake, extraction),
  )
}

export function createDeterministicDraft(
  intake: BusinessIntakePayload,
  extraction: WebsiteExtractionResult,
): DraftAnalysisResult {
  const scoreSuggestions = createScoreSuggestions(intake, extraction)
  const lowestScore = getLowestSuggestedScore(scoreSuggestions)
  const recommendation = recommendationFor(lowestScore, intake)
  const confidenceValues = Object.values(scoreSuggestions).map(
    (suggestion) => suggestion.confidence,
  )
  const highConfidenceCount = confidenceValues.filter((value) => value === 'High').length
  const lowConfidenceCount = confidenceValues.filter((value) => value === 'Low').length
  const confidence: DraftConfidence = highConfidenceCount >= 3
    ? 'High'
    : lowConfidenceCount >= 3
      ? 'Low'
      : 'Medium'
  const missingInformation = buildMissingInformation(intake, extraction)
  const service = intake.identity.primaryService.trim()
    || extraction.servicePhrases[0]
    || intake.identity.niche.trim()
    || 'primary service'
  const city = intake.identity.city.trim() || 'the local market'
  const warnings = [
    'Draft only: this deterministic assistant used operator-supplied fields and pasted text. It did not visit or verify a website or public profile.',
  ]
  if (missingInformation.length > 0) {
    warnings.push('Missing information widens score ranges and may change the recommended opportunity after review.')
  }
  if (
    hasValue(intake.identity.websiteUrlRaw)
    && !normalizeWebsiteUrl(intake.identity.websiteUrlRaw).valid
  ) {
    warnings.push('The website URL could not be normalized and should be reviewed before it is applied.')
  }

  return {
    engine: 'deterministic-v1',
    generatedAt: new Date().toISOString(),
    inputSignature: getDraftInputSignature(intake, extraction),
    disclosure: 'Editable deterministic draft — based only on supplied inputs; no website or profile was visited or verified.',
    suggestedStrengthNotes: buildStrengthNotes(intake, extraction),
    suggestedMissedOpportunity: recommendation.missed,
    scoreSuggestions,
    suggestedBusinessHoroscopeCandidates: buildHoroscopeCandidates(scoreSuggestions),
    suggestedPrimaryOpportunity: recommendation.primary,
    suggestedRecommendationSubject: service,
    suggestedStrategicAssets: buildStrategicAssets(intake, extraction),
    suggestedEvidenceCaptions: buildEvidenceCaptions(extraction),
    suggestedOutreachAngle: 'Lead with a useful ' + service + ' clarity observation for '
      + city
      + ', explain that it came from an operator-supplied review draft, and offer the three highest-priority fixes after the details are confirmed.',
    confidence,
    warnings,
    missingInformation,
  }
}

export function getSuggestionMidpoint(suggestion: DraftScoreSuggestion) {
  return midpoint(suggestion)
}
