import type { PublicDraft } from '../domain/types';

function line(value: string | undefined, fallback = 'Pendiente por completar.') {
  return value?.trim() || fallback;
}

function list(items: string[]) {
  return items.length > 0 ? items.map(item => `- ${item}`).join('\n') : '- Sin elementos críticos por ahora.';
}

function challengeTypeLabel(value: PublicDraft['aiOutput']['suggestedChallengeType']) {
  switch (value) {
    case 'growth':
      return 'Crecimiento';
    case 'exploration':
      return 'Exploración';
    case 'correction':
    default:
      return 'Corrección';
  }
}

export function buildPublicProposalMarkdown(draft: PublicDraft): string {
  const output = draft.aiOutput;
  return [
    `# ${line(output.proposalTitle, 'Propuesta de iniciativa')}`,
    '',
    '## Resumen',
    `- Qué quiere mover: ${line(output.whatToMove)}`,
    `- A quién impacta: ${line(output.impactedAudience)}`,
    `- Por qué importa ahora: ${line(output.whyNow)}`,
    `- Respaldo inicial: ${line(output.initialEvidence, 'Aún falta documentar evidencia o señales iniciales.')}`,
    `- Apoyo o decisión requerida: ${line([output.supportNeeded, output.decisionRequested].filter(Boolean).join(' '))}`,
    '',
    '## Propuesta estructurada',
    `### Qué quiere mover\n${line(output.whatToMove)}`,
    '',
    `### Por qué importa ahora\n${line(output.whyNow)}`,
    '',
    `### A quién impacta\n${line(output.impactedAudience)}`,
    '',
    `### Evidencia o respaldo inicial\n${line(output.initialEvidence, 'Aún falta documentar evidencia o señales iniciales.')}`,
    '',
    `### Stakeholder sugerido\n${line(output.suggestedStakeholder)}`,
    '',
    `### Apoyo o decisión requerida\n${line([output.supportNeeded, output.decisionRequested].filter(Boolean).join(' '))}`,
    '',
    `### Tipo de reto sugerido\n${challengeTypeLabel(output.suggestedChallengeType)}`,
    '',
    `### KPI o señal sugerida\n${line(output.suggestedKpiOrSignal)}`,
    '',
    '## Faltantes recomendados',
    list(output.missingCriticalFields),
    '',
    '## Riesgos o supuestos',
    list(output.risks),
    '',
    '## Siguiente acción',
    line(output.nextRecommendedAction),
    '',
    '_Documento generado desde el modo público de Starteria. Esta propuesta no representa evidencia validada ni aprobación._',
  ].join('\n');
}

export function downloadPublicProposal(draft: PublicDraft): void {
  const markdown = buildPublicProposalMarkdown(draft);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const filenameBase = (draft.aiOutput.proposalTitle || 'propuesta-starteria')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 70) || 'propuesta-starteria';

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${filenameBase}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}
