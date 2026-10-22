import { createServerFn } from '@tanstack/react-start'
import { asc, count, desc, eq, or } from 'drizzle-orm'
import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

import { db } from '../../db/index.js'
import {
  assignments,
  comments,
  eventState,
  participants,
} from '../../db/schema.js'
import {
  EVENT_NAME,
  TOTAL_PARTICIPANTS,
  type CommentItem,
  type EventStatus,
  type RecipientCard,
  type Result,
} from '@/lib/event'
import { emailEnabled, sendEmail } from './email'

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const nameKey = (name: string) =>
  name.trim().replace(/\s+/g, ' ').toLowerCase()
const hashCode = (code: string) =>
  createHash('sha256').update(code.trim().toUpperCase()).digest('hex')

function makeCode() {
  let code = ''
  for (let i = 0; i < 8; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  return code
}

function safeEqual(a: string, b: string) {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

async function readStatus(): Promise<EventStatus> {
  const [people, [state], [drawn]] = await Promise.all([
    db
      .select({ name: participants.name })
      .from(participants)
      .orderBy(asc(participants.createdAt)),
    db.select().from(eventState).where(eq(eventState.id, 1)),
    db.select({ n: count() }).from(assignments),
  ])
  return {
    registered: people.length,
    total: TOTAL_PARTICIPANTS,
    // Only first names are public; emails and wishlists stay private.
    names: people.map((p) => p.name.split(' ')[0]),
    registrationClosed: state?.registrationClosed ?? false,
    drawComplete: (drawn?.n ?? 0) > 0,
  }
}

export const getEventStatus = createServerFn({ method: 'GET' }).handler(
  async () => readStatus(),
)

const optional = (max: number) => z.string().trim().max(max).default('')

const registrationInput = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  wishlist: z.string().trim().min(3).max(2000),
  links: optional(2000),
  dislikes: optional(1000),
  hobbies: optional(1000),
  sizes: optional(500),
})

export const registerParticipant = createServerFn({ method: 'POST' })
  .validator(registrationInput)
  .handler(async ({ data }): Promise<Result<{ code: string; emailed: boolean }>> => {
    const status = await readStatus()
    if (status.registrationClosed)
      return { ok: false, error: 'Registration is closed — the draw is locked in.' }
    if (status.registered >= TOTAL_PARTICIPANTS)
      return { ok: false, error: `All ${TOTAL_PARTICIPANTS} spots are already taken.` }

    const key = nameKey(data.name)
    const existing = await db
      .select({ nameKey: participants.nameKey, email: participants.email })
      .from(participants)
      .where(or(eq(participants.nameKey, key), eq(participants.email, data.email)))
    if (existing.length > 0) {
      const sameEmail = existing.some((p) => p.email === data.email)
      return {
        ok: false,
        error: sameEmail
          ? 'This email is already registered. Each colleague can sign up once.'
          : 'Someone with this name is already registered. Each colleague can sign up once.',
      }
    }

    const code = makeCode()
    try {
      await db.insert(participants).values({
        ...data,
        name: data.name.replace(/\s+/g, ' '),
        nameKey: key,
        codeHash: hashCode(code),
      })
    } catch {
      // Unique constraint lost a race with a simultaneous registration.
      return { ok: false, error: 'This name or email is already registered.' }
    }

    const emailed = await sendEmail(
      data.email,
      `You're in! ${EVENT_NAME} 🎄`,
      `Hi ${data.name},\n\nYour wishlist for ${EVENT_NAME} is saved.\n\nYour personal Secret Santa code is: ${code}\n\nKeep it safe — you'll need it with your email to reveal who you're buying a gift for once the draw opens.\n\nHo ho ho! 🎁`,
    )
    return { ok: true, data: { code, emailed } }
  })

export const confirmRegistration = createServerFn({ method: 'POST' })
  .validator(z.object({ password: z.string().min(1).max(200) }))
  .handler(async ({ data }): Promise<Result<EventStatus>> => {
    const expected = process.env.ORGANIZER_PASSWORD
    if (!expected)
      return { ok: false, error: 'The organizer password has not been set up for this site yet.' }
    if (!safeEqual(data.password, expected))
      return { ok: false, error: 'That organizer password is not correct.' }

    const status = await readStatus()
    if (status.registered < TOTAL_PARTICIPANTS)
      return {
        ok: false,
        error: `Only ${status.registered} of ${TOTAL_PARTICIPANTS} colleagues have registered so far.`,
      }

    await db
      .insert(eventState)
      .values({ id: 1, registrationClosed: true, closedAt: new Date() })
      .onConflictDoUpdate({
        target: eventState.id,
        set: { registrationClosed: true, closedAt: new Date() },
      })
    return { ok: true, data: await readStatus() }
  })

// Creates the assignments exactly once. A single multi-row INSERT is atomic,
// so if two people trigger the draw at the same moment, the unique constraints
// make the second insert fail and everyone reads the first draw.
async function ensureDraw() {
  const [{ n }] = await db.select({ n: count() }).from(assignments)
  if (n > 0) return

  const people = await db.select().from(participants)
  // Fisher–Yates shuffle, then everyone gives to the next person in the circle:
  // nobody draws themselves and everyone receives exactly once.
  for (let i = people.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[people[i], people[j]] = [people[j], people[i]]
  }
  const rows = people.map((giver, i) => ({
    giverId: giver.id,
    receiverId: people[(i + 1) % people.length].id,
  }))
  try {
    await db.insert(assignments).values(rows)
  } catch {
    return
  }

  if (!emailEnabled()) return
  await Promise.allSettled(
    people.map((giver, i) => {
      const r = people[(i + 1) % people.length]
      return sendEmail(
        giver.email,
        `Your ${EVENT_NAME} recipient 🎁`,
        `Hi ${giver.name},\n\nYou are the Secret Santa for: ${r.name}\n\nTheir wishlist:\n${r.wishlist}` +
          (r.links ? `\n\nLinks:\n${r.links}` : '') +
          (r.dislikes ? `\n\nPlease avoid:\n${r.dislikes}` : '') +
          (r.hobbies ? `\n\nHobbies & interests:\n${r.hobbies}` : '') +
          (r.sizes ? `\n\nSizes:\n${r.sizes}` : '') +
          `\n\nShh… keep it secret! 🤫`,
      )
    }),
  )
}

export const revealRecipient = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      email: z.string().trim().toLowerCase().email().max(200),
      code: z.string().trim().min(4).max(20),
    }),
  )
  .handler(async ({ data }): Promise<Result<RecipientCard>> => {
    const status = await readStatus()
    if (!status.registrationClosed || status.registered < TOTAL_PARTICIPANTS)
      return { ok: false, error: 'The draw opens once everyone is registered and the organizer confirms.' }

    const [me] = await db
      .select()
      .from(participants)
      .where(eq(participants.email, data.email))
    if (!me || !safeEqual(me.codeHash, hashCode(data.code)))
      return { ok: false, error: 'That email and code don’t match a registered colleague.' }

    await ensureDraw()

    const [match] = await db
      .select({ receiverId: assignments.receiverId })
      .from(assignments)
      .where(eq(assignments.giverId, me.id))
    if (!match) return { ok: false, error: 'No assignment found for you. Please contact the organizer.' }

    const [r] = await db
      .select()
      .from(participants)
      .where(eq(participants.id, match.receiverId))
    return {
      ok: true,
      data: {
        name: r.name,
        wishlist: r.wishlist,
        links: r.links,
        dislikes: r.dislikes,
        hobbies: r.hobbies,
        sizes: r.sizes,
      },
    }
  })

export const listComments = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CommentItem[]> => {
    const rows = await db
      .select()
      .from(comments)
      .orderBy(desc(comments.createdAt))
      .limit(100)
    return rows.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() }))
  },
)

export const addComment = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      name: z.string().trim().min(1).max(60),
      message: z.string().trim().min(1).max(500),
    }),
  )
  .handler(async ({ data }): Promise<Result<CommentItem>> => {
    const [row] = await db.insert(comments).values(data).returning()
    return { ok: true, data: { ...row, createdAt: row.createdAt.toISOString() } }
  })
