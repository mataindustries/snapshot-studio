import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

const componentSource = readFileSync(
  resolve(process.cwd(), 'src/components/ProofReport.tsx'),
  'utf8',
)
const styleSource = readFileSync(
  resolve(process.cwd(), 'src/components/ProofReport.css'),
  'utf8',
)

test('Proof Report render contract contains the required client-facing sections without internal IDs', () => {
  assert.match(componentSource, /Business and engagement identity|Implementation verification/)
  assert.match(componentSource, /Baseline Snapshot/)
  assert.match(componentSource, /Follow-Up Snapshot/)
  assert.match(componentSource, /Approved implementation/)
  assert.match(componentSource, /Completed work and evidence/)
  assert.match(componentSource, /Baseline evidence/)
  assert.match(componentSource, /After evidence/)
  assert.match(componentSource, /Verification method/)
  assert.match(componentSource, /Still incomplete or unverified/)
  assert.match(componentSource, /Recommended next action/)
  assert.doesNotMatch(componentSource, /action\.id|item\.id|missionId|sourceActionId/)
})

test('Proof Report print and phone CSS isolate the document and avoid clipped action cards', () => {
  assert.match(styleSource, /body\.printing-proof-report \.app-shell > \*/)
  assert.match(styleSource, /body\.printing-proof-report \.proof-report-controls[\s\S]*display: none !important/)
  assert.match(styleSource, /body\.printing-proof-report \.proof-report-document[\s\S]*display: grid !important/)
  assert.match(styleSource, /body\.printing-proof-report \.proof-action-card[\s\S]*break-inside: avoid/)
  assert.match(styleSource, /@media \(max-width: 640px\)[\s\S]*\.proof-evidence-comparison[\s\S]*grid-template-columns: minmax\(0, 1fr\)/)
})
