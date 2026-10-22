// Best-effort email via Resend. Silently skipped when RESEND_API_KEY or
// EMAIL_FROM are not configured, so the site works without an email provider.
export function emailEnabled() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

export async function sendEmail(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, text }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) console.error('Email send failed with status', res.status)
    return res.ok
  } catch (error) {
    console.error('Email send failed', error)
    return false
  }
}
