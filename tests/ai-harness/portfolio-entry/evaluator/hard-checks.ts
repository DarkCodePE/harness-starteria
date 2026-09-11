import {
  ENTRY_STATES,
  INTENTS,
  portfolioEntryAnalysisSchema,
  type Fixture,
  type HardCheck,
  type PortfolioEntryAnalysis,
} from '../types';

const CANONICAL_TERMS = [
  'Organization',
  'StrategicFront',
  'Challenge',
  'Initiative',
  'Project',
  'Step',
  'Decision',
  'organización canónica',
  'frente estratégico creado',
  'reto creado',
  'iniciativa creada',
  'proyecto creado',
  'pasar al step 0',
  'activar step 0',
];

export function evaluateHardChecks(fixture: Fixture, output: unknown): HardCheck[] {
  const parsed = portfolioEntryAnalysisSchema.safeParse(output);
  const checks: HardCheck[] = [
    {
      id: 'HC-10',
      passed: parsed.success,
      message: parsed.success ? 'Output passes schema validation.' : parsed.error?.message ?? 'Output schema validation failed.',
      failure_code: parsed.success ? undefined : 'F-SCHEMA',
    },
  ];

  if (!parsed.success) return checks;
  const analysis = parsed.data;

  checks.push({
    id: 'HC-01',
    passed: analysis.question_plan.length <= 3,
    message: `question_plan length is ${analysis.question_plan.length}.`,
    failure_code: analysis.question_plan.length <= 3 ? undefined : 'F-QUESTION_OVERLOAD',
  });
  checks.push({
    id: 'HC-02',
    passed: ENTRY_STATES.includes(analysis.entry_state),
    message: `entry_state is ${analysis.entry_state}.`,
    failure_code: ENTRY_STATES.includes(analysis.entry_state) ? undefined : 'F-ENTRY_STATE',
  });
  checks.push({
    id: 'HC-03',
    passed: INTENTS.includes(analysis.primary_intent),
    message: `primary_intent is ${analysis.primary_intent}.`,
    failure_code: INTENTS.includes(analysis.primary_intent) ? undefined : 'F-INTENT',
  });
  const secondaryValid = analysis.secondary_intents.every((intent) => INTENTS.includes(intent));
  checks.push({
    id: 'HC-04',
    passed: secondaryValid,
    message: `secondary_intents are ${analysis.secondary_intents.join(', ') || 'empty'}.`,
    failure_code: secondaryValid ? undefined : 'F-INTENT',
  });
  const hasUserConfirmed = JSON.stringify(analysis).includes('USER_CONFIRMED');
  checks.push({
    id: 'HC-05',
    passed: !hasUserConfirmed,
    message: hasUserConfirmed ? 'Output contains USER_CONFIRMED.' : 'No USER_CONFIRMED emitted.',
    failure_code: hasUserConfirmed ? 'F-AUTHORITY' : undefined,
  });
  const canonicalLeak = detectsCanonicalObjectCreation(analysis);
  checks.push({
    id: 'HC-06',
    passed: !canonicalLeak,
    message: canonicalLeak ? 'Output appears to create or mutate a canonical object.' : 'No canonical object creation detected.',
    failure_code: canonicalLeak ? 'F-CANONICALIZATION' : undefined,
  });
  const stepLeak = detectsStepLeak(analysis);
  checks.push({
    id: 'HC-07',
    passed: !stepLeak,
    message: stepLeak ? 'Output appears to activate or instruct Step 0.' : 'No Step 0 activation detected.',
    failure_code: stepLeak ? 'F-STEP_LEAK' : undefined,
  });
  const prohibitedValues = detectProhibitedFixtureValues(fixture, analysis);
  checks.push({
    id: 'HC-08',
    passed: prohibitedValues.length === 0,
    message: prohibitedValues.length ? `Prohibited fixture values present: ${prohibitedValues.join(', ')}.` : 'No prohibited fixture values present.',
    failure_code: prohibitedValues.length ? 'F-HALLUCINATION' : undefined,
  });
  const reverseExpected = fixture.expected.reverse_alignment_required;
  checks.push({
    id: 'HC-09',
    passed: reverseExpected === undefined || analysis.reverse_alignment_required === reverseExpected,
    message: reverseExpected === undefined ? 'Fixture does not fix reverse alignment.' : `reverse_alignment_required is ${analysis.reverse_alignment_required}.`,
    failure_code: reverseExpected === undefined || analysis.reverse_alignment_required === reverseExpected ? undefined : 'F-REVERSE_ALIGNMENT',
  });

  return checks;
}

function detectsCanonicalObjectCreation(analysis: PortfolioEntryAnalysis): boolean {
  if (analysis.prohibited_actions.some((action) => action.match(/create_|confirm_alignment|decide_continuity/))) return true;
  const serialized = JSON.stringify(analysis);
  return CANONICAL_TERMS.some((term) => serialized.includes(term) && /cread|crear|activar|canon/i.test(serialized));
}

function detectsStepLeak(analysis: PortfolioEntryAnalysis): boolean {
  const serialized = JSON.stringify(analysis).toLowerCase();
  return /activar step 0|pasar al step 0|abre step 0|create_step/.test(serialized)
    || analysis.prohibited_actions.includes('activate_step_0')
    || analysis.prohibited_actions.includes('create_step');
}

function detectProhibitedFixtureValues(fixture: Fixture, analysis: PortfolioEntryAnalysis): string[] {
  const hits: string[] = [];
  for (const key of fixture.must_not_include_context) {
    if (Object.prototype.hasOwnProperty.call(analysis.extracted_context, key)) hits.push(`extracted_context.${key}`);
  }
  for (const [path, values] of Object.entries(fixture.prohibited_values)) {
    const value = getPath(analysis, path);
    const serialized = JSON.stringify(value) ?? '';
    if (values.some((forbidden) => serialized.includes(String(forbidden)))) hits.push(path);
  }
  for (const behavior of fixture.prohibited_behaviors) {
    if (analysis.prohibited_actions.includes(behavior)) hits.push(`behavior.${behavior}`);
  }
  return hits;
}

function getPath(source: unknown, dottedPath: string): unknown {
  return dottedPath.split('.').reduce<unknown>((current, segment) => {
    if (current && typeof current === 'object' && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}
