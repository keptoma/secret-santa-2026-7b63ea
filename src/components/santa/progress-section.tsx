import { CheckCircle2, Lock, Users } from 'lucide-react'

import { Progress } from '@/components/ui/progress'
import type { EventStatus } from '@/lib/event'
import { SectionHeading } from './section-heading'

export function ProgressSection({ status }: { status: EventStatus }) {
  const pct = Math.round((status.registered / status.total) * 100)
  const slots = Array.from({ length: status.total }, (_, i) => status.names[i])

  return (
    <section id="progress" className="scroll-mt-6 bg-muted/60 px-5 py-20">
      <div className="mx-auto max-w-content">
        <SectionHeading eyebrow="Registration progress" title="Who's on the nice list?">
          Each ornament lights up when a colleague submits their wishlist.
        </SectionHeading>

        <div className="mx-auto max-w-3xl rounded-[2rem] border bg-card p-6 shadow-sm md:p-10">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="font-display text-5xl font-black text-primary md:text-6xl">
                {status.registered}
                <span className="text-2xl text-muted-foreground md:text-3xl"> / {status.total}</span>
              </p>
              <p className="mt-1 font-medium text-pine">
                {status.registered === 1 ? '1 person registered' : `${status.registered} people registered`}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <Stat icon={<Users className="size-4" />} label={`${status.total} participants`} />
              <Stat
                icon={status.registrationClosed ? <Lock className="size-4" /> : <CheckCircle2 className="size-4" />}
                label={status.registrationClosed ? 'Registration closed' : 'Registration open'}
              />
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-2 flex justify-between text-sm font-medium">
              <span className="text-pine">{pct}% complete</span>
              <span className="text-muted-foreground">
                {status.total - status.registered > 0
                  ? `${status.total - status.registered} to go`
                  : 'Everyone is in 🎉'}
              </span>
            </div>
            <Progress
              value={pct}
              aria-label="Registration progress"
              className="h-4 bg-secondary/15 [&>[data-slot=progress-indicator]]:bg-linear-to-r [&>[data-slot=progress-indicator]]:from-secondary [&>[data-slot=progress-indicator]]:to-primary"
            />
          </div>

          <ul className="mt-10 grid grid-cols-4 gap-x-3 gap-y-5 sm:grid-cols-8">
            {slots.map((name, i) => (
              <li key={i} className="flex flex-col items-center gap-1.5 text-center">
                <span
                  className={`relative grid size-11 place-items-center rounded-full text-lg transition-all ${
                    name
                      ? `${i % 3 === 0 ? 'bg-primary' : i % 3 === 1 ? 'bg-secondary' : 'bg-gold'} text-primary-foreground shadow-md`
                      : 'border-2 border-dashed border-border bg-background text-muted-foreground/50'
                  }`}
                >
                  <span className="absolute -top-1.5 h-2 w-3 rounded-sm bg-gold/80" />
                  {name ? name[0].toUpperCase() : '·'}
                </span>
                <span className="w-full truncate text-xs text-muted-foreground">{name ?? 'Open'}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 font-medium text-pine">
      {icon}
      {label}
    </span>
  )
}
