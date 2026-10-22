export function SectionHeading({
  eyebrow,
  title,
  children,
  light = false,
}: {
  eyebrow: string
  title: string
  children?: React.ReactNode
  light?: boolean
}) {
  return (
    <div className="mx-auto mb-10 max-w-2xl text-center">
      <p
        className={`mb-3 text-xs font-bold tracking-[0.25em] uppercase ${light ? 'text-gold' : 'text-primary'}`}
      >
        {eyebrow}
      </p>
      <h2
        className={`text-3xl font-black tracking-tight md:text-5xl ${light ? 'text-secondary-foreground' : 'text-pine'}`}
      >
        {title}
      </h2>
      {children && (
        <p
          className={`mt-4 text-base md:text-lg ${light ? 'text-secondary-foreground/75' : 'text-muted-foreground'}`}
        >
          {children}
        </p>
      )}
    </div>
  )
}
