import {
  Link,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <main className="grid min-h-svh place-items-center px-6 py-16">
      <div className="max-w-md space-y-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Էջը չի գտնվել
        </h1>
        <p className="text-muted-foreground">
          Այս էջը գոյություն չունի։ Ստուգեք հասցեն կամ վերադարձեք գլխավոր էջ։
        </p>
        <Button asChild>
          <Link to="/">Գլխավոր էջ</Link>
        </Button>
      </div>
    </main>
  )
}

export function RouteErrorPage({ reset }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <main className="grid min-h-svh place-items-center px-6 py-16">
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Չհաջողվեց բեռնել էջը
        </h1>
        <p role="alert" className="text-muted-foreground">
          Խնդրում ենք փորձել կրկին կամ վերադառնալ գլխավոր էջ։
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={() => {
              void router.invalidate()
              reset()
            }}
          >
            Փորձել կրկին
          </Button>
          <Button variant="outline" asChild>
            <a href="/">Գլխավոր էջ</a>
          </Button>
        </div>
      </div>
    </main>
  )
}
