// Deterministic flake positions so server and client render the same markup.
const FLAKES = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37) % 100,
  size: 0.6 + ((i * 7) % 10) / 10,
  duration: 9 + ((i * 13) % 12),
  delay: -((i * 11) % 20),
  opacity: 0.35 + ((i * 5) % 6) / 10,
}))

export function Snowfall() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {FLAKES.map((f, i) => (
        <span
          key={i}
          className="snowflake"
          style={{
            left: `${f.left}%`,
            fontSize: `${f.size}rem`,
            opacity: f.opacity,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
          }}
        >
          ❄
        </span>
      ))}
    </div>
  )
}
