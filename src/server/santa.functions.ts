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
      return { ok: false, error: 'Գրանցումը փակ է․ վիճակահանությունը կայացված է։' }
    if (status.registered >= TOTAL_PARTICIPANTS)
      return { ok: false, error: `Բոլոր ${TOTAL_PARTICIPANTS} տեղերն արդեն զբաղված են։` }

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
          ? 'Այս էլ. հասցեն արդեն գրանցված է։ Յուրաքանչյուր գործընկեր կարող է գրանցվել միայն մեկ անգամ։'
          : 'Այս անունով մեկն արդեն գրանցված է։ Յուրաքանչյուր գործընկեր կարող է գրանցվել միայն մեկ անգամ։',
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
      return { ok: false, error: 'Այս անունը կամ էլ. հասցեն արդեն գրանցված է։' }
    }

    const emailed = await sendEmail(
      data.email,
      `Դուք գրանցված եք։ ${EVENT_NAME} 🎄`,
      `Բարև ${data.name},\n\nՁեր ցանկությունների ցուցակը պահպանվել է «${EVENT_NAME}»-ի համար։\n\nՁեր անձնական Գաղտնի Ձմեռ Պապիկի կոդը՝ ${code}\n\nՊահեք այն. վիճակահանությունը բացվելուց հետո այն ձեր էլ. հասցեի հետ պետք կգա՝ իմանալու համար, թե ում համար եք նվեր գնելու։\n\nՀո-հո-հո։ 🎁`,
    )
    return { ok: true, data: { code, emailed } }
  })

export const confirmRegistration = createServerFn({ method: 'POST' })
  .validator(z.object({ password: z.string().min(1).max(200) }))
  .handler(async ({ data }): Promise<Result<EventStatus>> => {
    const expected = process.env.ORGANIZER_PASSWORD
    if (!expected)
      return { ok: false, error: 'Կազմակերպչի գաղտնաբառը դեռ սահմանված չէ այս կայքի համար։' }
    if (!safeEqual(data.password, expected))
      return { ok: false, error: 'Կազմակերպչի գաղտնաբառը սխալ է։' }

    const status = await readStatus()
    if (status.registered < TOTAL_PARTICIPANTS)
      return {
        ok: false,
        error: `Առայժմ գրանցվել է ${status.registered} գործընկեր ${TOTAL_PARTICIPANTS}-ից։`,
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
        `Ձեր «${EVENT_NAME}»-ի ստացողը 🎁`,
        `Բարև ${giver.name},\n\nԴուք Գաղտնի Ձմեռ Պապիկ եք՝ ${r.name}-ի համար\n\nՆրա ցանկությունների ցուցակը՝\n${r.wishlist}` +
          (r.links ? `\n\nՀղումներ՝\n${r.links}` : '') +
          (r.dislikes ? `\n\nԽնդրում ենք խուսափել՝\n${r.dislikes}` : '') +
          (r.hobbies ? `\n\nՀոբբիներ և հետաքրքրություններ՝\n${r.hobbies}` : '') +
          (r.sizes ? `\n\nՉափսեր՝\n${r.sizes}` : '') +
          `\n\nՇշշ… գաղտնի պահեք։ 🤫`,
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
      return { ok: false, error: 'Վիճակահանությունը կբացվի, երբ բոլորը գրանցվեն և կազմակերպիչը հաստատի։' }

    const [me] = await db
      .select()
      .from(participants)
      .where(eq(participants.email, data.email))
    if (!me || !safeEqual(me.codeHash, hashCode(data.code)))
      return { ok: false, error: 'Այս էլ. հասցեն և կոդը չեն համընկնում որևէ գրանցված գործընկերոջ հետ։' }

    await ensureDraw()

    const [match] = await db
      .select({ receiverId: assignments.receiverId })
      .from(assignments)
      .where(eq(assignments.giverId, me.id))
    if (!match) return { ok: false, error: 'Ձեզ համար զույգ չի գտնվել։ Խնդրում ենք դիմել կազմակերպչին։' }

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
