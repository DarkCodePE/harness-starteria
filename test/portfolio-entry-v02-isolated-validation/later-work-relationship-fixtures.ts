import frozenConversion from '../../docs/portfolio-entry/testing/PORTFOLIO_ENTRY_CONVERSION_READINESS_FIXTURES_v0.1.json';

export type Relation = 'CURRENT_DECISION_BLOCKER' | 'CURRENT_DECISION_CONDITION' | 'LATER_WORK' | 'OPTIONAL_ENRICHMENT';
export type LaterWorkCase = { id: string; prompt: string; expected: Relation; currentDecisionComplete: boolean; item: string };

export const counterfactualRelation = (input: Pick<LaterWorkCase, 'currentDecisionComplete' | 'expected'>): Relation => input.currentDecisionComplete ? 'LATER_WORK' : input.expected;

const crAdv05 = frozenConversion.cases.find((item: { id: string }) => item.id === 'CR-ADV-05');
if (!crAdv05) throw new Error('Frozen CR-ADV-05 fixture is missing.');

export const cases: LaterWorkCase[] = [
  { id: 'CR-ADV-05', prompt: crAdv05.user_turns.join(' '), expected: 'LATER_WORK', currentDecisionComplete: true, item: 'elegir arquitectura y proveedor' },
  { id: 'LW-CTRL-01', prompt: 'La decisión de continuar ya está tomada. Falta diseñar la arquitectura.', expected: 'LATER_WORK', currentDecisionComplete: true, item: 'diseñar la arquitectura' },
  { id: 'LW-CTRL-02', prompt: 'Antes de decidir necesitamos demostrar que la arquitectura puede cumplir el requisito regulatorio obligatorio.', expected: 'CURRENT_DECISION_BLOCKER', currentDecisionComplete: false, item: 'demostrar cumplimiento regulatorio' },
  { id: 'LW-CTRL-03', prompt: 'Seguimos adelante; todavía falta seleccionar el proveedor, pero no hace falta para decidir si continuamos.', expected: 'LATER_WORK', currentDecisionComplete: true, item: 'seleccionar el proveedor' },
  { id: 'LW-CTRL-04', prompt: 'El coste del proveedor es necesario para saber si cabemos en el presupuesto aprobado y si podemos continuar.', expected: 'CURRENT_DECISION_CONDITION', currentDecisionComplete: false, item: 'confirmar el coste del proveedor' },
  { id: 'LW-CTRL-05', prompt: 'La iniciativa está aprobada. Falta diseñar el siguiente experimento.', expected: 'LATER_WORK', currentDecisionComplete: true, item: 'diseñar el siguiente experimento' },
];
