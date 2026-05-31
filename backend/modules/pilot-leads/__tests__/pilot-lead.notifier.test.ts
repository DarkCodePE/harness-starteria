/**
 * Tests for the pilot-lead email notifier (issue #54).
 *
 * The notifier is built around an injected Mailer + recipient list, so these
 * stay hermetic (no real SMTP). Locks:
 *   - emails the configured recipients with the lead's contact in the body
 *   - degrades to NO send when the mailer is disabled or recipients are empty
 *   - rethrows transport errors (the service's fire-and-forget guard swallows them)
 */
import { describe, it, expect, vi } from 'vitest';
import {
  createEmailPilotLeadNotifier,
  createApplicantConfirmationNotifier,
  combinePilotLeadNotifiers,
} from '../pilot-lead.notifier';
import type { Mailer } from '../../../shared/mail/mailer';
import type { PilotLeadNotice } from '../pilot-lead.service';

const LEAD: PilotLeadNotice = {
  id: 'lead-1',
  pilotCode: 'ST-PILOT-AB12',
  draftId: 'draft-1',
  name: 'Ana Rodríguez',
  email: 'ana@example.com',
  phone: '+51 999 888 777',
  organization: 'Efectiva',
};

function fakeMailer(enabled: boolean, send = vi.fn(async () => true)): Mailer {
  return { get enabled() { return enabled; }, send } as Mailer;
}

describe('createEmailPilotLeadNotifier', () => {
  it('emails the configured recipients with the lead contact in the body', async () => {
    const send = vi.fn(async () => true);
    const notify = createEmailPilotLeadNotifier({ to: ['team@efectiva.com.pe'], mailer: fakeMailer(true, send) });

    await notify(LEAD);

    expect(send).toHaveBeenCalledTimes(1);
    const msg = send.mock.calls[0][0];
    expect(msg.to).toEqual(['team@efectiva.com.pe']);
    expect(msg.subject).toContain('ST-PILOT-AB12');
    expect(msg.text).toContain('ana@example.com');
    expect(msg.text).toContain('Ana Rodríguez');
    expect(msg.text).toContain('+51 999 888 777');
    expect(msg.html).toContain('mailto:ana@example.com');
  });

  it('does not send when the mailer is disabled', async () => {
    const send = vi.fn(async () => true);
    const notify = createEmailPilotLeadNotifier({ to: ['team@efectiva.com.pe'], mailer: fakeMailer(false, send) });

    await notify(LEAD);

    expect(send).not.toHaveBeenCalled();
  });

  it('does not send when no recipients are configured', async () => {
    const send = vi.fn(async () => true);
    const notify = createEmailPilotLeadNotifier({ to: [], mailer: fakeMailer(true, send) });

    await notify(LEAD);

    expect(send).not.toHaveBeenCalled();
  });

  it('rethrows a transport error (the service guard swallows it)', async () => {
    const send = vi.fn(async () => { throw new Error('SMTP down'); });
    const notify = createEmailPilotLeadNotifier({ to: ['team@efectiva.com.pe'], mailer: fakeMailer(true, send) });

    await expect(notify(LEAD)).rejects.toThrow('SMTP down');
  });
});

describe('createApplicantConfirmationNotifier', () => {
  it('emails the applicant a confirmation with their pilot code', async () => {
    const send = vi.fn(async () => true);
    const notify = createApplicantConfirmationNotifier({ mailer: fakeMailer(true, send) });

    await notify(LEAD);

    expect(send).toHaveBeenCalledTimes(1);
    const msg = send.mock.calls[0][0];
    expect(msg.to).toBe('ana@example.com');
    expect(msg.subject).toContain('ST-PILOT-AB12');
    expect(msg.text).toContain('Ana Rodríguez');
    expect(msg.text).toContain('ST-PILOT-AB12');
    // The applicant confirmation must NOT leak internal ids/draft.
    expect(msg.text).not.toContain('lead-1');
    expect(msg.text).not.toContain('draft-1');
  });

  it('does not send when the mailer is disabled', async () => {
    const send = vi.fn(async () => true);
    const notify = createApplicantConfirmationNotifier({ mailer: fakeMailer(false, send) });

    await notify(LEAD);

    expect(send).not.toHaveBeenCalled();
  });
});

describe('combinePilotLeadNotifiers', () => {
  it('runs every notifier even when one throws (isolated, never rethrows)', async () => {
    const a = vi.fn(async () => { throw new Error('boom'); });
    const b = vi.fn(async () => undefined);
    const notify = combinePilotLeadNotifiers(a, b);

    await expect(notify(LEAD)).resolves.toBeUndefined();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('sends both team and applicant emails on a healthy mailer', async () => {
    const send = vi.fn(async () => true);
    const mailer = fakeMailer(true, send);
    const notify = combinePilotLeadNotifiers(
      createEmailPilotLeadNotifier({ to: ['team@efectiva.com.pe'], mailer }),
      createApplicantConfirmationNotifier({ mailer }),
    );

    await notify(LEAD);

    expect(send).toHaveBeenCalledTimes(2);
    const recipients = send.mock.calls.map((c) => c[0].to);
    expect(recipients).toContainEqual(['team@efectiva.com.pe']);
    expect(recipients).toContainEqual('ana@example.com');
  });
});
