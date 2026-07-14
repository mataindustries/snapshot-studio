import type { EvidenceItem, EvidenceType, RecommendedAction } from '../types'

export const evidenceTypes: readonly EvidenceType[] = [
  'Website',
  'Google Business Profile',
  'Social Profile',
  'Search Result',
  'Competitor',
  'Review Platform',
  'Conversion Path',
  'Other',
] as const

export const maximumScreenshotFileBytes = 12 * 1024 * 1024
export const maximumStoredScreenshotLength = 1_800_000
export const screenshotLongestEdge = 1500

const acceptedImageTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])
const safeImageDataUrl = /^data:image\/(?:png|jpeg|webp);base64,/i

export type EvidenceLinkValidation = {
  danglingActionIds: string[]
  danglingEvidenceIds: string[]
}

export type OptimizedScreenshot = {
  dataUrl: string
  fileName: string
  width: number
  height: number
  mimeType: 'image/png' | 'image/jpeg'
  originalBytes: number
  optimizedBytes: number
}

export class EvidenceImageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EvidenceImageError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0)))
    : []
}

export function createStableId(prefix: string, values: Array<string | number>) {
  const source = values.join('|')
  let hash = 2166136261

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return `${prefix}-${(hash >>> 0).toString(36)}`
}

export function normalizeEvidenceType(value: unknown): EvidenceType {
  if (typeof value !== 'string') return 'Website'
  if (evidenceTypes.includes(value as EvidenceType)) return value as EvidenceType

  const legacyTypes: Record<string, EvidenceType> = {
    'Google Profile': 'Google Business Profile',
    Social: 'Social Profile',
    'Search result': 'Search Result',
  }

  return legacyTypes[value] ?? 'Other'
}

export function isSafeScreenshotDataUrl(value: unknown): value is string {
  if (
    typeof value !== 'string'
    || value.length > maximumStoredScreenshotLength
    || !safeImageDataUrl.test(value)
  ) {
    return false
  }

  const payload = value.slice(value.indexOf(',') + 1)
  return payload.length > 0
    && payload.length % 4 === 0
    && /^[A-Za-z0-9+/]+={0,2}$/.test(payload)
}

export function normalizeEvidenceItem(value: unknown, index = 0): EvidenceItem | null {
  if (!isRecord(value)) return null

  const title = stringValue(value.title)
  const observation = stringValue(value.observation)
  const sourceUrl = stringValue(value.sourceUrl)
  const createdAt = stringValue(value.createdAt, new Date(0).toISOString())
  const id = stringValue(
    value.id,
    createStableId('evidence', [title, observation, sourceUrl, index]),
  )
  const screenshotDataUrl = isSafeScreenshotDataUrl(value.screenshotDataUrl)
    ? value.screenshotDataUrl
    : undefined

  return {
    ...value,
    id,
    title,
    evidenceType: normalizeEvidenceType(value.evidenceType),
    sourceUrl,
    pageLabel: stringValue(value.pageLabel),
    observation,
    whyItMatters: stringValue(value.whyItMatters),
    recommendedChange: stringValue(value.recommendedChange),
    expectedOutcome: stringValue(value.expectedOutcome),
    screenshotDataUrl,
    screenshotFileName: screenshotDataUrl ? optionalString(value.screenshotFileName) : undefined,
    screenshotAltText: screenshotDataUrl ? optionalString(value.screenshotAltText) : undefined,
    beforeCaption: optionalString(value.beforeCaption),
    proposedAfterCaption: optionalString(value.proposedAfterCaption),
    annotationLabel: optionalString(value.annotationLabel),
    linkedActionIds: stringArray(value.linkedActionIds),
    createdAt,
    updatedAt: stringValue(value.updatedAt, createdAt),
    screenshotPlaceholder: optionalString(value.screenshotPlaceholder),
  }
}

export function createEvidenceItem(): EvidenceItem {
  const now = new Date().toISOString()

  return {
    id: crypto.randomUUID(),
    title: '',
    evidenceType: 'Website',
    sourceUrl: '',
    pageLabel: '',
    observation: '',
    whyItMatters: '',
    recommendedChange: '',
    expectedOutcome: '',
    linkedActionIds: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function isEvidenceReportReady(item: EvidenceItem) {
  return Boolean(
    item.title.trim()
    && item.observation.trim()
    && item.whyItMatters.trim()
    && item.recommendedChange.trim(),
  )
}

export function getEvidenceForAction(actionId: string, evidenceItems: EvidenceItem[]) {
  return evidenceItems.filter((item) => item.linkedActionIds.includes(actionId))
}

export function getActionsForEvidence(item: EvidenceItem, actions: RecommendedAction[]) {
  const linkedIds = new Set(item.linkedActionIds)
  return actions.filter((action) => linkedIds.has(action.id))
}

export function validateEvidenceLinks(
  evidenceItems: EvidenceItem[],
  actions: RecommendedAction[],
): EvidenceLinkValidation {
  const actionIds = new Set(actions.map((action) => action.id))
  const evidenceIds = new Set(evidenceItems.map((item) => item.id))

  return {
    danglingActionIds: Array.from(new Set(
      evidenceItems.flatMap((item) =>
        item.linkedActionIds.filter((actionId) => !actionIds.has(actionId)),
      ),
    )),
    danglingEvidenceIds: Array.from(new Set(
      actions.flatMap((action) =>
        action.linkedEvidenceIds.filter((evidenceId) => !evidenceIds.has(evidenceId)),
      ),
    )),
  }
}

export function removeDanglingEvidenceLinks(
  evidenceItems: EvidenceItem[],
  actions: RecommendedAction[],
) {
  const actionIds = new Set(actions.map((action) => action.id))
  const evidenceIds = new Set(evidenceItems.map((item) => item.id))

  return {
    evidenceItems: evidenceItems.map((item) => ({
      ...item,
      linkedActionIds: item.linkedActionIds.filter((actionId) => actionIds.has(actionId)),
    })),
    actions: actions.map((action) => ({
      ...action,
      linkedEvidenceIds: action.linkedEvidenceIds.filter((evidenceId) => evidenceIds.has(evidenceId)),
    })),
  }
}

export function synchronizeEvidenceLinks(
  evidenceItems: EvidenceItem[],
  actions: RecommendedAction[],
) {
  const cleaned = removeDanglingEvidenceLinks(evidenceItems, actions)
  const evidenceLinks = new Map(
    cleaned.evidenceItems.map((item) => [item.id, new Set(item.linkedActionIds)]),
  )
  const actionLinks = new Map(
    cleaned.actions.map((action) => [action.id, new Set(action.linkedEvidenceIds)]),
  )

  cleaned.evidenceItems.forEach((item) => {
    item.linkedActionIds.forEach((actionId) => actionLinks.get(actionId)?.add(item.id))
  })
  cleaned.actions.forEach((action) => {
    action.linkedEvidenceIds.forEach((evidenceId) => evidenceLinks.get(evidenceId)?.add(action.id))
  })

  return {
    evidenceItems: cleaned.evidenceItems.map((item) => ({
      ...item,
      linkedActionIds: Array.from(evidenceLinks.get(item.id) ?? []),
    })),
    actions: cleaned.actions.map((action) => ({
      ...action,
      linkedEvidenceIds: Array.from(actionLinks.get(action.id) ?? []),
    })),
  }
}

export function setEvidenceActionLink(
  evidenceItems: EvidenceItem[],
  actions: RecommendedAction[],
  evidenceId: string,
  actionId: string,
  linked: boolean,
) {
  const updatedAt = new Date().toISOString()
  const nextEvidence = evidenceItems.map((item) => {
    if (item.id !== evidenceId) return item
    const links = new Set(item.linkedActionIds)
    if (linked) links.add(actionId)
    else links.delete(actionId)
    return { ...item, linkedActionIds: Array.from(links), updatedAt }
  })
  const nextActions = actions.map((action) => {
    if (action.id !== actionId) return action
    const links = new Set(action.linkedEvidenceIds)
    if (linked) links.add(evidenceId)
    else links.delete(evidenceId)
    return { ...action, linkedEvidenceIds: Array.from(links) }
  })

  return removeDanglingEvidenceLinks(nextEvidence, nextActions)
}

export function removeEvidenceAndLinks(
  evidenceItems: EvidenceItem[],
  actions: RecommendedAction[],
  evidenceId: string,
) {
  return removeDanglingEvidenceLinks(
    evidenceItems.filter((item) => item.id !== evidenceId),
    actions,
  )
}

export function removeActionAndLinks(
  evidenceItems: EvidenceItem[],
  actions: RecommendedAction[],
  actionId: string,
) {
  return removeDanglingEvidenceLinks(
    evidenceItems,
    actions.filter((action) => action.id !== actionId),
  )
}

export function getReportEvidence(items: EvidenceItem[], includeIncomplete: boolean) {
  return includeIncomplete ? items : items.filter(isEvidenceReportReady)
}

export function getEvidenceSummary(items: EvidenceItem[], actions: RecommendedAction[]) {
  const categories = Array.from(new Set(items.map((item) => item.evidenceType)))
  const supportedActionCount = actions.filter(
    (action) => getEvidenceForAction(action.id, items).length > 0,
  ).length

  return {
    itemCount: items.length,
    screenshotCount: items.filter((item) => Boolean(item.screenshotDataUrl)).length,
    supportedActionCount,
    categories,
  }
}

export function formatEvidenceReportText(
  items: EvidenceItem[],
  actions: RecommendedAction[],
) {
  if (items.length === 0) return ''

  const summary = getEvidenceSummary(items, actions)
  const categoryText = summary.categories.length > 0
    ? summary.categories.join(', ')
    : 'public-facing sources'
  const evidenceText = items.map((item, index) => {
    const linkedActions = getActionsForEvidence(item, actions)
    const source = [item.pageLabel, item.sourceUrl].filter(Boolean).join(' — ') || 'Not specified'
    const expectedOutcome = item.expectedOutcome.trim() || 'Not specified'
    const supports = linkedActions.map((action) => action.title).filter(Boolean).join('; ')
      || 'No recommendation linked'

    return `Evidence ${index + 1} — ${item.title || 'Untitled evidence'}
Source: ${source}
Observed: ${item.observation}
Why it matters: ${item.whyItMatters}
Recommended move: ${item.recommendedChange}
Expected outcome: ${expectedOutcome}
Supports: ${supports}`
  }).join('\n\n')

  return `Evidence Behind the Recommendations

Quick public-facing review: ${summary.itemCount} evidence item${summary.itemCount === 1 ? '' : 's'} sampled across ${categoryText}.
Screenshots included: ${summary.screenshotCount}
Recommendations supported by evidence: ${summary.supportedActionCount}

${evidenceText}`
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new EvidenceImageError('Image could not be processed. Try a different file.'))
    }
    image.src = objectUrl
  })
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: 'image/png' | 'image/jpeg',
  quality?: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new EvidenceImageError('Image could not be processed. Try a different file.'))
      },
      type,
      quality,
    )
  })
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(
      new EvidenceImageError('Image could not be processed. Try a different file.'),
    )
    reader.readAsDataURL(blob)
  })
}

function canvasHasTransparency(context: CanvasRenderingContext2D, width: number, height: number) {
  const pixels = context.getImageData(0, 0, width, height).data
  const sampleStep = Math.max(4, Math.floor(pixels.length / 120000 / 4) * 4)

  for (let index = 3; index < pixels.length; index += sampleStep) {
    if (pixels[index] < 250) return true
  }

  return false
}

/**
 * Browser-local screenshot strategy: decode once, cap the longest edge at 1500px,
 * retain PNG only when sampled transparency is present, and otherwise store a
 * report-quality JPEG. Only the optimized Data URL is returned to application state.
 */
export async function optimizeScreenshot(file: File): Promise<OptimizedScreenshot> {
  if (!acceptedImageTypes.has(file.type)) {
    throw new EvidenceImageError('Image unsupported. Choose a PNG, JPEG, or WebP file.')
  }
  if (file.size > maximumScreenshotFileBytes) {
    throw new EvidenceImageError('Image is too large. Choose a file smaller than 12 MB.')
  }

  try {
    const image = await loadImage(file)
    if (!image.naturalWidth || !image.naturalHeight) {
      throw new EvidenceImageError('Image could not be processed. Try a different file.')
    }

    const scale = Math.min(1, screenshotLongestEdge / Math.max(image.naturalWidth, image.naturalHeight))
    const width = Math.max(1, Math.round(image.naturalWidth * scale))
    const height = Math.max(1, Math.round(image.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { alpha: true })
    if (!context) {
      throw new EvidenceImageError('Image could not be processed in this browser.')
    }

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, width, height)

    const preserveTransparency = canvasHasTransparency(context, width, height)
    const mimeType = preserveTransparency ? 'image/png' : 'image/jpeg'
    let blob = await canvasToBlob(canvas, mimeType, preserveTransparency ? undefined : 0.84)

    if (!preserveTransparency && blob.size > 1_250_000) {
      blob = await canvasToBlob(canvas, 'image/jpeg', 0.72)
    }

    const dataUrl = await blobToDataUrl(blob)
    if (dataUrl.length > maximumStoredScreenshotLength) {
      throw new EvidenceImageError(
        'The optimized image is still too large for browser storage. Try a smaller screenshot.',
      )
    }

    return {
      dataUrl,
      fileName: file.name,
      width,
      height,
      mimeType,
      originalBytes: file.size,
      optimizedBytes: blob.size,
    }
  } catch (error) {
    if (error instanceof EvidenceImageError) throw error
    throw new EvidenceImageError('Image could not be processed. Try a different file.')
  }
}
