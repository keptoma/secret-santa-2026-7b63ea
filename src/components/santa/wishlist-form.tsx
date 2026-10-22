import { useRouter } from '@tanstack/react-router'
import { Copy, Gift, Loader2, Lock } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { EventStatus } from '@/lib/event'
import { saveMyCode } from '@/lib/my-code'
import { registerParticipant } from '@/server/santa.functions'
import { SectionHeading } from './section-heading'

const EMPTY = {
  name: '',
  email: '',
  wishlist: '',
  links: '',
  dislikes: '',
  hobbies: '',
  sizes: '',
}
type Fields = typeof EMPTY

export function WishlistForm({ status }: { status: EventStatus }) {
  const router = useRouter()
  const [values, setValues] = useState<Fields>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [success, setSuccess] = useState<{ code: string; emailed: boolean; name: string } | null>(null)

  const closed = status.registrationClosed || status.registered >= status.total

  const set = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    setErrors((er) => ({ ...er, [key]: undefined }))
  }

  function validate() {
    const next: typeof errors = {}
    if (values.name.trim().length < 2) next.name = 'Please enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) next.email = 'Please enter a valid email address.'
    if (values.wishlist.trim().length < 3) next.wishlist = 'Tell your Secret Santa at least one gift idea.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!validate()) return
    setPending(true)
    try {
      const res = await registerParticipant({ data: values })
      if (!res.ok) {
        setFormError(res.error)
        return
      }
      saveMyCode({ email: values.email.trim().toLowerCase(), code: res.data.code, name: values.name.trim() })
      setSuccess({ ...res.data, name: values.name.trim().split(' ')[0] })
      setValues(EMPTY)
      await router.invalidate()
    } catch {
      setFormError('Something went wrong saving your wishlist. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section id="wishlist" className="scroll-mt-6 px-5 py-20">
      <div className="mx-auto max-w-content">
        <SectionHeading eyebrow="Step 1 · Register" title="Write your wishlist">
          Help your Secret Santa find something you'll love. Only your Santa sees your
          wishlist — your email stays private.
        </SectionHeading>

        <div className="mx-auto max-w-3xl overflow-hidden rounded-[2rem] border bg-card shadow-xl shadow-pine/5">
          <div aria-hidden className="ribbon-stripe h-2" />
          {closed ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <Lock className="size-10 text-primary" />
              <h3 className="text-2xl font-bold text-pine">Registration is closed</h3>
              <p className="max-w-md text-muted-foreground">
                All {status.total} colleagues are signed up. Head to the draw to find out who
                you're buying for!
              </p>
              <Button asChild className="mt-2 rounded-full">
                <a href="#draw">Go to the draw</a>
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="grid gap-5 p-6 md:grid-cols-2 md:p-10">
              <Field id="name" label="Your name" required error={errors.name}>
                <Input id="name" value={values.name} onChange={set('name')} autoComplete="name" placeholder="e.g. Anna Petrosyan" aria-invalid={!!errors.name} maxLength={80} />
              </Field>
              <Field id="email" label="Email address" required error={errors.email} hint="For your personal code and draw notification. Never shown publicly.">
                <Input id="email" type="email" value={values.email} onChange={set('email')} autoComplete="email" placeholder="you@company.com" aria-invalid={!!errors.email} maxLength={200} />
              </Field>
              <Field id="wishlist" label="Gift ideas / wishlist" required error={errors.wishlist} wide>
                <Textarea id="wishlist" rows={4} value={values.wishlist} onChange={set('wishlist')} placeholder="A cozy scarf, a good mystery novel, fancy hot chocolate…" aria-invalid={!!errors.wishlist} maxLength={2000} />
              </Field>
              <Field id="links" label="Links to desired products" wide>
                <Textarea id="links" rows={2} value={values.links} onChange={set('links')} placeholder="One link per line" maxLength={2000} />
              </Field>
              <Field id="dislikes" label="Things I don't like or want">
                <Textarea id="dislikes" rows={3} value={values.dislikes} onChange={set('dislikes')} placeholder="No scented candles, please!" maxLength={1000} />
              </Field>
              <Field id="hobbies" label="Hobbies & interests">
                <Textarea id="hobbies" rows={3} value={values.hobbies} onChange={set('hobbies')} placeholder="Hiking, board games, baking…" maxLength={1000} />
              </Field>
              <Field id="sizes" label="Clothing or other sizes" wide>
                <Input id="sizes" value={values.sizes} onChange={set('sizes')} placeholder="T-shirt M, socks 38–40, ring size 7" maxLength={500} />
              </Field>

              <div className="md:col-span-2">
                {formError && (
                  <p role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                    {formError}
                  </p>
                )}
                <Button type="submit" size="lg" disabled={pending} className="h-13 w-full rounded-full text-base font-bold shadow-lg shadow-primary/25">
                  {pending ? <Loader2 className="animate-spin" /> : <Gift />}
                  Done! Submit My Wishlist
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  One registration per colleague — duplicate names and emails are blocked.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>

      <Dialog open={!!success} onOpenChange={(open) => !open && setSuccess(null)}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-pine">
              You're on the list, {success?.name}! 🎄
            </DialogTitle>
            <DialogDescription>
              Here's your personal Secret Santa code. You'll need it with your email to reveal
              your recipient once the draw opens.
              {success?.emailed ? ' We also emailed it to you.' : ' Please save it somewhere safe.'}
            </DialogDescription>
          </DialogHeader>
          <div className="my-2 rounded-2xl border-2 border-dashed border-primary/40 bg-muted p-5 text-center">
            <p className="font-mono text-3xl font-bold tracking-[0.3em] text-primary">{success?.code}</p>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => {
                if (!success) return
                navigator.clipboard
                  ?.writeText(success.code)
                  .then(() => toast.success('Code copied'))
                  .catch(() => toast.error('Could not copy — please write it down.'))
              }}
            >
              <Copy /> Copy code
            </Button>
            <Button className="rounded-full" onClick={() => setSuccess(null)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  wide,
  children,
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  hint?: string
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`grid gap-2 ${wide ? 'md:col-span-2' : ''}`}>
      <Label htmlFor={id} className="font-semibold text-pine">
        {label}
        {required ? <span className="text-primary">*</span> : <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
