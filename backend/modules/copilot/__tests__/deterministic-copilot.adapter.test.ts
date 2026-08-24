import { describe, expect, it } from 'vitest';
import { DeterministicCopilotAdapter } from '../application/deterministic-copilot.adapter';

const adapter = new DeterministicCopilotAdapter();

function assess(content: string) {
  return adapter.assess({
    conversationId: 'conv1',
    messageId: 'msg1',
    content,
    organizationId: 'org1',
    userId: 'user1',
  });
}

describe('DeterministicCopilotAdapter', () => {
  it('extrae un mensaje completo sin ejecutar comandos', async () => {
    const result = await assess(
      'Crea un frente llamado Eficiencia operativa. Su objetivo es reducir el retrabajo en procesos internos. El KPI principal sera horas de retrabajo al mes, con baseline 500, meta 300, horizonte de 6 meses, area de Operaciones, prioridad alta y sponsor Gerencia de Operaciones.',
    );

    expect(result.primaryIntent).toBe('create_strategic_front');
    expect(result.operation).toBe('create');
    expect(result.recommendedCapabilities).toEqual(['CreateStrategicFront']);
    expect(result.confidence).toBe('high');
    expect(result.sourceReferences).toEqual([{ type: 'message', id: 'msg1', label: 'Mensaje del usuario' }]);
    expect(result.proposedPayload).toMatchObject({
      organizationId: 'org1',
      name: 'Eficiencia operativa',
      objective: 'reducir el retrabajo en procesos internos',
      mainKpi: 'horas de retrabajo al mes',
      baseline: '500',
      target: '300',
      horizon: '6 meses',
      areaOrBusinessUnit: 'Operaciones',
      priority: 'Alta',
      sponsor: 'Gerencia de Operaciones',
      createdBy: 'user1',
    });
  });

  it('no inventa campos cuando el mensaje esta incompleto', async () => {
    const result = await assess('Quiero crear un frente de eficiencia operativa.');

    expect(result.primaryIntent).toBe('create_strategic_front');
    expect(result.recommendedCapabilities).toEqual(['CreateStrategicFront']);
    expect(result.missingInformation).toEqual([
      'objective',
      'mainKpi',
      'baseline',
      'target',
      'horizon',
      'areaOrBusinessUnit',
      'priority',
    ]);
    expect(result.proposedPayload).toBeUndefined();
    expect(JSON.stringify(result.detectedEntities)).not.toContain('KPI');
  });

  it('devuelve unknown para mensajes fuera del fixture', async () => {
    const result = await assess('Necesito revisar bloqueos de TI.');

    expect(result.primaryIntent).toBe('unknown');
    expect(result.operation).toBe('unsupported');
    expect(result.confidence).toBe('low');
    expect(result.recommendedCapabilities).toEqual([]);
    expect(result.proposedPayload).toBeUndefined();
  });

  it('expone version estable del adapter', () => {
    expect(adapter.adapterType).toBe('deterministic');
    expect(adapter.version).toBe('deterministic-portfolio-copilot-session.v2');
  });

  it('no entra en bucle cuando objetivo y KPI llegan en el segundo turno', async () => {
    const first = await adapter.assess({
      conversationId: 'conv1',
      messageId: 'msg1',
      content: 'Quiero crear el frente Eficiencia operativa',
      organizationId: 'org1',
      userId: 'user1',
    });

    expect(first.primaryIntent).toBe('create_strategic_front');
    expect(first.detectedEntities.name).toBe('Eficiencia operativa');
    expect(first.assistantMessage.toLowerCase()).toContain('objetivo');

    const second = await adapter.assess({
      conversationId: 'conv1',
      messageId: 'msg2',
      content: [
        'Quiero crear el frente Eficiencia operativa',
        'Optimizar el proceso de postventa de los productos, nuestro KPI es % de equipos no devueltos por fallas de preentrega',
      ].join('\n'),
      organizationId: 'org1',
      userId: 'user1',
      previousAssessment: {
        id: 'ia1',
        conversationId: 'conv1',
        originalMessageId: 'msg1',
        primaryIntent: first.primaryIntent,
        operation: first.operation,
        detectedEntities: first.detectedEntities,
        ambiguousObjects: first.ambiguousObjects,
        missingInformation: first.missingInformation,
        recommendedCapabilities: first.recommendedCapabilities,
        confidence: first.confidence,
        sourceReferences: first.sourceReferences,
        adapterType: 'deterministic',
        rubricVersion: first.rubricVersion,
        createdAt: new Date('2026-07-29T12:00:00Z'),
      },
    });
    const session = second.detectedEntities.portfolioCopilotSession as {
      collectedFields: Record<string, unknown>;
      fieldSources: Record<string, { sourceMessageId: string }>;
      missingRequiredFields: string[];
    };

    expect(session.collectedFields.objective).toBe('Optimizar el proceso de postventa de los productos');
    expect(session.collectedFields.mainKpi).toBe('% de equipos no devueltos por fallas de preentrega');
    expect(session.fieldSources.objective.sourceMessageId).toBe('msg2');
    expect(session.fieldSources.mainKpi.sourceMessageId).toBe('msg2');
    expect(session.missingRequiredFields).not.toContain('objective');
    expect(session.missingRequiredFields).not.toContain('mainKpi');
    expect(second.assistantMessage.toLowerCase()).not.toContain('objetivo');
    expect(second.assistantMessage.toLowerCase()).not.toContain('kpi principal');
    expect(second.assistantMessage.toLowerCase()).toContain('valor actual');
  });
});
