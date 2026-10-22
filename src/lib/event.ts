// Shared event settings, safe to import from client and server code.
export const EVENT_NAME = 'ATEEC · Գաղտնի Ձմեռ Պապ 2026'
export const TOTAL_PARTICIPANTS = 16

export type EventStatus = {
  registered: number
  total: number
  names: string[]
  registrationClosed: boolean
  drawComplete: boolean
}

export type RecipientCard = {
  name: string
  wishlist: string
  links: string
  dislikes: string
  hobbies: string
  sizes: string
}

export type CommentItem = {
  id: number
  name: string
  message: string
  createdAt: string
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: string }
