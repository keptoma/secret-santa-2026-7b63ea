import nodemailer, { type Transporter } from "nodemailer";

// Best-effort email through a Gmail account over SMTP. Silently skipped when
// GMAIL_USER or GMAIL_APP_PASSWORD are not configured, so the site works
// without email.
export function emailEnabled() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

let transporter: Transporter | null = null;

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  transporter ??= nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass: pass.replace(/\s+/g, "") },
    connectionTimeout: 10_000,
    socketTimeout: 10_000,
  });
  return transporter;
}

export async function sendEmail(to: string, subject: string, text: string) {
  const mailer = getTransporter();
  if (!mailer) return false;
  try {
    await mailer.sendMail({
      from: `"Secret Santa 🎅" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
    });
    return true;
  } catch (error) {
    console.error("Email send failed", error);
    return false;
  }
}
