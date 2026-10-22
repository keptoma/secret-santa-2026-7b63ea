# Secret Santa 2026 🎄

A festive, responsive single-page site for our office Secret Santa. Colleagues can:

1. **Register a wishlist.** This includes name, email, gift ideas, and optional product links, dislikes, hobbies, and sizes. Duplicate names and emails are blocked. Each person gets a private 8-character code.
2. **Follow registration progress.** The page shows "X people registered" out of 16, with a progress bar and an ornament for each colleague.
3. **Draw their recipient.** The **Choose My Secret Santa Recipient 🎁** button stays locked until all 16 have registered and the organizer confirms. The first reveal shuffles everyone into one gift circle: nobody gets themselves, and everyone gives and receives exactly once. The result is saved permanently. Each person sees only their own match, after entering their email and code.
4. **Leave comments.** A friendly message wall for suggestions and festive cheer.

## Tech

- TanStack Start (React 19) + Tailwind CSS 4 + shadcn/ui
- Netlify Database (managed Postgres) with Drizzle ORM. Migrations are in `netlify/database/migrations/` and are applied automatically on deploy.
- TanStack Start server functions hold all private logic (draw, password check, email). No secrets reach the browser.
- Optional email sent from a Gmail account
- Hero illustration served through the Netlify Image CDN

## Configuration (Netlify → Project configuration → Environment variables)

| Variable             | Required | Purpose                                                                          |
| -------------------- | -------- | -------------------------------------------------------------------------------- |
| `ORGANIZER_PASSWORD` | Yes      | Lets the organizer confirm that registration is complete and open the draw       |
| `GMAIL_USER`         | Optional | Gmail address that sends the sign-up code and each person's match after the draw |
| `GMAIL_APP_PASSWORD` | Optional | Google app password for that account (not the normal Gmail password)             |

To change the group size, edit `TOTAL_PARTICIPANTS` in `src/lib/event.ts`.

## Run locally

```bash
pnpm install
netlify dev    # runs the app with local Netlify Database emulation
```

## Ideas for later

- An organizer dashboard (edit or remove registrations, resend codes)
- A "forgot my code" email flow
- A gift budget and exchange date banner
