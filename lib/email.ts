/**
 * Minimal transactional email sender.
 *
 * Uses Resend's REST API when RESEND_API_KEY and EMAIL_FROM are configured.
 * Falls back to structured console logging otherwise (keeps local dev and
 * preview deploys usable without credentials).
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

export type EmailResult = {
  sent: boolean;
  provider: 'resend' | 'console';
  error?: string;
};

/** Address that receives contact-form submissions. */
export function getAdminEmail(): string | null {
  return process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || null;
}

function isConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  if (!isConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      // Never print message bodies in production logs.
      console.error(
        '[email] RESEND_API_KEY/EMAIL_FROM not configured — message NOT delivered',
        { to: message.to, subject: message.subject }
      );
    } else {
      console.log('[email:console]', {
        to: message.to,
        subject: message.subject,
        replyTo: message.replyTo,
        text: message.text,
      });
    }
    return { sent: false, provider: 'console' };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Resend responded ${response.status}: ${detail.slice(0, 300)}`);
    }

    return { sent: true, provider: 'resend' };
  } catch (error) {
    const message_ = error instanceof Error ? error.message : String(error);
    console.error('[email] send failed', {
      to: message.to,
      subject: message.subject,
      error: message_,
    });
    return { sent: false, provider: 'resend', error: message_ };
  }
}
