/**
 * Thin SMTP mail transport (nodemailer) wired from config.
 *
 * Lazily creates a single shared transport on first send. When SMTP is not
 * configured (no `SMTP_HOST`) the mailer reports `enabled: false` so callers can
 * degrade gracefully (e.g. log instead of send) — this is the dev default and
 * keeps tests/CI hermetic without any SMTP server.
 */
import nodemailer, { type Transporter } from 'nodemailer';
import { config } from '../../config';
import { logger } from '../utils/logger';

export interface MailMessage {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
}

export interface Mailer {
  /** Whether an SMTP transport is configured (host + from address present). */
  readonly enabled: boolean;
  /** Send a message. Resolves to false (and logs) when the mailer is disabled. */
  send(message: MailMessage): Promise<boolean>;
}

let cachedTransport: Transporter | null = null;

function getTransport(): Transporter {
  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user
        ? { user: config.smtp.user, pass: config.smtp.pass }
        : undefined,
    });
  }
  return cachedTransport;
}

/** The process-wide mailer, backed by config-driven SMTP. */
export const mailer: Mailer = {
  get enabled(): boolean {
    return Boolean(config.smtp.host && config.smtp.from);
  },

  async send(message: MailMessage): Promise<boolean> {
    if (!this.enabled) {
      logger.warn({ subject: message.subject }, 'Mailer disabled (SMTP not configured) — email not sent');
      return false;
    }
    await getTransport().sendMail({
      from: config.smtp.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return true;
  },
};

/** Test seam: reset the cached transport between suites. */
export function __resetMailerTransportForTests(): void {
  cachedTransport = null;
}
