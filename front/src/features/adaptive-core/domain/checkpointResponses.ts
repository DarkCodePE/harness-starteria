/**
 * Fuente de verdad del recorrido adaptativo (PRD-03 §17).
 *
 * Las paginas de Step nacieron con su propio formulario y, cuando se añadieron los
 * checkpoints, la pagina siguio siendo la duena del dato: construia las variables del
 * checkpoint raspando el formulario en cada render. Eso dejaba dos capturas del mismo
 * dato y dos contadores de avance que podian contradecirse.
 *
 * Aqui la direccion queda invertida: manda la respuesta confirmada del checkpoint y el
 * formulario legacy solo rellena lo que el recorrido todavia no respondio. Las funciones
 * son puras a proposito para que cada Step las reutilice igual.
 */

/** Una variable cuenta como respondida solo si trae contenido real. */
export function hasCheckpointAnswer(value: unknown): boolean {
  return typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined;
}

/**
 * Fusiona las respuestas confirmadas con la semilla derivada del formulario legacy.
 * La semilla NO pisa nunca una respuesta del checkpoint: solo cubre huecos, que es lo que
 * permite migrar iniciativas creadas antes del core adaptativo sin perder su contenido.
 */
export function mergeCheckpointResponses(
  confirmed: Record<string, unknown>,
  legacySeed: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...confirmed };
  for (const [variable, seeded] of Object.entries(legacySeed)) {
    if (!hasCheckpointAnswer(merged[variable])) merged[variable] = seeded;
  }
  return merged;
}

/**
 * Proyecta las respuestas del checkpoint sobre los campos del formulario legacy, para que
 * las secciones antiguas sean una VISTA del recorrido en vez de una segunda captura.
 *
 * Solo devuelve entradas con respuesta real; las variables sin responder se omiten para
 * no borrar lo que la persona ya haya escrito en el formulario.
 */
export function projectCheckpointResponsesToFields<TField extends string>(
  confirmed: Record<string, unknown>,
  variableToField: Record<string, TField>,
): Array<readonly [TField, string]> {
  return Object.entries(variableToField)
    .filter(([variable]) => hasCheckpointAnswer(confirmed[variable]))
    .map(([variable, field]) => [field, String(confirmed[variable])] as const);
}
