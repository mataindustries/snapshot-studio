import type { SavedSnapshot } from '../types'

const storageKey = 'snapshot-studio:snapshots'

function safelyParseSnapshots(value: string | null): SavedSnapshot[] {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function loadSnapshots(): SavedSnapshot[] {
  return safelyParseSnapshots(localStorage.getItem(storageKey))
}

export function saveSnapshot(snapshot: SavedSnapshot): SavedSnapshot[] {
  const snapshots = loadSnapshots()
  const nextSnapshots = [
    snapshot,
    ...snapshots.filter((saved) => saved.id !== snapshot.id),
  ]

  localStorage.setItem(storageKey, JSON.stringify(nextSnapshots))
  return nextSnapshots
}

export function deleteSnapshot(snapshotId: string): SavedSnapshot[] {
  const nextSnapshots = loadSnapshots().filter((snapshot) => snapshot.id !== snapshotId)
  localStorage.setItem(storageKey, JSON.stringify(nextSnapshots))
  return nextSnapshots
}
