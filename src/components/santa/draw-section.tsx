import { useRouter } from '@tanstack/react-router'
import { Gift, KeyRound, Loader2, Lock, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { EventStatus, RecipientCard } from '@/lib/event'
import { loadMyCode } from '@/lib/my-code'
import { confirmRegistration, revealRecipient } from '@/server/santa.functions'
import { SectionHeading } from './section-heading'
import { Snowfall } from './snowfall'

export function DrawSection({ status }: { status: EventStatus }) {
  const everyoneIn = status.registered >= status.total
  const ready = everyoneIn && status.registrationClosed
  const [open, setOpen] = useState(false)

  const reason = !everyoneIn
    ? `Սպասում ենք ևս ${status.total - status.registered} ցանկի։`
    : !status.registrationClosed
      ? 'Բոլորը գրանցված են։ Սպասում ենք, որ կազմակերպիչը հաստատի գրանցման ավարտը։'
      : status.drawComplete
        ? 'Վիճակահանությունը կատարված է։ Մուտքագրեք ձեր էլ. հասցեն և կոդը՝ ձեր զույգին տեսնելու համար։'
        : 'Վիճակահանությունը բաց է․ առաջին սեղմումը միանգամից բաժանում է բոլորին։'

  return (
    <section id="draw" className="relative scroll-mt-6 overflow-hidden bg-pine px-5 py-20 text-secondary-foreground">
      <Snowfall />
      <div className="relative z-10 mx-auto max-w-content">
        <SectionHeading eyebrow="Քայլ 2 · Վիճակահանություն" title="Ո՞ւմ եք ուրախացնելու" light>
          Յուրաքանչյուրը ընկնում է մեկ անուն։ 🎁 Ոչ ոք ինքն իրեն նվեր չի տալիս (նույնիսկ եթե շատ
          արժանի է 😄), իսկ վիճակահանության արդյունքները կնքվում են էլֆերի գաղտնի կնիքով և այլևս
          չեն փոխվում։ 🤫🎄
        </SectionHeading>

        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <Steps everyoneIn={everyoneIn} closed={status.registrationClosed} drawn={status.drawComplete} />

          <Button
            size="lg"
            disabled={!ready}
            onClick={() => setOpen(true)}
            className="mt-10 h-16 w-full rounded-full bg-primary px-8 text-lg font-bold shadow-2xl shadow-black/30 hover:bg-primary/90 disabled:bg-secondary-foreground/15 disabled:text-secondary-foreground/70 disabled:opacity-100 sm:w-auto"
          >
            {ready ? <Gift className="size-6" /> : <Lock className="size-5" />}
            Ընտրել իմ նվերի ստացողին 🎁
          </Button>
          <p className="mt-4 text-sm text-secondary-foreground/75" aria-live="polite">
            {reason}
          </p>

          <OrganizerPanel status={status} />
        </div>
      </div>

      <RevealDialog open={open} onOpenChange={setOpen} />
    </section>
  )
}

function Steps({ everyoneIn, closed, drawn }: { everyoneIn: boolean; closed: boolean; drawn: boolean }) {
  const steps = [
    { label: 'Բոլոր ցանկերը', done: everyoneIn },
    { label: 'Կազմակերպչի հաստատում', done: closed },
    { label: 'Վիճակահանություն', done: drawn },
  ]
  return (
    <ol className="grid w-full grid-cols-3 gap-2">
      {steps.map((s, i) => (
        <li
          key={s.label}
          className={`rounded-2xl border px-2 py-3 text-xs font-semibold sm:text-sm ${
            s.done ? 'border-gold/60 bg-gold/15 text-gold' : 'border-secondary-foreground/15 text-secondary-foreground/60'
          }`}
        >
          <span className="mb-1 block font-display text-xl">{s.done ? '✓' : i + 1}</span>
          {s.label}
        </li>
      ))}
    </ol>
  )
}

function OrganizerPanel({ status }: { status: EventStatus }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const everyoneIn = status.registered >= status.total

  if (status.registrationClosed) return null

  async function onConfirm(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    try {
      const res = await confirmRegistration({ data: { password } })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success('Գրանցումը հաստատված է․ վիճակահանությունը բաց է։ 🎅')
      setPassword('')
      await router.invalidate()
    } catch {
      toast.error('Չհաջողվեց հաստատել գրանցումը։ Խնդրում ենք փորձել կրկին։')
    } finally {
      setPending(false)
    }
  }

  return (
    <details className="group mt-12 w-full rounded-2xl border border-secondary-foreground/15 bg-pine-deep/50 text-left">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-semibold text-secondary-foreground/85">
        <ShieldCheck className="size-4 text-gold" /> Կազմակերպիչ․ հաստատել գրանցման ավարտը
        <span className="ml-auto transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <form onSubmit={onConfirm} className="grid gap-3 px-5 pb-5">
        <p className="text-sm text-secondary-foreground/70">
          Երբ ATEEC-ի բոլոր {status.total} գործընկերները գրանցվեն, կազմակերպիչը կարող է գործարկել
          վիճակահանությունը։ 🎩 Նա միայն սեղմում է կախարդական կոճակը։ Թե ով ում է նվեր տալու՝
          գաղտնիք է մնում նույնիսկ իր համար։ 🤫🎁 Հաստատելուց հետո հետդարձի ճանապարհ չկա․ էլֆերն
          արդեն գործի են անցնում։ 🎄
        </p>
        <Label htmlFor="organizer-password" className="text-secondary-foreground">
          Կազմակերպչի գաղտնաբառ
        </Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="organizer-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-secondary-foreground/20 bg-background text-foreground"
            autoComplete="current-password"
          />
          <Button type="submit" disabled={!everyoneIn || !password || pending} className="rounded-full bg-gold text-accent-foreground hover:bg-gold/90">
            {pending && <Loader2 className="animate-spin" />}
            Հաստատել և բացել վիճակահանությունը
          </Button>
        </div>
        {!everyoneIn && (
          <p className="text-xs text-secondary-foreground/60">
            Հասանելի կլինի, երբ ստացվեն {status.total}-ից {status.total} ցանկերը (առայժմ՝ {status.registered})։
          </p>
        )}
      </form>
    </details>
  )
}

function RevealDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recipient, setRecipient] = useState<RecipientCard | null>(null)

  useEffect(() => {
    if (!open) return
    const saved = loadMyCode()
    if (saved) {
      setEmail(saved.email)
      setCode(saved.code)
    }
  }, [open])

  function handleOpenChange(next: boolean) {
    if (!next) {
      setRecipient(null)
      setError(null)
    }
    onOpenChange(next)
  }

  async function onReveal(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      const res = await revealRecipient({ data: { email, code } })
      if (!res.ok) {
        setError(res.error)
        return
      }
      setRecipient(res.data)
      await router.invalidate()
    } catch {
      setError('Ինչ-որ բան սխալ գնաց։ Խնդրում ենք փորձել կրկին։')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl">
        {recipient ? (
          <>
            <DialogHeader>
              <p className="flex items-center gap-1.5 text-xs font-bold tracking-[0.2em] text-primary uppercase">
                <Sparkles className="size-4" /> Դուք Գաղտնի Ձմեռ Պապն եք՝
              </p>
              <DialogTitle className="font-display text-4xl font-black text-pine">{recipient.name}</DialogTitle>
              <DialogDescription>Շշշ… պահեք գաղտնի։ Ահա, թե ինչ է նա ցանկացել։</DialogDescription>
            </DialogHeader>
            <dl className="grid gap-4 text-sm">
              <Detail label="Ցանկություններ" value={recipient.wishlist} />
              <Detail label="Հղումներ" value={recipient.links} links />
              <Detail label="Խնդրում է խուսափել" value={recipient.dislikes} />
              <Detail label="Հոբբիներ և հետաքրքրություններ" value={recipient.hobbies} />
              <Detail label="Չափսեր" value={recipient.sizes} />
            </dl>
          </>
        ) : (
          <form onSubmit={onReveal} className="grid gap-4">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl text-pine">Իմացեք ձեր ստացողին</DialogTitle>
              <DialogDescription>
                Մուտքագրեք գրանցման ժամանակ նշած էլ. հասցեն և ձեր անձնական կոդը։ Ձեր զույգին
                տեսնում եք միայն դուք։
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor="reveal-email">Էլ. հասցե</Label>
              <Input id="reveal-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reveal-code">Անձնական կոդ</Label>
              <Input
                id="reveal-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
                className="font-mono tracking-[0.2em]"
                placeholder="XXXXXXXX"
              />
            </div>
            {error && (
              <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" disabled={pending} className="rounded-full font-bold">
              {pending ? <Loader2 className="animate-spin" /> : <KeyRound />}
              Բացահայտել իմ զույգին
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Detail({ label, value, links }: { label: string; value: string; links?: boolean }) {
  if (!value) return null
  return (
    <div className="rounded-2xl bg-muted p-4">
      <dt className="mb-1 text-xs font-bold tracking-wider text-primary uppercase">{label}</dt>
      <dd className="break-words whitespace-pre-line text-foreground">
        {links
          ? value.split(/\s+/).filter(Boolean).map((url, i) =>
              /^https?:\/\//i.test(url) ? (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block text-primary underline underline-offset-2">
                  {url}
                </a>
              ) : (
                <span key={i}>{url} </span>
              ),
            )
          : value}
      </dd>
    </div>
  )
}
