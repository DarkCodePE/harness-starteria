/**
 * ADR-026 (IRC-04, decisión 2): catálogo determinista de dudas para el chat del asistente.
 *
 * v1 responde dudas frecuentes (tipos de reto, secciones del análisis, ruta de steps) por
 * coincidencia de palabras clave, sin LLM. Si nada coincide, devuelve null y el orquestador
 * ofrece agregar el texto como contexto o marcarlo como duda para el sponsor. v2 (endpoint
 * de chat con LLM) reemplazará esta capa sin cambiar el contrato del resto.
 */

interface FaqEntry {
  keywords: string[];
  answer: string;
}

const FAQ: FaqEntry[] = [
  {
    keywords: ['correccion', 'corrección', 'correction'],
    answer:
      'Un reto de tipo Corrección busca reducir una fricción o ineficiencia que ya existe: el objetivo es arreglar algo que hoy no funciona bien, no capturar una oportunidad nueva.',
  },
  {
    keywords: ['crecimiento', 'growth'],
    answer:
      'Un reto de tipo Crecimiento busca capturar una oportunidad de negocio o de adopción: apuntas a ganar algo nuevo (usuarios, ingresos, mercado), no solo a corregir un problema.',
  },
  {
    keywords: ['exploracion', 'exploración', 'exploration'],
    answer:
      'Un reto de tipo Exploración busca reducir incertidumbre antes de comprometer recursos: sirve cuando aún no sabes si la idea es viable y necesitas evidencia para decidir.',
  },
  {
    keywords: ['mirada critica', 'mirada crítica', 'critica', 'crítica', 'riesgo', 'debil', 'débil'],
    answer:
      'La Mirada crítica resume lo sólido, lo débil, lo riesgoso y lo que conviene ajustar de tu propuesta. No es un veredicto: es para que decidas con los ojos abiertos antes de invertir esfuerzo.',
  },
  {
    keywords: ['pregunta', 'preguntas', 'estrategica', 'estratégica'],
    answer:
      'Las preguntas estratégicas apuntan a la mayor incertidumbre de tu iniciativa. Puedes responderlas aquí en el chat o en el panel; si no lo sabes aún, márcalo y lo retomamos en el Step 0.',
  },
  {
    keywords: ['version mejorada', 'versión mejorada', 'mejorada', 'propuesta'],
    answer:
      'La Versión mejorada es una reescritura de tu iniciativa con nombre, foco e impacto esperado más claros. Es una sugerencia editable, no reemplaza tu propuesta original.',
  },
  {
    keywords: ['ruta', 'step', 'steps', 'paso', 'pasos'],
    answer:
      'La ruta Step 0-4 es el camino sugerido: Step 0 ordena el contexto, Step 1 valida el foco, Step 2 diseña la apuesta, Step 3 prueba y aprende, y Step 4 presenta la propuesta al sponsor.',
  },
  {
    keywords: ['snapshot', 'contexto de empresa', 'empresa'],
    answer:
      'El contexto de empresa se toma como un snapshot versionado al confirmar la ruta. Lo que agregas aquí ajusta este análisis, pero no actualiza el contexto de empresa: eso se hace en la sección de empresas.',
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // quita acentos para robustez del match
}

/**
 * Devuelve la respuesta del catálogo para una duda, o null si nada coincide.
 * Determinista: mismo texto → misma respuesta.
 */
export function answerDoubt(text: string): string | null {
  const n = normalize(text);
  for (const entry of FAQ) {
    if (entry.keywords.some((k) => n.includes(normalize(k)))) return entry.answer;
  }
  return null;
}

export const FAQ_FALLBACK =
  'No tengo una respuesta directa a eso. Si es información sobre tu iniciativa, cámbiate a "Agregar contexto" y la incorporo al análisis; si es una duda para tu sponsor, anótala para el Step 0.';
