import { createFileRoute } from '@tanstack/react-router'

import { CommentsSection } from '@/components/santa/comments-section'
import { DrawSection } from '@/components/santa/draw-section'
import { Hero } from '@/components/santa/hero'
import { ProgressSection } from '@/components/santa/progress-section'
import { WishlistForm } from '@/components/santa/wishlist-form'
import { getEventStatus, listComments } from '@/server/santa.functions'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [status, comments] = await Promise.all([getEventStatus(), listComments()])
    return { status, comments }
  },
  component: Home,
})

function Home() {
  const { status, comments } = Route.useLoaderData()
  return (
    <div className="min-h-screen">
      <Hero status={status} />
      <main>
        <WishlistForm status={status} />
        <ProgressSection status={status} />
        <DrawSection status={status} />
        <CommentsSection comments={comments} />
      </main>
      <footer className="bg-pine-deep px-5 py-10 text-center text-sm text-secondary-foreground/70">
        <p className="font-display text-lg text-secondary-foreground">
          Շնորհավոր Ամանոր և Սուրբ Ծնունդ։ Թող նվիրելը ուրախություն պարգևի։ 🎄
        </p>
        <p className="mt-1">
          Գաղտնի Ձմեռ Պապիկ 2026 · Ձեր ցանկությունների ցուցակը և ձեր զույգը ցուցադրվում են միայն ձեզ։
        </p>
      </footer>
    </div>
  )
}
