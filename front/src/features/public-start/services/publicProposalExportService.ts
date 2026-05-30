import type { PublicDraft } from '../domain/types';
import { inferPublicDraftNarrative } from './publicDraftService';

function line(value: string | undefined, fallback = 'Pendiente por completar.') {
  return value?.trim() || fallback;
}

function list(items: string[]) {
  return items.length > 0 ? items.map(item => `- ${item}`).join('\n') : '- Sin elementos críticos por ahora.';
}

export function buildPublicProposalMarkdown(draft: PublicDraft): string {
  const output = draft.aiOutput;
  const narrative = inferPublicDraftNarrative(draft.inputText, output);
  return [
    `# ${narrative.title}`,
    '',
    '_Propuesta preliminar. No representa evidencia validada ni aprobación._',
    '',
    `**Foco:** ${narrative.focus}`,
    '',
    '## Resumen claro',
    narrative.summary,
    '',
    '## Situación actual',
    line(output.whatToMove, narrative.currentSituation),
    '',
    '## Por qué importa',
    line(output.whyNow, narrative.whyMatters),
    '',
    '## A quién impacta',
    line(output.impactedAudience, narrative.audience),
    '',
    '## Hipótesis inicial',
    narrative.hypothesis,
    '',
    '## Qué te hace pensar que esto importa',
    line(output.initialEvidence, narrative.signal),
    '',
    '## Qué falta aclarar',
    list(narrative.validationItems),
    '',
    '## Primer paso recomendado',
    narrative.nextStep,
    '',
    '## Cómo seguir en Starteria',
    'Puedes convertir este borrador en una iniciativa dentro de Starteria para profundizar el contexto, ordenar señales, definir prioridades, identificar responsables y preparar una ruta de acción.',
    '',
    '_Documento generado desde el modo público de Starteria. Úsalo para conversar, validar y decidir si conviene llevar la iniciativa a Starteria._',
  ].join('\n');
}

export function downloadPublicProposal(draft: PublicDraft): void {
  const markdown = buildPublicProposalMarkdown(draft);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const narrative = inferPublicDraftNarrative(draft.inputText, draft.aiOutput);
  const filenameBase = narrative.title
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
