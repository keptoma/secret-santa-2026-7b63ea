// Remembers this device's registration so the reveal form can be prefilled.
const KEY = 'secret-santa-2026:me'

export type SavedCode = { email: string; code: string; name: string }

export function saveMyCode(value: SavedCode) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    // Storage can be unavailable (private mode); the code is still shown on screen.
  }
}

export function loadMyCode(): SavedCode | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SavedCode) : null
  } catch {
    return null
  }
}
