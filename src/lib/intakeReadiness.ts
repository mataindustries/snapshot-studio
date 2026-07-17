import type { BusinessIntakePayload, WebsiteExtractionResult } from '../types'

export type IntakeStepId =
  | 'identity'
  | 'website'
  | 'public-profile'
  | 'competitors'
  | 'evidence'
  | 'draft'
  | 'review'

export type IntakeStepReadiness = {
  id: IntakeStepId
  number: number
  title: string
  required: boolean
  complete: boolean
  missing: string[]
  requirement: string
}

export type IntakeReadinessResult = {
  steps: IntakeStepReadiness[]
  requiredComplete: number
  requiredTotal: number
  missingRequired: string[]
  draftReady: boolean
  completedSteps: number
}

export const intakeStepTitles = [
  'Business Identity',
  'Website Intake',
  'Public Profile',
  'Competitor Context',
  'Evidence',
  'Draft Analysis',
  'Review and Apply',
] as const

function hasValue(value: string) {
  return Boolean(value.trim())
}

function countValues(record: Record<string, string>) {
  return Object.values(record).filter(hasValue).length
}

export function getIntakeReadiness(
  intake: BusinessIntakePayload,
  extraction: WebsiteExtractionResult,
  evidenceCount = 0,
): IntakeReadinessResult {
  const identityMissing: string[] = []
  if (!hasValue(intake.identity.businessName)) identityMissing.push('business name')
  if (!hasValue(intake.identity.websiteUrlRaw)) identityMissing.push('website URL')
  if (!hasValue(intake.identity.city)) identityMissing.push('city')
  if (!hasValue(intake.identity.primaryService)) identityMissing.push('primary service')

  const structuredWebsiteFields = countValues({
    homepageTitle: intake.website.homepageTitle,
    metaDescription: intake.website.metaDescription,
    heroHeadline: intake.website.heroHeadline,
    heroSupportCopy: intake.website.heroSupportCopy,
    primaryCta: intake.website.primaryCta,
    homepageBodyText: intake.website.homepageBodyText,
    servicesListed: intake.website.servicesListed,
    trustReviewCopy: intake.website.trustReviewCopy,
    faqText: intake.website.faqText,
    aboutTeamCopy: intake.website.aboutTeamCopy,
    footerContactDetails: intake.website.footerContactDetails,
  })
  const websiteComplete = hasValue(intake.website.pageText)
    || extraction.observations.length > 0
    || structuredWebsiteFields >= 2
  const websiteMissing = websiteComplete
    ? []
    : ['pasted page text or at least two structured website fields']
  const publicProfileComplete = countValues(intake.publicProfile) > 0
  const competitorComplete = intake.competitorContext.competitors.some(
    (competitor) => hasValue(competitor.name) || hasValue(competitor.url) || hasValue(competitor.notes),
  ) || hasValue(intake.competitorContext.comparisonNotes)
  const evidenceComplete = evidenceCount > 0
  const draftComplete = Boolean(intake.draft)

  const steps: IntakeStepReadiness[] = [
    {
      id: 'identity',
      number: 1,
      title: intakeStepTitles[0],
      required: true,
      complete: identityMissing.length === 0,
      missing: identityMissing,
      requirement: 'Business name, website URL, city, and primary service.',
    },
    {
      id: 'website',
      number: 2,
      title: intakeStepTitles[1],
      required: true,
      complete: websiteComplete,
      missing: websiteMissing,
      requirement: 'Paste page text or complete at least two structured website fields.',
    },
    {
      id: 'public-profile',
      number: 3,
      title: intakeStepTitles[2],
      required: false,
      complete: publicProfileComplete || intake.currentStep > 3,
      missing: [],
      requirement: 'Optional manual public-profile observations.',
    },
    {
      id: 'competitors',
      number: 4,
      title: intakeStepTitles[3],
      required: false,
      complete: competitorComplete || intake.currentStep > 4,
      missing: [],
      requirement: 'Optional competitor URLs and comparison notes.',
    },
    {
      id: 'evidence',
      number: 5,
      title: intakeStepTitles[4],
      required: false,
      complete: evidenceComplete || intake.currentStep > 5,
      missing: [],
      requirement: 'Optional screenshot-backed observations in the Evidence Manager.',
    },
    {
      id: 'draft',
      number: 6,
      title: intakeStepTitles[5],
      required: false,
      complete: draftComplete,
      missing: [],
      requirement: 'Generate and review the deterministic draft.',
    },
    {
      id: 'review',
      number: 7,
      title: intakeStepTitles[6],
      required: false,
      complete: Boolean(intake.appliedAt),
      missing: [],
      requirement: 'Apply, edit, or reject draft suggestions.',
    },
  ]
  const missingRequired = [...identityMissing, ...websiteMissing]
  const requiredSteps = steps.filter((step) => step.required)
  return {
    steps,
    requiredComplete: requiredSteps.filter((step) => step.complete).length,
    requiredTotal: requiredSteps.length,
    missingRequired,
    draftReady: missingRequired.length === 0,
    completedSteps: steps.filter((step) => step.complete).length,
  }
}

export function clampIntakeStep(value: number) {
  if (!Number.isFinite(value)) return 1
  return Math.min(intakeStepTitles.length, Math.max(1, Math.round(value)))
}
