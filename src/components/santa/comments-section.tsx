import { useRouter } from '@tanstack/react-router'
import { Loader2, MessageCircleHeart, Send } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { CommentItem } from '@/lib/event'
import { addComment } from '@/server/santa.functions'
import { SectionHeading } from './section-heading'

const EMOJIS = ['🎄', '🎅', '❄️', '🎁', '⛄', '✨']
const AVATAR_COLORS = ['bg-primary', 'bg-secondary', 'bg-gold text-accent-foreground']

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} h ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function CommentsSection({ comments }: { comments: CommentItem[] }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !message.trim()) {
      toast.error('Please add your name and a message.')
      return
    }
    setPending(true)
    try {
      const res = await addComment({ data: { name, message } })
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      setMessage('')
      toast.success('Message posted! 🎄')
      await router.invalidate()
    } catch {
      toast.error('Could not post your message. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section id="comments" className="scroll-mt-6 px-5 py-20">
      <div className="mx-auto max-w-content">
        <SectionHeading eyebrow="Festive wall" title="Comments & cheer">
          Leave a suggestion, a budget idea, or just some holiday cheer for the team.
        </SectionHeading>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <form onSubmit={onSubmit} className="h-fit rounded-[2rem] border bg-card p-6 shadow-sm md:p-8 lg:sticky lg:top-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="comment-name" className="font-semibold text-pine">Your name</Label>
                <Input id="comment-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Anna" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="comment-message" className="font-semibold text-pine">Message</Label>
                <Textarea
                  id="comment-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                  placeholder="Can we set a €25 budget? 🎁"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setMessage((m) => (m + ' ' + emoji).trimStart())}
                        className="grid size-8 place-items-center rounded-full text-lg transition hover:scale-110 hover:bg-muted"
                        aria-label={`Add ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{message.length}/500</span>
                </div>
              </div>
              <Button type="submit" disabled={pending} className="rounded-full font-bold">
                {pending ? <Loader2 className="animate-spin" /> : <Send />}
                Post message
              </Button>
            </div>
          </form>

          <div>
            {comments.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-[2rem] border-2 border-dashed p-12 text-center text-muted-foreground">
                <MessageCircleHeart className="size-10 text-primary" />
                <p className="font-medium">No messages yet — be the first to spread some cheer!</p>
              </div>
            ) : (
              <ul className="grid gap-4">
                {comments.map((c) => (
                  <li key={c.id} className="flex gap-4 rounded-3xl border bg-card p-5 shadow-sm">
                    <span
                      className={`grid size-11 shrink-0 place-items-center rounded-full font-display text-lg font-bold text-primary-foreground ${AVATAR_COLORS[c.id % AVATAR_COLORS.length]}`}
                    >
                      {c.name.trim()[0]?.toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-bold text-pine">{c.name}</span>
                        <time dateTime={c.createdAt} className="text-xs text-muted-foreground" suppressHydrationWarning>
                          {timeAgo(c.createdAt)}
                        </time>
                      </p>
                      <p className="mt-1 break-words whitespace-pre-line text-foreground/90">{c.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
