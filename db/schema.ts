import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const participants = pgTable('participants', {
  id: serial().primaryKey(),
  name: text().notNull(),
  // Lower-cased, whitespace-collapsed name used to block duplicate registrations.
  nameKey: text('name_key').notNull().unique(),
  email: text().notNull().unique(),
  wishlist: text().notNull(),
  links: text().notNull().default(''),
  dislikes: text().notNull().default(''),
  hobbies: text().notNull().default(''),
  sizes: text().notNull().default(''),
  // SHA-256 of the personal code a participant uses to reveal their recipient.
  codeHash: text('code_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const assignments = pgTable('assignments', {
  id: serial().primaryKey(),
  giverId: integer('giver_id')
    .notNull()
    .unique()
    .references(() => participants.id),
  receiverId: integer('receiver_id')
    .notNull()
    .unique()
    .references(() => participants.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Single-row table (id = 1) holding event-wide state.
export const eventState = pgTable('event_state', {
  id: integer().primaryKey(),
  registrationClosed: boolean('registration_closed').notNull().default(false),
  closedAt: timestamp('closed_at'),
})

export const comments = pgTable('comments', {
  id: serial().primaryKey(),
  name: text().notNull(),
  message: text().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
