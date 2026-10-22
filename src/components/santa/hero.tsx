import { Gift, PenLine } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { EventStatus } from '@/lib/event'
import { Snowfall } from './snowfall'

const NAV = [
  { href: '#wishlist', label: 'Wishlist' },
  { href: '#progress', label: 'Progress' },
  { href: '#draw', label: 'The draw' },
  { href: '#comments', label: 'Comments' },
]

export function Hero({ status }: { status: EventStatus }) {
  const spotsLeft = Math.max(status.total - status.registered, 0)
  return (
    <header className="relative overflow-hidden bg-pine text-secondary-foreground">
      <Snowfall />
      <nav className="relative z-10 mx-auto flex max-w-content items-center justify-between px-5 py-5">
        <a href="#top" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <Gift className="size-5" />
          </span>
          Secret Santa <span className="text-gold">2026</span>
        </a>
        <ul className="hidden gap-7 text-sm font-medium text-secondary-foreground/80 md:flex">
          {NAV.map((n) => (
            <li key={n.href}>
              <a href={n.href} className="transition-colors hover:text-gold">
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div
        id="top"
        className="relative z-10 mx-auto grid max-w-content items-center gap-10 px-5 pt-6 pb-20 md:grid-cols-[1.1fr_1fr] md:pt-12 md:pb-28"
      >
        <div className="text-center md:text-left">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-pine-deep/60 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-gold uppercase">
            ✦ The office gift exchange ✦
          </p>
          <h1 className="text-5xl leading-[0.95] font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            Secret Santa
            <span className="block text-primary-foreground">
              <span className="text-gold">20</span>
              <span className="text-[oklch(0.68_0.19_25)]">26</span>
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg text-secondary-foreground/80 md:mx-0">
            Share your wishlist, watch the sign-ups roll in, then draw the colleague
            you'll surprise this Christmas. No peeking — every match stays secret.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
            <Button asChild size="lg" className="h-12 rounded-full px-7 text-base shadow-lg shadow-black/20">
              <a href="#wishlist">
                <PenLine /> Write my wishlist
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-secondary-foreground/30 bg-transparent px-7 text-base text-secondary-foreground hover:bg-secondary-foreground/10 hover:text-secondary-foreground"
            >
              <a href="#draw">
                <Gift /> Go to the draw
              </a>
            </Button>
          </div>
          <p className="mt-6 text-sm text-secondary-foreground/65">
            {status.registered} of {status.total} colleagues signed up
            {spotsLeft > 0 ? ` · ${spotsLeft} spots left` : ' · everyone is in!'}
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute inset-6 rounded-full bg-gold/25 blur-3xl" />
          <img
            src="/.netlify/images?url=/img/gifts.png&w=720&fm=webp"
            srcSet="/.netlify/images?url=/img/gifts.png&w=420&fm=webp 420w, /.netlify/images?url=/img/gifts.png&w=720&fm=webp 720w"
            sizes="(min-width: 768px) 28rem, 85vw"
            alt="A stack of wrapped Christmas gifts in red, green and cream with gold bows"
            width={720}
            height={720}
            className="relative aspect-square w-full rounded-[2.5rem] border-4 border-gold/30 object-cover shadow-2xl shadow-black/40 md:rotate-2"
          />
        </div>
      </div>
      <div aria-hidden className="ribbon-stripe relative z-10 h-3" />
    </header>
  )
}
