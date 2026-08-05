# PRD-09 — Piloto Cálidda y validación de producto/TI

## 1. Metadata

| Campo | Valor |
|---|---|
| Producto | Starteria Platform |
| Tipo | PRD de validación / Design Partner |
| Versión | v0.2 Copilot-first |
| Estado | Propuesta de piloto |
| Cliente piloto | Cálidda — Área de Innovación |
| Usuarios principales | Director/Portfolio Lead, encargado principal de innovación, Initiative Owners |
| Validadores | TI, Sponsor/comité, áreas receptoras |
| Objetivo | Validar si Starteria mejora trazabilidad, readiness, decisiones y handoff de iniciativas reales antes de un despliegue enterprise |

## 2. Contexto observado

Cálidda cuenta con:

- un programa que capta y desarrolla iniciativas alineadas a objetivos u oportunidades;
- equipos que producen propuestas;
- un equipo core con iniciativas de impacto comercial y enfoque tipo venture building;
- comité que define valor e inversión;
- portafolio aproximado de 47 iniciativas, con 20 no activas;
- dolor principal en visibilidad de restricciones y handoff al área impactada;
- interés en análisis IA de impacto, preparación, probabilidad/confianza y siguientes pasos;
- TI como filtro previo a compra.

## 3. Hipótesis de valor

> Si Starteria conecta cada iniciativa con objetivo, KPI, evidencia, inversión, bloqueos, readiness y área receptora, el equipo de innovación podrá reducir el tiempo de diagnóstico, mejorar la calidad de las decisiones y aumentar la proporción de iniciativas que llegan preparadas a implementación.

## 4. Caso de uso prioritario

No validar todo Starteria simultáneamente.

Punta de lanza:

> **Importar → alinear → entender estado/bloqueos → evaluar readiness → recomendar → generar Brief para decisión.**

El core Step 0–4 se muestra como profundidad metodológica y regularización, no como reemplazo del programa Renergy.

## 5. Alcance del piloto

### Muestra

8–12 iniciativas:

- 3–4 originadas en Renergy;
- 3–4 del equipo core/venture building;
- 2–4 bloqueadas, inactivas o en handoff;
- una con dependencia relevante de TI;
- diferentes niveles de madurez.

### Contexto estratégico

- 1–2 frentes;
- 2–4 retos;
- KPI o señales disponibles;
- áreas receptoras distintas.

### Roles

- 1 Portfolio Lead;
- 1 encargado funcional de producto/proceso;
- 3–6 Initiative Owners;
- 1 representante TI;
- 1–2 sponsors/comité como viewers o validadores;
- 1–2 representantes de áreas receptoras.

## 6. Flujo del piloto

### Etapa 1 — Preparación

- seleccionar iniciativas;
- acordar confidencialidad;
- identificar fuentes;
- documentar marco estratégico mínimo;
- definir criterios de éxito.

### Etapa 2 — Importación y clasificación

- cargar Excel/CSV/texto/documentos;
- extraer iniciativas;
- proponer frentes/retos;
- detectar granularidad;
- confirmar mapeos;
- publicar portafolio piloto.

### Etapa 3 — Reconstrucción y diagnóstico

- estimar Step 0–4;
- identificar evidencia;
- detectar gaps;
- registrar KPI/baseline/meta;
- clasificar bloqueos;
- asignar actor requerido.

### Etapa 4 — Readiness y valor

- evaluar preparación para implementar;
- identificar área receptora y owners;
- registrar inversión disponible;
- distinguir impacto estimado/validado/realizado;
- crear condiciones de handoff.

### Etapa 5 — Recomendación y comité simulado/real

- generar recomendación IA;
- validar con encargado de innovación;
- generar Decision & Implementation Brief;
- evaluar utilidad para una conversación real.

### Etapa 6 — Cierre de validación

- medir resultados;
- identificar gaps de producto;
- revisar seguridad/TI;
- decidir Go, piloto extendido o No-Go/Iterar.

## 7. Pantallas/prototipos requeridos

1. Home Portfolio Lead.
2. Configuración estratégica mínima.
3. Importar iniciativas.
4. Resultado de análisis.
5. Bandeja de clasificación.
6. Vista de frente/reto.
7. Detalle ejecutivo de iniciativa.
8. Bloqueos y actor requerido.
9. Readiness assessment.
10. Recomendación IA.
11. Decision & Implementation Brief.

No es necesario que toda automatización esté productiva para validar el journey; las partes concierge deben estar identificadas.

## 8. Información mínima por iniciativa

- nombre;
- resumen;
- origen;
- owner;
- objetivo/reto;
- KPI o señal;
- estado;
- inversión conocida;
- evidencia;
- resultado;
- bloqueo;
- área receptora;
- siguiente decisión.

La falta de datos es un hallazgo del piloto, no causa automática de exclusión.

## 9. Métricas de éxito

### North Star del piloto

> % de iniciativas analizadas que llegan a una decisión sustentada y cuentan con condiciones claras para implementar, continuar o cerrar.

### Métricas operativas

- tiempo para identificar bloqueo y actor;
- tiempo para preparar reporte;
- % con frente/reto confirmado;
- % con KPI, baseline y meta;
- % con área receptora y owner;
- % con readiness evaluado;
- % con siguiente acción y responsable;
- % de recomendaciones consideradas útiles;
- tasa de corrección de clasificación IA;
- reducción percibida de trabajo manual.

### Métricas cualitativas

- ¿el reporte se usaría en comité?;
- ¿el readiness representa el proceso real?;
- ¿las recomendaciones son defendibles?;
- ¿qué información faltaría para confiar?;
- ¿qué parte reemplaza trabajo actual?;
- ¿qué parte no usarían?

## 10. Criterios Go / No-Go

### Go

- usan o usarían el Brief en una conversación real;
- identifican decisiones más rápido;
- readiness revela condiciones no visibles;
- clasificación y bloqueos son comprensibles;
- al menos un área receptora reconoce utilidad en handoff;
- TI no identifica una brecha insalvable;
- existe sponsor para piloto extendido.

### Iterar

- se percibe como formulario adicional;
- la IA es genérica o no sustentada;
- el portafolio no mejora decisiones;
- los datos mínimos no están disponibles y el costo de obtenerlos es excesivo;
- el handoff no se adapta a la operación;
- seguridad/arquitectura requiere cambios alcanzables.

### No-Go temporal

- no existe owner del proceso;
- no se puede usar ningún dato real;
- no hay caso de comité o decisión;
- TI prohíbe el enfoque técnico sin alternativa viable;
- la organización solo busca gestión de tareas.

## 11. Validación con encargado principal

Usar tres casos en sesión profunda:

1. Renergy que termina en propuesta.
2. Equipo core con impacto comercial.
3. Bloqueada o en handoff.

Preguntas:

- ¿qué información existe?;
- ¿qué falta?;
- ¿quién actualiza?;
- ¿el estado reconstruido es correcto?;
- ¿el bloqueo está bien clasificado?;
- ¿el readiness representa la realidad?;
- ¿la recomendación coincide o desafía útilmente su juicio?;
- ¿el Brief sirve al comité?

## 12. Paquete para TI

### Arquitectura

- diagrama de componentes;
- frontend/backend;
- base de datos;
- storage;
- servicios IA;
- ambientes;
- dependencias de terceros.

### Datos

- tipos de datos procesados;
- datos sensibles;
- flujo y residencia;
- retención;
- eliminación;
- exportación;
- backups;
- logs.

### Seguridad

- autenticación;
- RBAC;
- tenant isolation;
- cifrado en tránsito/reposo;
- URLs firmadas;
- secretos;
- gestión de vulnerabilidades;
- auditoría;
- respuesta a incidentes.

### IA

- proveedor/modelo;
- uso de datos para entrenamiento;
- prompts;
- filtros;
- modo confidencial/no full-content;
- trazabilidad;
- intervención humana;
- limitaciones.

### Enterprise roadmap

- SSO;
- SCIM si aplica;
- integración con repositorios;
- conectores;
- SLA;
- observabilidad;
- recuperación;
- pentest.

La documentación debe diferenciar:

- disponible;
- parcialmente implementado;
- workaround del piloto;
- roadmap;
- fuera de alcance.

## 13. Requerimientos del piloto

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-CAL-001 | Trabajar con iniciativas reales o suficientemente anonimizadas | MUST |
| RF-CAL-002 | Incluir Renergy y equipo core | MUST |
| RF-CAL-003 | Incluir una iniciativa con dependencia TI | MUST |
| RF-CAL-004 | Validar reportabilidad para comité | MUST |
| RF-CAL-005 | Medir tiempo y utilidad antes/después | MUST |
| RF-CAL-006 | Registrar correcciones a la IA | MUST |
| RF-CAL-007 | Entregar matriz de seguridad/capacidades | MUST |
| RF-CAL-008 | No prometer funciones no implementadas | MUST |
| RF-CAL-009 | Separar trabajo automatizado de concierge | MUST |
| RF-CAL-010 | Definir decisión de cierre del piloto | MUST |

## 14. Entregables

1. Portafolio piloto clasificado.
2. Mapa frente → reto → iniciativas.
3. Diagnóstico de datos y gaps.
4. Taxonomía de bloqueos validada.
5. Readiness de iniciativas seleccionadas.
6. Recomendaciones IA revisadas.
7. Decision & Implementation Briefs.
8. Informe de resultados del piloto.
9. Backlog priorizado de ajustes.
10. Dossier técnico y respuestas TI.
11. Recomendación Go/No-Go para despliegue extendido.

## 15. Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| datos incompletos | tratar faltantes como resultado y usar fuentes confirmadas |
| IA clasifica mal | bandeja y confirmación humana |
| alcance demasiado grande | limitar a 8–12 iniciativas |
| parecer otro gestor | enfocar decisiones, readiness y handoff |
| TI bloquea por madurez | transparencia, modo piloto y roadmap explícito |
| no hay tiempo de usuarios | sesiones sobre casos seleccionados y outputs preprocesados |
| confusión con Renergy | posicionar Starteria como capa posterior y transversal, no reemplazo |

## 16. Integración con la arquitectura Copilot-first

El piloto debe validar no solo pantallas aisladas, sino la secuencia:

```text
Portfolio Lead describe una necesidad o carga información
→ Copiloto interpreta
→ propone Action Plan
→ usuario corrige/aprueba
→ motores de importación, scope, readiness y decisión ejecutan
→ dashboard refleja el resultado
→ Copiloto comunica siguiente acción
```

### Casos obligatorios

1. Importar un conjunto de iniciativas desde conversación.
2. Detectar una iniciativa demasiado amplia y proponer descomposición.
3. Consultar bloqueos del portafolio.
4. Evaluar readiness de una iniciativa.
5. Preparar un Brief para decisión.
6. Corregir o rechazar una recomendación IA.
7. Verificar que una acción aprobada aparece en la sección correcta.

### Métricas adicionales

- % de Action Plans comprendidos sin explicación externa;
- tasa de corrección de intención;
- tasa de aprobación total/parcial;
- tasa de ejecución fallida o parcial;
- correspondencia conversación–dashboard;
- confianza para usar el Copiloto con datos reales.

