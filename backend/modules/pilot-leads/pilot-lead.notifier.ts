/**
 * Pilot-lead notifier (issue #54): emails the team when a new lead is captured.
 *
 * The notification email is actionable — it carries the lead's contact details
 * so a human can follow up directly (the consented purpose). The accompanying
 * log line, by contrast, stays PII-free (ids/metadata only), preserving the
 * privacy-by-design stance of the AuditLog.
 *
 * Degrades gracefully: when SMTP is not configured (dev/test) or no recipients
 * are set, it logs the capture (non-PII) instead of sending. Sending is
 * fire-and-forget at the call site, so a transport failure never fails the
 * user's submit — we still log the error here for observability.
 */
import { config } from '../../config';
import { logger } from '../../shared/utils/logger';
import { mailer, type Mailer } from '../../shared/mail/mailer';
import type { PilotLeadNotice, PilotLeadNotifier } from './pilot-lead.service';

function buildEmail(lead: PilotLeadNotice): { subject: string; text: string; html: string } {
  const org = lead.organization ?? '—';
  const phone = lead.phone ?? '—';
  const subject = `Nuevo pilot lead · ${lead.pilotCode}${lead.organization ? ` · ${lead.organization}` : ''}`;

  const text = [
    'Se registró un nuevo interés en el piloto de Starteria.',
    '',
    `Código:        ${lead.pilotCode}`,
    `Nombre:        ${lead.name}`,
    `Correo:        ${lead.email}`,
    `Teléfono:      ${phone}`,
    `Organización:  ${org}`,
    '',
    `ID interno:    ${lead.id}`,
    `Draft:         ${lead.draftId}`,
  ].join('\n');

  const esc = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = `
    <h2>Nuevo pilot lead</h2>
    <p>Se registró un nuevo interés en el piloto de Starteria.</p>
    <table cellpadding="4" style="border-collapse:collapse">
      <tr><td><strong>Código</strong></td><td>${esc(lead.pilotCode)}</td></tr>
      <tr><td><strong>Nombre</strong></td><td>${esc(lead.name)}</td></tr>
      <tr><td><strong>Correo</strong></td><td><a href="mailto:${esc(lead.email)}">${esc(lead.email)}</a></td></tr>
      <tr><td><strong>Teléfono</strong></td><td>${esc(phone)}</td></tr>
      <tr><td><strong>Organización</strong></td><td>${esc(org)}</td></tr>
    </table>
    <p style="color:#888;font-size:12px">ID interno: ${esc(lead.id)} · Draft: ${esc(lead.draftId)}</p>
  `.trim();

  return { subject, text, html };
}

export interface EmailNotifierOptions {
  /** Recipient list (defaults to config.pilotLeadNotifyTo). */
  to?: string[];
  /** Mailer to use (defaults to the shared SMTP mailer). DI for tests. */
  mailer?: Mailer;
}

/**
 * Build a notifier that emails the team. Falls back to a non-PII log line when
 * the mailer is disabled or no recipients are configured.
 */
export function createEmailPilotLeadNotifier(options: EmailNotifierOptions = {}): PilotLeadNotifier {
  const to = options.to ?? config.pilotLeadNotifyTo;
  const transport = options.mailer ?? mailer;

  return async (lead: PilotLeadNotice): Promise<void> => {
    // Non-PII log line for every capture — safe to keep in aggregated logs.
    logger.info(
      { pilotLeadId: lead.id, pilotCode: lead.pilotCode, draftId: lead.draftId },
      'New pilot lead captured',
    );

    if (!transport.enabled || to.length === 0) {
      logger.warn(
        { pilotLeadId: lead.id, recipients: to.length, mailerEnabled: transport.enabled },
        'Pilot lead notification not emailed (mailer disabled or no recipients configured)',
      );
      return;
    }

    const { subject, text, html } = buildEmail(lead);
    try {
      await transport.send({ to, subject, text, html });
      logger.info({ pilotLeadId: lead.id, recipients: to.length }, 'Pilot lead notification emailed');
    } catch (err) {
      // Logged (no PII) but not rethrown beyond the service's fire-and-forget guard.
      logger.error({ pilotLeadId: lead.id, err }, 'Failed to email pilot lead notification');
      throw err;
    }
  };
}
