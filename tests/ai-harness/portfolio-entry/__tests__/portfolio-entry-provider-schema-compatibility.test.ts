import { describe, expect, it } from 'vitest';
import {
  findUnionBranchesWithoutType,
  findObjectSchemasWithoutClosedAdditionalProperties,
  portfolioEntryHandoffProviderJsonSchema,
  portfolioEntryTurnProviderJsonSchema,
  visitJsonSchema,
  type JsonSchema,
} from '../model/portfolio-entry-json-schemas';

describe('portfolio entry provider JSON schema compatibility', () => {
  it('closes every object schema in the Analysis Turn provider schema', () => {
    expect(findObjectSchemasWithoutClosedAdditionalProperties(portfolioEntryTurnProviderJsonSchema)).toEqual([]);
  });

  it('represents provider optionality with nullable required fields for Analysis Turn objects', () => {
    expect(findObjectsWithoutAllPropertiesRequired(portfolioEntryTurnProviderJsonSchema)).toEqual([]);
  });

  it('closes root and nested Analysis Turn objects required by OpenAI Structured Outputs', () => {
    expect(schemaAt(portfolioEntryTurnProviderJsonSchema, 'properties.analysis')).toMatchObject({ additionalProperties: false });
    expect(schemaAt(portfolioEntryTurnProviderJsonSchema, 'properties.question_plan')).toMatchObject({ additionalProperties: false });
    expect(schemaAt(portfolioEntryTurnProviderJsonSchema, 'properties.question_plan.properties.questions.items')).toMatchObject({ additionalProperties: false });
    expect(schemaAt(portfolioEntryTurnProviderJsonSchema, 'properties.analysis.properties.extracted_context')).toMatchObject({ additionalProperties: false });
  });

  it('keeps Analysis Turn contractual fields and enums represented in the provider schema', () => {
    expect(Object.keys(portfolioEntryTurnProviderJsonSchema.properties ?? {})).toEqual(['analysis', 'question_plan']);
    expect(enumAt(portfolioEntryTurnProviderJsonSchema, 'properties.analysis.properties.primary_intent')).toEqual([
      'strategic_goal',
      'portfolio_alignment',
      'portfolio_tracking',
      'portfolio_prioritization',
      'portfolio_reporting',
      'portfolio_governance',
      'initiative_governance',
      'unknown',
    ]);
    expect(enumAt(portfolioEntryTurnProviderJsonSchema, 'properties.analysis.properties.current_frame')).toEqual([
      'strategy_first',
      'portfolio_first',
      'initiative_first',
      'solution_first',
      'problem_first',
      'opportunity_first',
      'decision_first',
      'reporting_first',
      'unknown',
    ]);
    expect(Object.keys(schemaAt(portfolioEntryTurnProviderJsonSchema, 'properties.analysis').properties ?? {})).toEqual([
      'entry_id',
      'analysis_version',
      'primary_intent',
      'secondary_intents',
      'initial_entry_state',
      'current_frame',
      'extracted_context',
      'ambiguities',
      'contradictions',
      'reverse_alignment',
      'provenance',
      'status',
    ]);
  });

  it('does not emit invalid anyOf/oneOf branches in the Analysis Turn provider schema', () => {
    expect(findUnionBranchesWithoutType(portfolioEntryTurnProviderJsonSchema)).toEqual([]);
  });

  it('closes every object schema in the Handoff provider schema', () => {
    expect(findObjectSchemasWithoutClosedAdditionalProperties(portfolioEntryHandoffProviderJsonSchema)).toEqual([]);
  });

  it('represents decision_to_enable unresolved as a typed literal string branch', () => {
    expect(schemaAt(portfolioEntryHandoffProviderJsonSchema, 'properties.decision_to_enable.anyOf.1')).toEqual({
      type: 'string',
      const: 'unresolved',
    });
  });

  it('does not emit invalid anyOf/oneOf branches in the Handoff provider schema', () => {
    expect(findUnionBranchesWithoutType(portfolioEntryHandoffProviderJsonSchema)).toEqual([]);
  });

  it('represents provider optionality with nullable required fields for Handoff objects', () => {
    expect(findObjectsWithoutAllPropertiesRequired(portfolioEntryHandoffProviderJsonSchema)).toEqual([]);
  });

  it('closes Handoff root, SuggestedApproach, GapResolution, and provenance objects', () => {
    expect(portfolioEntryHandoffProviderJsonSchema).toMatchObject({ additionalProperties: false });
    expect(schemaAt(portfolioEntryHandoffProviderJsonSchema, 'properties.recommended_approach.anyOf.0')).toMatchObject({ additionalProperties: false });
    expect(schemaAt(portfolioEntryHandoffProviderJsonSchema, 'properties.gap_resolution_map.items')).toMatchObject({ additionalProperties: false });

    const provenanceObjectPaths: string[] = [];
    visitJsonSchema(portfolioEntryHandoffProviderJsonSchema, '$', (node, path) => {
      if (node.properties && 'origin' in node.properties && ('source_text' in node.properties || 'source_path' in node.properties)) {
        provenanceObjectPaths.push(path);
        expect(node.additionalProperties).toBe(false);
      }
    });
    expect(provenanceObjectPaths.length).toBeGreaterThan(0);
  });

  it('keeps Handoff contractual fields and enums represented in the provider schema', () => {
    expect(Object.keys(portfolioEntryHandoffProviderJsonSchema.properties ?? {})).toEqual([
      'understanding',
      'desired_outcome',
      'decision_to_enable',
      'recommended_approach',
      'alternative_approaches',
      'known_context',
      'unresolved_context',
      'gap_resolution_map',
      'evidence_or_clarity_needed',
      'starteria_path',
      'recommended_cta',
      'provenance_summary',
      'handoff_status',
    ]);
    expect(enumAt(portfolioEntryHandoffProviderJsonSchema, 'properties.gap_resolution_map.items.properties.resolution_type')).toEqual([
      'STARTERIA_CAN_STRUCTURE',
      'STARTERIA_CAN_GUIDE',
      'STARTERIA_CAN_TRACK',
      'REQUIRES_ORGANIZATIONAL_INPUT',
      'REQUIRES_EXTERNAL_EVIDENCE',
      'OUT_OF_SCOPE',
    ]);
    expect(enumAt(portfolioEntryHandoffProviderJsonSchema, 'properties.handoff_status')).toEqual([
      'ready',
      'ready_with_uncertainty',
      'insufficient_input',
    ]);
  });

  it('keeps nested nullable SuggestedApproach fields provider-compatible', () => {
    expect(schemaAt(portfolioEntryHandoffProviderJsonSchema, 'properties.recommended_approach.anyOf.0.properties.rationale.anyOf')).toEqual([
      { type: 'string', minLength: 1 },
      { type: 'null' },
    ]);
    expect(schemaAt(portfolioEntryHandoffProviderJsonSchema, 'properties.recommended_approach.anyOf.0.properties.assumption.anyOf')).toEqual([
      { type: 'string', minLength: 1 },
      { type: 'null' },
    ]);
    expect(schemaAt(portfolioEntryHandoffProviderJsonSchema, 'properties.recommended_approach.anyOf.0.properties.origin')).toEqual({
      type: 'string',
      const: 'AI_SUGGESTED',
    });
    expect(schemaAt(portfolioEntryHandoffProviderJsonSchema, 'properties.recommended_approach.anyOf.0.properties.review_disposition')).toEqual({
      type: 'string',
      const: 'UNREVIEWED',
    });
  });

  it('keeps nested GapResolution nullable fields provider-compatible', () => {
    expect(schemaAt(portfolioEntryHandoffProviderJsonSchema, 'properties.gap_resolution_map.items.properties.starteria_capability.anyOf')).toEqual([
      { type: 'string' },
      { type: 'null' },
    ]);
    expect(schemaAt(portfolioEntryHandoffProviderJsonSchema, 'properties.gap_resolution_map.items.properties.provenance.anyOf.0.properties.origin').type).toBe('string');
    expect(schemaAt(portfolioEntryHandoffProviderJsonSchema, 'properties.gap_resolution_map.items.properties.provenance.anyOf.1')).toEqual({ type: 'null' });
  });
});

function schemaAt(schema: JsonSchema, path: string): JsonSchema {
  return path.split('.').reduce<JsonSchema>((current, segment) => {
    if (segment === 'properties' || segment === 'anyOf') return current[segment] as unknown as JsonSchema;
    if (segment === 'items') return current.items as JsonSchema;
    if (Array.isArray(current)) return current[Number(segment)] as JsonSchema;
    return (current as { [key: string]: JsonSchema })[segment];
  }, schema);
}

function enumAt(schema: JsonSchema, path: string): readonly string[] | undefined {
  return schemaAt(schema, path).enum;
}

function findObjectsWithoutAllPropertiesRequired(schema: JsonSchema): string[] {
  const failures: string[] = [];
  visitJsonSchema(schema, '$', (node, path) => {
    if (node.type !== 'object') return;
    const propertyNames = Object.keys(node.properties ?? {});
    const required = new Set(node.required ?? []);
    const missing = propertyNames.filter((propertyName) => !required.has(propertyName));
    if (missing.length > 0) failures.push(`${path}: ${missing.join(', ')}`);
  });
  return failures;
}
