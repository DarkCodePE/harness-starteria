# Copilot-first Pilot Data Handling

## Allowed Data

- Synthetic strategic front examples.
- Real business context explicitly authorized by the pilot organization.
- Non-sensitive operational descriptions needed to validate `CreateStrategicFront`.
- Anonymized pilot case identifiers such as `case-01`.

Confirmed allowed data: [PENDIENTE: datos permitidos por organizacion piloto].

## Prohibited Data

- Passwords, tokens, credentials or secrets.
- Personal data not required for the pilot.
- Health, financial, legal or regulated sensitive data unless formally approved.
- Contractual confidential information not authorized for the pilot.
- Names of real participants in repository documents unless explicitly approved.

## Stored Messages

Copilot messages are persisted in `CopilotMessage.content` for recovery and audit. Users must be told not to enter prohibited data.

## Logs And Analytics

Logs must use Copilot redaction helpers. Analytics dimensions may include environment, capability, status, general role, adapter, result type and anonymized pilot case. Do not use userId, organizationId, conversationId, names or message content as analytics tags.

## Access

Access is restricted by authentication, existing roles, organization scope and `COPILOT_ALLOWED_ORGANIZATION_IDS`.

## Retention

Retention, deletion and anonymization policy: [PENDIENTE: decision legal/organizacional].

Audit logs are preserved for operational traceability unless a formal deletion process applies.

## Evidence Export

Reports must avoid full conversation text. Use `front/scripts/pilot/generate-copilot-pilot-report.ts` for aggregate metrics and link detailed IDs only in internal evidence controlled by the pilot owner.

## UI Notice

Portfolio Copilot displays a pilot notice that:

- states it is a pilot version;
- tells users not to enter unauthorized sensitive data;
- requires review before approval;
- avoids presenting Copilot as an autonomous authority.

## Responsible Parties

- Data owner: [PENDIENTE]
- Security reviewer: [PENDIENTE]
- Pilot owner: [PENDIENTE]
- Technical owner: [PENDIENTE]

## Pending Decisions

- Approved real-data categories.
- Whether sessions are recorded.
- Consent wording.
- Retention period.
- Evidence storage location.
- Deletion or anonymization procedure after pilot.
