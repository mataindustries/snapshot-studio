import { execFile, spawn, type ChildProcess } from 'node:child_process'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { PDFDocument } from 'pdf-lib'
import { chromium, type Browser, type Page } from 'playwright'
import { sampleManualFixtures, type SampleManualFixture } from './fixtures.ts'

const execFileAsync = promisify(execFile)
const rootDirectory = resolve(import.meta.dirname, '../..')
const artifactDirectory = join(rootDirectory, 'artifacts/sample-manuals')
const previewDirectory = join(artifactDirectory, 'previews')
const snapshotStorageKey = 'snapshot-studio:snapshots'
const tourDismissalKey = 'snapshot-studio:contest-tour-dismissed:v1'
const requiredPageCount = 10

type GenerationResult = {
  business: string
  category: string
  archetype: string
  score: number
  missionCount: number
  evidenceCount: number
  pdfFilename: string
  pageCount: number
  status: 'success' | 'failure'
  errors: string[]
}

const forbiddenPdfPatterns = [
  /harbor\s*&\s*pine/i,
  /\briverton\b/i,
  /\blocalhost\b/i,
  /\b127\.0\.0\.1\b/i,
  /\bexample\.(?:com|org|net)\b/i,
  /(?:^|\s)github\.com/i,
  /mataindustries/i,
  /\bfictional\b/i,
  /\bplaceholder\b/i,
] as const

function cleanFilename(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLocaleLowerCase()
}

function scoreTotal(fixture: SampleManualFixture) {
  return Object.values(fixture.scores).reduce((total, score) => total + score, 0)
}

async function findOpenPort() {
  return await new Promise<number>((resolvePort, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close()
        reject(new Error('Could not reserve a local preview port.'))
        return
      }
      const port = address.port
      server.close((error) => error ? reject(error) : resolvePort(port))
    })
  })
}

async function waitForServer(url: string, process: ChildProcess) {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    if (process.exitCode !== null) {
      throw new Error(`Preview server exited with code ${process.exitCode}.`)
    }
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // The preview server may still be binding its port.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 200))
  }
  throw new Error(`Preview server did not become ready at ${url}.`)
}

function startPreviewServer(port: number) {
  const child = spawn(
    process.execPath,
    [join(rootDirectory, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    {
      cwd: rootDirectory,
      env: {
        ...process.env,
        VITE_UPGRADEOS_CONTACT_EMAIL: '',
        VITE_UPGRADEOS_CONSULTATION_URL: '',
        VITE_UPGRADEOS_BRAND_URL: '',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
  child.stdout?.on('data', (chunk: Buffer) => process.stdout.write(chunk))
  child.stderr?.on('data', (chunk: Buffer) => process.stderr.write(chunk))
  return child
}

async function stopPreviewServer(process: ChildProcess) {
  if (process.exitCode !== null) return
  process.kill('SIGTERM')
  await new Promise<void>((resolveWait) => {
    const timeout = setTimeout(resolveWait, 3_000)
    process.once('exit', () => {
      clearTimeout(timeout)
      resolveWait()
    })
  })
}

async function seedSnapshot(page: Page, fixture: SampleManualFixture, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.evaluate(
    ({ key, snapshot, dismissalKey }) => {
      localStorage.clear()
      localStorage.setItem(key, JSON.stringify([snapshot]))
      localStorage.setItem(dismissalKey, 'true')
    },
    {
      key: snapshotStorageKey,
      snapshot: fixture.snapshot,
      dismissalKey: tourDismissalKey,
    },
  )
  await page.reload({ waitUntil: 'networkidle' })

  const savedButton = page.locator('.saved-item button').filter({
    hasText: fixture.snapshot.businessName,
  })
  await savedButton.waitFor({ state: 'visible' })
  await savedButton.click()

  await page.waitForFunction(
    (businessName) => document.querySelector('.share-card-business strong')
      ?.textContent?.includes(businessName),
    fixture.snapshot.businessName,
  )
  await page.locator('.report-shell').waitFor({ state: 'visible' })
  await page.evaluate(async () => {
    await document.fonts.ready
    const images = Array.from(document.querySelectorAll<HTMLImageElement>('.report-shell img'))
    await Promise.all(images.map((image) => {
      if (image.complete && image.naturalWidth > 0) return Promise.resolve()
      return new Promise<void>((resolveImage, rejectImage) => {
        image.addEventListener('load', () => resolveImage(), { once: true })
        image.addEventListener('error', () => rejectImage(
          new Error(`Report image failed to load: ${image.currentSrc || image.src}`),
        ), { once: true })
      })
    }))
  })
}

async function inspectRenderedReport(page: Page, fixture: SampleManualFixture) {
  const missionTitles = await page.locator('.upgrade-mission-card h3').allTextContents()
  const renderedArchetype = (await page.locator('#business-archetype-title').textContent())?.trim() ?? ''
  const renderedScore = (await page.locator('.share-card-score > strong').textContent())?.trim() ?? ''
  const validationIssues = await page.locator('.report-validation-banner li').allTextContents()
  const artworkState = await page.locator('.archetype-cover-artwork img').evaluateAll((images) =>
    images.map((image) => ({
      src: (image as HTMLImageElement).currentSrc,
      complete: (image as HTMLImageElement).complete,
      width: (image as HTMLImageElement).naturalWidth,
      height: (image as HTMLImageElement).naturalHeight,
    })),
  )

  await page.emulateMedia({ media: 'print' })
  const layout = await page.locator('.report-shell').evaluate((report) => {
    const reportRect = report.getBoundingClientRect()
    const horizontalOverflow = Array.from(report.querySelectorAll<HTMLElement>('*'))
      .filter((element) => {
        const style = getComputedStyle(element)
        if (style.display === 'none' || style.position === 'fixed') return false
        const rect = element.getBoundingClientRect()
        return rect.width > 0
          && (rect.left < reportRect.left - 2 || rect.right > reportRect.right + 2)
      })
      .slice(0, 12)
      .map((element) => ({
        tag: element.tagName.toLocaleLowerCase(),
        className: element.className,
        text: element.textContent?.trim().slice(0, 90) ?? '',
      }))
    const clippedText = Array.from(report.querySelectorAll<HTMLElement>('*'))
      .filter((element) => {
        const style = getComputedStyle(element)
        const lineClamp = style.getPropertyValue('-webkit-line-clamp')
        return element.textContent?.trim()
          && (style.textOverflow === 'ellipsis' || (lineClamp && lineClamp !== 'none'))
      })
      .slice(0, 12)
      .map((element) => ({
        tag: element.tagName.toLocaleLowerCase(),
        className: element.className,
        text: element.textContent?.trim().slice(0, 90) ?? '',
      }))
    return { horizontalOverflow, clippedText }
  })

  const errors: string[] = []
  if (validationIssues.length > 0) {
    errors.push(`Export validation failed: ${validationIssues.join(' | ')}`)
  }
  if (renderedArchetype !== fixture.targetArchetype) {
    errors.push(`Rendered archetype ${renderedArchetype || '(missing)'} did not match ${fixture.targetArchetype}.`)
  }
  if (renderedScore !== String(fixture.score)) {
    errors.push(`Rendered score ${renderedScore || '(missing)'} did not match ${fixture.score}.`)
  }
  if (missionTitles.length !== 3 || new Set(missionTitles.map((title) => title.toLocaleLowerCase())).size !== 3) {
    errors.push(`Expected three distinct rendered missions; found ${missionTitles.length}.`)
  }
  if (artworkState.length !== 1 || artworkState.some((image) => !image.complete || image.width < 1 || image.height < 1)) {
    errors.push('Archetype artwork was missing or incomplete before capture.')
  }
  if (layout.horizontalOverflow.length > 0) {
    errors.push(`Horizontal print overflow: ${JSON.stringify(layout.horizontalOverflow)}`)
  }
  if (layout.clippedText.length > 0) {
    errors.push(`Print text uses clipping or ellipsis: ${JSON.stringify(layout.clippedText)}`)
  }

  return { missionTitles, errors }
}

async function extractPdfText(pdfPath: string, outputPath: string) {
  await execFileAsync('gs', [
    '-q',
    '-dNOPAUSE',
    '-dBATCH',
    '-sDEVICE=txtwrite',
    `-sOutputFile=${outputPath}`,
    pdfPath,
  ])
  return await readFile(outputPath, 'utf8')
}

async function renderPagePreviews(pdfPath: string, destination: string) {
  await rm(destination, { recursive: true, force: true })
  await mkdir(destination, { recursive: true })
  await execFileAsync('gs', [
    '-q',
    '-dNOPAUSE',
    '-dBATCH',
    '-sDEVICE=png16m',
    '-r110',
    '-dTextAlphaBits=4',
    '-dGraphicsAlphaBits=4',
    `-sOutputFile=${join(destination, 'page-%02d.png')}`,
    pdfPath,
  ])
}

async function inspectPdf(
  fixture: SampleManualFixture,
  pdfPath: string,
  missionTitles: string[],
) {
  const bytes = await readFile(pdfPath)
  const document = await PDFDocument.load(bytes)
  const pageCount = document.getPageCount()
  const textPath = join(artifactDirectory, `${fixture.slug}.txt`)
  const text = await extractPdfText(pdfPath, textPath)
  const previewPath = join(previewDirectory, fixture.slug)
  await renderPagePreviews(pdfPath, previewPath)
  const errors: string[] = []

  if (pageCount !== requiredPageCount) {
    errors.push(`Expected ${requiredPageCount} pages; generated ${pageCount}.`)
  }
  const requiredStrings = [
    fixture.snapshot.businessName,
    fixture.snapshot.niche,
    fixture.snapshot.city,
    fixture.targetArchetype,
    `${fixture.score}/100`,
    'Sample Operating Manual',
    ...missionTitles,
  ]
  requiredStrings.forEach((value) => {
    if (!text.toLocaleLowerCase().includes(value.toLocaleLowerCase())) {
      errors.push(`Extracted PDF text is missing “${value}”.`)
    }
  })
  forbiddenPdfPatterns.forEach((pattern) => {
    if (pattern.test(text)) errors.push(`Extracted PDF text matched forbidden pattern ${pattern}.`)
  })
  if (/\b(?:is guaranteed to|will guarantee|guaranteed revenue|guaranteed ranking)\b/i.test(text)) {
    errors.push('Extracted PDF text contains an unsupported guaranteed-outcome claim.')
  }

  const otherBusinesses = sampleManualFixtures
    .filter((candidate) => candidate.slug !== fixture.slug)
    .map((candidate) => candidate.snapshot.businessName)
    .filter((businessName) => text.toLocaleLowerCase().includes(businessName.toLocaleLowerCase()))
  if (otherBusinesses.length > 0) {
    errors.push(`PDF contains another fixture business: ${otherBusinesses.join(', ')}.`)
  }

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const pageTextPath = join(artifactDirectory, `${fixture.slug}-page-${pageNumber}.txt`)
    await execFileAsync('gs', [
      '-q',
      '-dNOPAUSE',
      '-dBATCH',
      `-dFirstPage=${pageNumber}`,
      `-dLastPage=${pageNumber}`,
      '-sDEVICE=txtwrite',
      `-sOutputFile=${pageTextPath}`,
      pdfPath,
    ])
    const pageText = (await readFile(pageTextPath, 'utf8')).replace(/\s+/g, ' ').trim()
    await rm(pageTextPath, { force: true })
    if (pageText.length < 80) {
      errors.push(`Page ${pageNumber} appears blank or nearly blank (${pageText.length} text characters).`)
    }
  }

  return { pageCount, errors }
}

async function generateFixture(
  browser: Browser,
  fixture: SampleManualFixture,
  url: string,
): Promise<GenerationResult> {
  const pdfFilename = `${cleanFilename(fixture.snapshot.businessName)}-business-operating-manual.pdf`
  const pdfPath = join(artifactDirectory, pdfFilename)
  const errors: string[] = []
  let pageCount = 0
  let missionCount = 0

  if (scoreTotal(fixture) !== fixture.score) {
    errors.push(`Score arithmetic failed: ${scoreTotal(fixture)} does not equal ${fixture.score}.`)
  }
  if (fixture.snapshot.evidenceItems.length < 6) {
    errors.push(`Expected at least six evidence items; found ${fixture.snapshot.evidenceItems.length}.`)
  }
  if (fixture.snapshot.recommendedActions.some((action) => action.status === 'Completed')) {
    errors.push('A baseline sample mission is incorrectly marked Completed.')
  }

  const context = await browser.newContext({
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
    viewport: { width: 1440, height: 1000 },
  })
  const page = await context.newPage()
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`Browser console error: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`Browser page error: ${error.message}`))

  try {
    await seedSnapshot(page, fixture, url)
    const renderInspection = await inspectRenderedReport(page, fixture)
    missionCount = renderInspection.missionTitles.length
    errors.push(...renderInspection.errors)
    if (renderInspection.errors.length > 0) {
      throw new Error('Report failed pre-capture validation.')
    }
    await page.pdf({
      path: pdfPath,
      format: 'Letter',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    const pdfInspection = await inspectPdf(
      fixture,
      pdfPath,
      renderInspection.missionTitles,
    )
    pageCount = pdfInspection.pageCount
    errors.push(...pdfInspection.errors)
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error))
  } finally {
    await context.close()
  }

  return {
    business: fixture.snapshot.businessName,
    category: fixture.snapshot.niche,
    archetype: fixture.targetArchetype,
    score: fixture.score,
    missionCount,
    evidenceCount: fixture.snapshot.evidenceItems.length,
    pdfFilename,
    pageCount,
    status: errors.length === 0 ? 'success' : 'failure',
    errors,
  }
}

function markdownSummary(results: GenerationResult[]) {
  const rows = results.map((result) =>
    `| ${result.business} | ${result.category} | ${result.archetype} | ${result.score}/100 | ${result.missionCount} | ${result.evidenceCount} | ${result.pdfFilename} | ${result.pageCount} | ${result.status} |`,
  )
  const failures = results
    .filter((result) => result.errors.length > 0)
    .map((result) => `### ${result.business}\n\n${result.errors.map((error) => `- ${error}`).join('\n')}`)
    .join('\n\n')

  return `# Sample manual generation summary

Generated: ${new Date().toISOString()}

All records in this batch are fictional developer fixtures. The PDF cover identifies each output as a Sample Operating Manual.

| Business | Category | Archetype | Score | Missions | Evidence | PDF | Pages | Status |
| --- | --- | --- | ---: | ---: | ---: | --- | ---: | --- |
${rows.join('\n')}
${failures ? `\n## Validation failures\n\n${failures}\n` : ''}`
}

async function main() {
  await mkdir(artifactDirectory, { recursive: true })
  await mkdir(previewDirectory, { recursive: true })
  const port = await findOpenPort()
  const url = `http://127.0.0.1:${port}`
  const previewServer = startPreviewServer(port)
  let browser: Browser | null = null
  const results: GenerationResult[] = []

  try {
    await waitForServer(url, previewServer)
    browser = await chromium.launch({ headless: true })
    for (const fixture of sampleManualFixtures) {
      process.stdout.write(`\nGenerating ${fixture.snapshot.businessName}...\n`)
      const result = await generateFixture(browser, fixture, url)
      results.push(result)
      process.stdout.write(`${result.status.toLocaleUpperCase()}: ${result.pdfFilename} (${result.pageCount} pages)\n`)
      result.errors.forEach((error) => process.stdout.write(`  - ${error}\n`))
    }
  } finally {
    if (browser) await browser.close()
    await stopPreviewServer(previewServer)
  }

  const summaryJsonPath = join(artifactDirectory, 'generation-summary.json')
  const summaryMarkdownPath = join(artifactDirectory, 'generation-summary.md')
  await writeFile(summaryJsonPath, JSON.stringify(results, null, 2) + '\n')
  await writeFile(summaryMarkdownPath, markdownSummary(results))

  process.stdout.write(`\nSummary: ${summaryMarkdownPath}\n`)
  process.stdout.write(`Machine-readable summary: ${summaryJsonPath}\n`)
  const failed = results.filter((result) => result.status === 'failure')
  if (failed.length > 0) {
    throw new Error(`${failed.length} sample manual${failed.length === 1 ? '' : 's'} failed validation.`)
  }
  process.stdout.write(`Generated ${results.length} validated ten-page sample manuals in ${artifactDirectory}.\n`)
}

await main().catch((error) => {
  process.stderr.write(`\nSample manual generation failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
