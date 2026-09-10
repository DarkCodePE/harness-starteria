# Starteria — Contrato de Lógica Core para el MVP
**Versión:** v0.2  
**Estado:** Base fundacional revisada / Por validar  
**Alcance:** Portfolio Lead + Core de Iniciativas + Interacción con IA + Gobernanza del conocimiento  
**Propósito:** Congelar la arquitectura mínima de negocio y razonamiento que debería permanecer estable mientras se iteran la UI, los prompts, las skills y los detalles de implementación. Esta versión incorpora explícitamente contexto de empresa/aplicación, propagación de cambios del Reto, clarificación de Step 2 y continuidad para iniciativas independientes.


## Cambios principales de v0.2

Esta versión incorpora las siguientes precisiones sobre v0.1:

- El **Contexto de Organización / Contexto de Aplicación** se vuelve una capa transversal que puede moldear Portfolio Lead e iniciativas, sin convertirse automáticamente en una verdad interna de la empresa.
- Se aclara cómo aparecen **impacto realizado (L5)** e **impacto atribuido (L6)** después de Step 4 mediante seguimiento de beneficios vinculado a la iniciativa.
- Se aclara que `Organización` es un **contenedor contextual**, no una fase del journey; el Frente Estratégico contiene explícitamente el resultado que se quiere mover.
- Se define qué significa **versionar cambios críticos** y cómo se propagan sin sobrescribir trabajo existente.
- Para MVP se unifican conceptualmente **Sponsor / Responsable del Reto** como un único rol de interacción ligera, manteniendo configurable la autoridad de decisión.
- Los cambios materiales del alcance del Reto disparan revisión de alineamiento en las iniciativas relacionadas; no reescriben automáticamente sus ciclos activos.
- Step 2 se redefine como el momento de **diseñar/preparar/construir el entregable ejecutable** que será confrontado con la realidad en Step 3, junto con su plan de medición.
- Se separa **Ruta de Desarrollo** de **Ruta de Continuidad** y se aclara que las iniciativas independientes utilizan el mismo Adaptive Core, pero pueden tener alternativas de continuidad diferentes después de Step 4.

---

## 0. Cómo leer este documento

Este documento no es una especificación de pantallas ni un PRD de una funcionalidad particular.

Es el **contrato lógico** que se encuentra debajo de Starteria.

Su función es diferenciar:

- qué debería permanecer estable para el MVP;
- qué todavía puede experimentar cambios;
- cómo ingresa la información a Starteria;
- qué puede y qué no puede inferir Starteria;
- cómo se estructura y gobierna el conocimiento;
- cómo se relacionan Portfolio Lead y el Core de Iniciativas;
- cómo funciona Step 0–4 sin convertirse en una metodología rígida;
- cómo se justifican evidencia, impacto y decisiones;
- qué debe validar una persona;
- cómo la nueva información modifica conclusiones anteriores;
- qué debe probarse antes de cambiar la lógica de negocio.

Cuando un futuro PRD, skill, prompt, pantalla o agente entre en conflicto con un **Invariante Core** de este documento, el conflicto debe hacerse explícito y resolverse mediante un registro de decisión de arquitectura o negocio antes de implementarse.

---

# 1. Identidad de Starteria

Starteria es un sistema que ayuda a las organizaciones a transformar intención estratégica en iniciativas que puedan:

1. ser encuadradas con suficiente claridad;
2. desarrollarse mediante un proceso adaptativo pero gobernado;
3. conectarse con evidencia;
4. evaluarse frente a la contribución y valor esperados;
5. compararse a nivel de portafolio;
6. convertirse en decisiones humanas explícitas;
7. reutilizarse como conocimiento organizacional.

Starteria no es únicamente:

- un formulario de ideas;
- un gestor de proyectos;
- un chatbot;
- un wizard metodológico;
- un canvas de innovación;
- un repositorio de documentos;
- una IA que decide qué debe hacer la organización.

Starteria combina **espacios de trabajo estructurados + asistencia de IA + gobernanza de evidencia + lógica de decisión de portafolio**.

---

# 2. Tesis Core del producto

> Starteria debe ayudar a una organización a saber qué quiere mover, qué trabajo ha activado para moverlo, qué evidencia está generando ese trabajo, qué valor puede realmente sostenerse y qué decisión debería tomarse después.

A nivel de iniciativa:

> Starteria debe ayudar a un equipo a saber qué intenta conseguir en el ciclo actual, qué conoce, qué permanece incierto, qué acción está justificada, qué ocurrió y qué decisión habilita la evidencia.

A nivel de aprendizaje organizacional:

> Cuanto más utiliza una organización Starteria, más contexto confirmado, evidencia, decisiones y aprendizajes reutilizables acumula para futuras iniciativas.

---

# 3. Invariantes Core — MVP

Las siguientes reglas se consideran **fundacionales**. No deberían cambiar mediante iteraciones ordinarias de prompts o UI.

## INV-01 — Estrategia y ejecución son capas diferentes

Portfolio Lead gobierna la conexión:

```text
Intención estratégica
→ Frente Estratégico
→ Reto
→ Iniciativa
→ Evidencia / Impacto
→ Decisión
```

El Core de Iniciativas gobierna cómo se desarrolla una iniciativa individual.

Una capa no reemplaza a la otra.

---

## INV-02 — Toda iniciativa corporativa debe tener un estado explícito de alineamiento

Una iniciativa dentro de un portafolio corporativo puede estar temporalmente:

- alineada;
- parcialmente alineada;
- pendiente de alineamiento;
- no alineada;
- fuera de prioridad actual.

Starteria no debe inferir silenciosamente el alineamiento estratégico.

Un Portfolio Lead o una persona autorizada confirma el alineamiento estratégico cuando sea materialmente relevante.

Las iniciativas independientes o públicas pueden existir sin un Frente Estratégico o Reto corporativo.

---

## INV-03 — La IA propone; las personas conservan la autoridad organizacional

La IA puede:

- extraer;
- organizar;
- inferir;
- comparar;
- sugerir;
- criticar;
- calcular;
- identificar vacíos;
- recomendar alternativas.

La IA no decide autónomamente:

- aprobar un Frente Estratégico;
- aprobar un Reto;
- decidir inversión de portafolio;
- declarar evidencia como validada cuando falta un validador humano requerido;
- afirmar atribución organizacional sin evidencia suficiente;
- ejecutar una decisión de sponsor o de portafolio.

---

## INV-04 — El chat es un canal de interacción, no el sistema de registro oficial

La conversación puede utilizarse para:

- expresar ambigüedad;
- subir contexto;
- hacer preguntas;
- explicar cambios;
- revisar interpretaciones de IA.

Pero el estado confirmado debe vivir en objetos estructurados y versionados.

La información importante no debe quedar disponible únicamente dentro del historial de chat.

---

## INV-05 — Los claims materiales requieren procedencia

Para cada afirmación material que Starteria utilice en un análisis, el sistema debe poder responder:

- ¿Qué se está afirmando?
- ¿Quién o qué es la fuente?
- ¿Es explícito, extraído, inferido o sugerido?
- ¿Qué evidencia lo respalda?
- ¿Cuándo fue creado u observado?
- ¿Fue confirmado por una persona cuando la confirmación era requerida?

Un resumen generado por IA no se convierte automáticamente en fuente de verdad.

---

## INV-06 — Step 0–4 son funciones estables, no formularios fijos

Las cinco funciones de los Steps permanecen estables.

La ruta puede adaptar:

- preguntas;
- nombres;
- outputs;
- evidencia requerida;
- validadores;
- ejemplos;
- gates.

Starteria no debe forzar todas las iniciativas al mismo canvas, artefacto o tipo de experimento.

---

## INV-07 — Los Steps no tienen duraciones fijas

Starteria no asume:

```text
Step 0 = un mes
Step 1 = un mes
...
```

La unidad de planificación es un **ciclo de iniciativa orientado a habilitar una decisión**, operando dentro de un marco conocido de restricciones.

La duración de cada Step depende de:

- madurez de la iniciativa;
- incertidumbre;
- evidencia ya disponible;
- complejidad;
- dependencias;
- capacidad de recursos;
- fecha límite del Reto;
- decisión que debe habilitarse.

---

## INV-08 — Las restricciones del Reto son heredadas por las iniciativas

Un Reto puede establecer:

- resultado deseado;
- KPI / señal;
- horizonte;
- capacidad disponible;
- presupuesto cuando se conozca;
- restricciones;
- urgencia;
- fecha esperada de decisión;
- sponsor / Challenge Owner.

Una iniciativa asociada al Reto hereda este contexto.

Step 0 puede refinar el alcance de su ciclo, pero no puede ignorar el marco de restricciones heredado sin hacer explícito el conflicto.

---

## INV-09 — Suficiencia no equivale a completar formularios

Un Step es suficiente cuando existe suficiente información confiable, evidencia y ownership para habilitar responsablemente la transición o decisión que ese Step debe desbloquear.

Conceptualmente:

```text
STEP SUFFICIENT =
variables críticas resueltas
+ output mínimo existente
+ evidencia requerida satisfecha
+ coherencia con el contexto canónico actual
+ validador requerido confirmado
+ cero hard gates abiertos
```

Los soft gaps pueden permanecer visibles sin bloquear el avance.

---

## INV-10 — La nueva información no elimina la historia

Cuando cambia información:

- se conserva el estado anterior;
- se registra el nuevo estado;
- se identifica la fuente o razón del cambio;
- los outputs dependientes se marcan como `requires_review` cuando corresponda.

No se sobrescribe silenciosamente la historia.

---

## INV-11 — Las iniciativas importadas utilizan gating retroactivo

El trabajo existente puede contener información equivalente a Step 3 mientras Step 1 continúa incompleto.

Starteria debe:

- conservar el contenido existente;
- reconstruir lo que ya se conoce;
- mostrar vacíos críticos;
- evitar obligar al usuario a rehacer trabajo válido solo para satisfacer una secuencia estética.

---

## INV-12 — La realización del beneficio puede continuar después de Step 4

Step 4 puede cerrar el **ciclo de desarrollo** antes de que el valor de negocio a largo plazo sea completamente observable.

Por tanto:

```text
Desarrollo de iniciativa
→ Step 4 / Decision Package
→ Decisión humana
→ Implementación / continuidad
→ Seguimiento de beneficios
```

La iniciativa no necesita permanecer abierta en Step 4 durante meses. En su lugar, Starteria mantiene un objeto de **Benefit Tracking** vinculado a la iniciativa y a la decisión que autorizó su continuidad.

La información puede incorporarse posteriormente mediante:

- actualización manual de métricas;
- carga de reportes de Operaciones/Finanzas;
- nueva evidencia adjunta;
- revisión periódica del owner;
- conectores externos cuando existan.

Para promover un claim a **L5 REALIZED**, Starteria debe contar con un resultado observado en operación y una fuente trazable.

Para promoverlo a **L6 ATTRIBUTED**, además debe existir un método de atribución defendible y el validador requerido.

Ejemplo:

```text
Mayo — Step 4
Efecto operativo validado: -27% tiempo manual
Ahorro anual estimado: €81k
Decisión: implementar

Septiembre — Benefit Tracking
Ahorro observado en operación: €32k → L5 REALIZED

Diciembre — revisión de atribución
€24k pueden vincularse razonablemente a la iniciativa → L6 ATTRIBUTED
```

---

## INV-13 — El contexto de empresa/aplicación es transversal al razonamiento

Starteria debe poder comprender el contexto de la empresa, unidad, mercado o entorno donde una iniciativa pretende generar valor.

Este contexto puede provenir de:

- información declarada por el usuario;
- documentos internos;
- página web;
- LinkedIn u otras fuentes públicas;
- documentación de procesos, capacidades, arquitectura o políticas;
- contexto ya confirmado dentro de Starteria.

El contexto puede modificar:

- lenguaje y framing;
- factibilidad;
- restricciones;
- propuesta de alcance;
- riesgos;
- dependencias;
- ruta recomendada;
- opciones de solución o validación.

Pero una fuente pública no debe convertirse silenciosamente en conocimiento interno. Por ejemplo, una web corporativa puede sustentar qué productos ofrece la empresa, pero no prueba por sí sola su presupuesto, prioridad interna, capacidad técnica o problema operativo.

En modo corporativo existe un **Contexto de Organización**.

En una iniciativa independiente que pretende aplicarse a una empresa concreta puede existir un **Contexto de Aplicación / Organización Objetivo**.

En una iniciativa independiente sin empresa objetivo, este contexto puede estar ausente.

---

# 4.
---

# 4. Qué es estable y qué es experimental

## 4.1 Estable para el MVP

- La capa Portfolio y la capa Initiative son diferentes, pero están conectadas.
- El **Contexto de Organización** es un contenedor transversal en modo corporativo; no es una fase que el usuario deba completar antes de empezar.
- El modelo de alineamiento corporativo es `Frente Estratégico → Reto → Iniciativa`, operando dentro de un Contexto de Organización.
- Todo Frente Estratégico contiene explícitamente el **resultado que busca mover**, su KPI/señal y, cuando estén disponibles, baseline, target y horizonte.
- Step 0–4 mantienen cinco funciones permanentes.
- La información debe preservar procedencia.
- Las sugerencias de IA se distinguen de la información confirmada.
- La autoridad humana es explícita.
- La suficiencia y los gates controlan transiciones importantes.
- Los **cambios materiales preservan versión e historial**; no se sobrescriben silenciosamente.
- Los cambios materiales del Reto pueden disparar revisión en iniciativas relacionadas.
- Las iniciativas existentes pueden importarse y reconstruirse.
- El impacto no puede afirmarse sin un estado de evidencia.
- Los ciclos de iniciativa están orientados a decisiones, no a duraciones fijas de Steps.
- Los beneficios de largo plazo pueden seguirse después del ciclo de desarrollo.
- Las iniciativas independientes utilizan el mismo Adaptive Core; su contexto de gobernanza y sus alternativas de continuidad pueden diferir.

### Aclaración sobre `Organización`

`Organización` no significa un Step adicional ni que siempre deba existir un onboarding corporativo completo. Representa el contexto donde vive el portafolio.

Conceptualmente:

```text
CONTEXTO DE ORGANIZACIÓN
        │
        └── moldea estrategia, restricciones, capacidades y lenguaje
             │
             ▼
      FRENTE ESTRATÉGICO
      ├── resultado deseado
      ├── KPI / señal
      ├── baseline
      ├── target
      └── horizonte
             ↓
            RETO
             ↓
         INICIATIVA
```

Para el MVP no se crea un objeto separado llamado `Resultado Estratégico` mientras el resultado pueda representarse sin ambigüedad dentro del Frente Estratégico. Si futuros tests muestran que un Frente necesita múltiples resultados independientes, esa separación deberá decidirse explícitamente.

## 4.2 Experimental / ajustable

Lo siguiente puede cambiar mediante pruebas sin redefinir todo el modelo de negocio:

- límites exactos entre skills/agentes;
- si el routing es un agente independiente o una skill dentro de otro agente;
- layout exacto de pantallas;
- cantidad y orden de tarjetas;
- wording y copy UX;
- si una pregunta aparece en chat o UI estructurada;
- texto exacto de prompts;
- umbrales exactos de scoring;
- forma de mostrar confidence;
- cantidad de preguntas antes de un checkpoint;
- nombres internos de servicios;
- nombres exactos de artefactos de salida;
- si una skill se reutiliza en varios Steps;
- arquitectura exacta de implementación del Copilot.

---

# 5. Roles y autoridad

| Rol | Responsabilidad principal | Autoridad típica | Interacción MVP |
|---|---|---|---|
| Portfolio Lead | Gobernar el portafolio estratégico | Confirmar frentes, estructurar portafolio, revisar cobertura y conducir decisiones | Alta / recurrente |
| Sponsor / Responsable del Reto | Representar el contexto y respaldo del Reto | Confirmar contexto cuando corresponda; comentar; participar en reuniones; eventualmente decidir si posee autoridad configurada | Ligera / por evento |
| Initiative Owner | Desarrollar la iniciativa | Ejecutar trabajo, aportar evidencia, gestionar equipo y proponer recomendaciones | Alta / recurrente |
| Mentor | Calidad metodológica | Revisar razonamiento/evidencia cuando sea requerido | Por checkpoint |
| Admin | Supervisión de plataforma/programa | Gobernanza, acceso, configuración y monitoreo | Administrativa |
| IA | Asistencia | Sin autoridad de decisión organizacional | Transversal |

## 5.1 Sponsor vs. Challenge Owner en el MVP

Conceptualmente existen dos funciones distintas:

- **sponsorship**: respaldo, autoridad, recursos o decisión;
- **challenge ownership**: conocimiento y responsabilidad contextual sobre el Reto.

Sin embargo, para el MVP no es necesario obligar a la organización a administrar dos roles separados si en la práctica la misma persona cumple ambas funciones o su interacción es ligera.

La experiencia puede presentarlos como un solo rol: **Sponsor / Responsable del Reto**.

Su interacción P0 puede limitarse a:

- revisar información de las iniciativas vinculadas;
- dejar comentarios;
- solicitar/agendar conversación con el equipo;
- confirmar/corregir contexto cuando se requiera;
- participar en una decisión únicamente cuando tenga autoridad explícita.

Internamente Starteria debería conservar la posibilidad de diferenciar `context_owner` y `decision_authority` sin obligar a mostrar dos personas distintas en UI. Esto permite separar los roles en el futuro sin cambiar el modelo lógico.

La autoridad debe asociarse a un tipo de decisión, no suponerse únicamente por acceso al sistema.

---

# 6.
---

# 6. Arquitectura de interacción

Starteria debe permitir múltiples canales de entrada, pero hacerlos converger hacia un único estado gobernado.

```text
USUARIO / ORGANIZACIÓN
│
├── Conversación / Copilot
├── Tarjetas / formularios estructurados
├── Carga de archivos
├── Importación de portafolio
├── Registro de métricas
└── Conectores externos [futuro]
        │
        ▼
INGESTA DE CONTEXTO Y EVIDENCIA
        │
        ▼
EXTRACCIÓN / INTERPRETACIÓN IA
        │
        ▼
PROPUESTA ESTRUCTURADA
        │
        ├── confirmada
        ├── corregida
        ├── rechazada
        └── requiere aclaración
        │
        ▼
CONTEXTO CANÓNICO
        │
        ▼
Razonamiento Portfolio / Step / Decisión
```

## 6.1 Principio

> Entrada flexible, estado estructurado.

El usuario no debería tener que traducir manualmente cada documento o pensamiento a campos de base de datos.

Starteria puede asistir en la extracción, pero debe mostrar qué entendió antes de que la información crítica se vuelva canónica.

---

# 7. Contexto canónico

Cada objeto relevante del dominio tiene un **estado canónico actual** más su historial.

Ejemplos:

- Contexto de Organización / Aplicación
- Contexto del Frente Estratégico
- Contexto del Reto
- Master Context de la Iniciativa
- Contexto del Ciclo Actual
- Contexto de Decisión

El contexto canónico no equivale a “el último resumen generado por IA”.

Contiene únicamente información con estado de gobernanza explícito.

## 7.1 Contexto de Organización / Contexto de Aplicación

Starteria puede crear progresivamente un contexto que ayude a interpretar qué es razonable, relevante o viable para una empresa concreta.

Variables candidatas:

```text
OrganizationContext
├── identidad / nombre
├── industria / categoría
├── modelo de negocio
├── productos / servicios
├── segmentos / clientes
├── geografías
├── propuesta de valor pública
├── prioridades estratégicas confirmadas
├── modelo operativo conocido
├── capacidades relevantes
├── herramientas / stack cuando esté confirmado
├── restricciones regulatorias / políticas
├── arquitectura / dependencias conocidas
├── métricas organizacionales confirmadas
├── fuentes[]
├── freshness / fecha de fuente
└── elementos pendientes de confirmación
```

### Jerarquía orientativa de autoridad

```text
corrección explícita del usuario / rol autorizado
> documento interno confirmado
> declaración directa del usuario
> fuente corporativa pública
> fuente pública externa
> inferencia IA
> sugerencia IA
```

Esta jerarquía puede variar por tipo de dato. Una página pública puede ser buena fuente para productos ofrecidos, pero mala fuente para prioridades internas, presupuesto o capacidades no publicadas.

### Freshness

El contexto empresarial puede caducar. Starteria debe conservar la fecha/fuente y permitir marcar información como:

- current;
- potentially_outdated;
- superseded;
- requires_confirmation.

### Uso en iniciativas independientes

Una iniciativa independiente puede:

- no tener empresa objetivo;
- estar pensada para la empresa del usuario;
- estar pensada para un cliente/empresa objetivo.

Cuando existe una organización objetivo, su contexto puede moldear Step 0–4 sin obligar a que la iniciativa pertenezca a un Reto corporativo.

## 7.2 Master Context de la Iniciativa

Conceptualmente:

```text
Iniciativa
├── identidad
├── contexto de aplicación / organización
├── alineamiento estratégico
├── contexto del Reto
├── propósito
├── ruta actual
├── ciclo actual
├── resultados esperados
├── métricas
├── claims de impacto
├── evidencia
├── supuestos
├── hipótesis
├── riesgos
├── dependencias
├── recursos / capacidades disponibles
├── restricciones
├── outputs de Steps
├── validaciones
├── decisiones
├── seguimiento de beneficios
└── historial de revisiones
```

---

# 8.
---

# 8. Taxonomía del conocimiento

Starteria debe distinguir distintos objetos de conocimiento en lugar de tratar todo el texto como equivalente.

| Objeto | Significado | Ejemplo |
|---|---|---|
| Fuente | Origen original | PDF, Excel, entrevista, declaración del usuario, log |
| Extracción | Información identificada en una fuente | “Baseline = 8.1 min” extraído de una hoja |
| Hecho | Información representada como verdadera dentro de un alcance respaldado | 100,000 tickets según reporte 2026 |
| Declaración | Algo que una persona/fuente dice explícitamente | Sponsor: “La prioridad es eficiencia” |
| Supuesto | Creencia utilizada temporalmente sin evidencia suficiente | El volumen permanecerá estable |
| Hipótesis | Proposición comprobable | Automatización reducirá el tiempo |
| Métrica | Cantidad definida | minutos por ticket |
| Baseline | Estado de referencia | 8.1 min/ticket |
| Target | Estado futuro deseado | ≤6 min/ticket |
| Observación | Resultado medido | promedio piloto = 5.9 min |
| Evidencia | Material que apoya/refuta un claim | logs, reporte, entrevista, resultado de test |
| Claim | Afirmación o conclusión sobre realidad/impacto | “El piloto redujo el tiempo 27.2%” |
| Cálculo | Resultado derivado de forma reproducible | estimación de ahorro anual |
| Restricción | Límite que el trabajo debe respetar | ventana del reto de 4 semanas |
| Riesgo | Condición que puede afectar el resultado | retraso en acceso a datos |
| Dependencia | Requisito externo | integración con IT |
| Decisión | Elección autorizada por una persona | implementar / iterar / cerrar |
| Aprendizaje | Interpretación reutilizable confirmada | la clasificación manual no era el cuello de botella principal |
| Patrón | Observación recurrente entre iniciativas | dependencia repetida de seguridad |
| Recomendación | Próxima acción propuesta | ejecutar un piloto más amplio |

---

# 9. Estado de fuente / interpretación

Todo objeto material de conocimiento debe exponer de dónde provino.

Estados internos recomendados:

```text
confirmed_by_user
confirmed_by_role
extracted_from_source
system_generated
calculated
inferred_by_ai
suggested_by_ai
unknown
ambiguous
conflicting_sources
superseded
```

## Regla

`inferred_by_ai` y `suggested_by_ai` no pueden convertirse silenciosamente en `confirmed`.

---

# 10. Escalera de solidez de evidencia

La escalera se aplica a un **claim**, no a toda la iniciativa.

Distintos claims de una misma iniciativa pueden tener diferentes niveles de evidencia simultáneamente.

## L0 — ASSERTED / AFIRMADO

Alguien lo declara.

Ejemplo:

> “Esta iniciativa podría ahorrar €100k al año.”

Mínimo requerido:

- claim;
- persona/fuente;
- fecha/contexto.

Significado:

> La afirmación existe, pero aún no está sustentada.

---

## L1 — SOURCED / CON FUENTE

Existe una fuente trazable que respalda la información subyacente.

Ejemplo:

> “La organización procesó 100,000 tickets en 2026.”

Mínimo requerido:

- referencia a la fuente;
- alcance/período cuando corresponda.

Significado:

> Sabemos de dónde proviene la información.

Esto todavía no garantiza calidad metodológica.

---

## L2 — CALCULATED / DERIVED / CALCULADO

El resultado puede reproducirse mediante inputs y método/fórmula explícitos.

Ejemplo:

```text
100,000 tickets
× 2.2 min ahorrados
× €0.37/min
= €81,400 de ahorro anual estimado
```

Mínimo requerido:

- valores de entrada;
- procedencia de los inputs;
- fórmula/método;
- supuestos.

Significado:

> El número es reproducible, aunque todavía puede ser una estimación.

---

## L3 — OBSERVED / OBSERVADO

El resultado fue realmente medido.

Ejemplo:

```text
Baseline = 8.1 min/ticket
Piloto = 5.9 min/ticket
Cambio observado = -27.2%
```

Mínimo requerido:

- definición de métrica;
- valor observado;
- período;
- alcance/muestra;
- fuente.

Significado:

> Algo fue observado. Todavía no implica automáticamente que haya superado un criterio de validación.

---

## L4 — VALIDATED / VALIDADO

La evidencia observada es suficiente para apoyar o refutar un claim/hipótesis bajo un criterio metodológico explícito.

Puede requerir:

- criterio de éxito previo o regla defendible de validación;
- calidad suficiente de evidencia;
- ausencia de contradicciones críticas no resueltas;
- validador requerido cuando corresponda.

Significado:

> El claim está suficientemente apoyado o refutado para la decisión que pretende informar.

Una hipótesis puede ser **refutada con evidencia de nivel L4**.

---

## L5 — REALIZED / REALIZADO

Un beneficio de negocio u operacional aparece realmente en operación.

Ejemplo:

> Finanzas registra €54k de reducción acumulada de costos.

Mínimo requerido:

- métrica de negocio/operación;
- período observado;
- fuente real;
- relación con baseline aprobado.

Significado:

> El beneficio ocurrió; todavía puede desconocerse cuánto fue causado por la iniciativa.

---

## L6 — ATTRIBUTED / ATRIBUIDO

Existe base suficiente para asignar razonablemente una parte del cambio observado a la iniciativa.

Mínimo requerido:

- resultado realizado;
- método de atribución;
- consideración de factores externos relevantes;
- validación/owner apropiado para el claim.

Significado:

> Starteria puede defender no solo que el cambio ocurrió, sino por qué una parte definida puede vincularse a la iniciativa.

---

## 10.1 Reglas importantes de L0–L6

- L0–L6 no son tipos de iniciativa.
- No constituyen un workflow lineal obligatorio.
- La IA no puede promover un claim de nivel únicamente por intuición.
- Pueden coexistir distintos claims con diferentes niveles.
- L5/L6 ocurrirán frecuentemente después de Step 4.
- “Aún no hay evidencia” es un estado válido.
- “Atribución desconocida” es preferible a inventar atribución.

---

# 11. Ejes de clasificación — No mezclarlos

Starteria no debe colapsar diferentes clasificaciones en un único “tipo de iniciativa”.

## Eje A — Tipo de Reto

Responde:

> ¿Qué clase de cambio estamos intentando producir?

Valores:

- `correction`
- `growth`
- `exploration`

---

## Eje B — Ruta de la iniciativa

Responde:

> ¿Qué tipo de trabajo necesita realizar ahora la iniciativa?

Rutas candidatas:

- `explore_validate`
- `design_solution`
- `implement_handoff`
- `plan_coordinate`
- `reconstruct_existing`
- `lightweight_plan`

El Tipo de Reto y la Ruta son independientes.

---

## Eje C — Tipo de valor

Responde:

> ¿Qué tipo de valor se espera u observa?

Categorías candidatas:

- financiero;
- operacional;
- ingresos/crecimiento;
- cliente;
- riesgo;
- cumplimiento;
- capacidad estratégica;
- aprendizaje / reducción de incertidumbre;
- personas;
- sostenibilidad.

Pueden coexistir múltiples tipos de valor.

---

## Eje D — Solidez de evidencia

Responde:

> ¿Qué tan defendible es este claim específico?

Valores:

- L0–L6.

---

## Eje E — Alineamiento estratégico

Responde:

> ¿Qué tan clara es la conexión de esta iniciativa con las prioridades actuales de la organización?

Valores:

- alineada;
- parcialmente_alineada;
- pendiente_alineamiento;
- no_alineada;
- fuera_de_prioridad.

---

## Eje F — Contexto de origen / gobernanza

Responde:

> ¿Desde qué contexto nace y se gobierna esta iniciativa?

Valores candidatos:

- `corporate_challenge` — nace o se alinea a un Reto corporativo;
- `corporate_independent` — existe dentro de una empresa pero aún no pertenece a un Reto;
- `independent_user` — iniciativa independiente del usuario;
- `target_company` — iniciativa independiente que busca generar valor en una empresa objetivo;
- `imported_existing` — trabajo existente reconstruido dentro de Starteria.

Este eje **no define la Ruta de Desarrollo**. Una iniciativa independiente y una corporativa pueden necesitar ambas `explore_validate`; lo que cambia es el contexto heredado, la autoridad y las alternativas de continuidad.

---

# 12.
---

# 12. Modelo de objetos del portafolio

En contexto corporativo:

```text
Contexto de Organización
        │
        ▼
Frente Estratégico
├── resultado deseado
├── KPI / señal
├── baseline / target
└── horizonte
        ↓
Reto
        ↓
Activación del Reto
        ↓
Iniciativa
        ↓
Ciclo de Iniciativa
        ↓
Step 0–4
        ↓
Evidencia / Claims / Métricas
        ↓
Decision Package
        ↓
Decisión humana
        ↓
Continuidad / Seguimiento de beneficios
        ↓
Aprendizaje / Memoria Organizacional
```

`Contexto de Organización` actúa como **envolvente contextual**; no prueba alineamiento por sí mismo.

En iniciativa independiente:

```text
Contexto del usuario / organización objetivo [opcional]
        ↓
Iniciativa
        ↓
Ciclo
        ↓
Step 0–4
        ↓
Decision Package
        ↓
Ruta de continuidad
```

Objetos de soporte:

- SourceRef
- Validation
- Report
- ImportSession
- ImportedItem
- FieldMapping
- Contribution Contract
- Impact Claim
- Decision Package
- Benefit Tracking Record
- Organization Context Snapshot
- Challenge Version / Change Event

---

# 13.
---

# 13. Contrato del Frente Estratégico

Un Frente Estratégico representa una prioridad relativamente durable del negocio u organización que se busca mover.

Variables conceptuales mínimas:

- nombre;
- **resultado deseado**;
- objetivo;
- KPI o señal;
- baseline cuando exista;
- target cuando exista;
- horizonte;
- sponsor/responsable cuando corresponda;
- prioridad;
- estado;
- restricciones estratégicas conocidas;
- relación con Contexto de Organización.

### Resultado deseado

Para el MVP, el resultado que la organización quiere lograr **vive dentro del Frente Estratégico** y no como una entidad separada.

Ejemplo:

```text
Frente: Eficiencia Operativa
Resultado deseado: Reducir el costo de atención sin deteriorar calidad
KPI: Costo por solicitud
Baseline: €14.20
Target: €10.00
Horizonte: 12 meses
```

Esto evita que el modelo `Organización → Frente → Reto → Iniciativa` pierda el “para qué”.

Una tecnología, herramienta o iniciativa no debe convertirse automáticamente en Frente Estratégico.

Conceptos como “IA”, “automatización” o “CRM” requieren revisar si son:

- resultados estratégicos;
- capacidades habilitadoras;
- mecanismos de solución.

---

# 14.
---

# 14. Contrato del Reto

Un Reto representa un problema, oportunidad o incertidumbre concreta bajo un Frente Estratégico.

Variables conceptuales mínimas:

- tipo de reto;
- descripción;
- alcance;
- KPI/señal objetivo;
- urgencia;
- horizonte;
- esfuerzo/capacidad estimada;
- restricciones;
- Sponsor / Responsable del Reto;
- decisión esperada;
- estado de cobertura;
- versión actual.

## 14.1 Marco de restricciones del Reto

Un Reto crea el marco dentro del cual operan sus iniciativas asociadas.

Conceptualmente:

```text
Challenge Constraint Envelope
├── resultado que se busca mover
├── alcance del Reto
├── KPI / señal
├── deadline / horizonte
├── recursos disponibles
├── presupuesto si se conoce
├── dependencias
├── restricciones
└── decisión esperada al final de la ventana
```

## 14.2 Cambios materiales del Reto y propagación

El Reto puede cambiar durante su vida. Esto es posible y debe gobernarse.

Cambios materiales incluyen, por ejemplo:

- resultado buscado;
- alcance;
- KPI/señal;
- deadline;
- presupuesto/capacidad;
- prioridad;
- restricción no negociable;
- decisión esperada.

Cuando ocurre un cambio material:

```text
Reto v1
↓
Cambio confirmado
↓
Reto v2 + Change Event
↓
Starteria identifica iniciativas afectadas
↓
Impact Assessment
↓
no_change_needed
OR requires_review
OR realignment_required
OR scope_conflict
↓
humano confirma la respuesta apropiada
```

### Regla crítica

Starteria **no reescribe automáticamente** el objetivo o alcance de una iniciativa activa.

Cada ciclo conserva el snapshot del Reto que heredó al comenzar. La nueva versión del Reto se presenta como contexto nuevo y Starteria analiza qué trabajo posterior puede haber quedado desalineado.

Ejemplo:

> El Reto cambia de “reducir 20% el costo de atención general” a “reducir 20% el costo únicamente en canal digital durante Q4”.

Una iniciativa orientada a call center no debe cambiar silenciosamente de alcance. Starteria debe advertir que su alineamiento requiere revisión y permitir decidir entre:

- continuar porque sigue siendo relevante;
- ajustar el siguiente ciclo;
- realinear a otro Reto;
- pausar/cerrar;
- mantenerla como iniciativa independiente.

Esta capacidad se considera necesaria para el MVP lógico, aunque la primera implementación UX pueda ser simple: cambio versionado + alerta + revisión humana.

---

# 15.
---

# 15. Contrato de la Iniciativa

Una Iniciativa es una respuesta concreta que una persona/equipo desarrolla para abordar un Reto o una oportunidad independiente.

En modo corporativo debe mostrar:

- estado de alineamiento;
- Reto padre cuando esté alineada;
- contexto del Frente Estratégico;
- Initiative Owner;
- contribución esperada;
- ruta actual;
- ciclo actual;
- Step actual;
- restricciones heredadas;
- estado de evidencia;
- claims de impacto;
- bloqueos;
- decisión solicitada.

---

# 16. Contrato de Contribución

Pertenecer jerárquicamente a un Reto no prueba contribución estratégica.

Una iniciativa asociada a un Reto debe establecer progresivamente:

```text
Contribution Contract
├── iniciativa
├── reto
├── frente estratégico
├── cambio esperado
├── mecanismo propuesto
├── métrica intermedia
├── KPI / señal del frente
├── tipo de contribución
│   ├── directa
│   ├── indirecta
│   ├── habilitadora
│   └── exploratoria
├── evidencia esperada
└── estado de contribución
    ├── propuesta
    ├── confirmada
    ├── observada
    ├── no sustentada
    └── reemplazada
```

Esto evita tratar similitud semántica como prueba de impacto.

---

# 17. Job Core de Portfolio Lead

Portfolio Lead existe para responder:

> ¿Estamos dedicando capacidad organizacional al trabajo correcto, ese trabajo está produciendo evidencia/valor suficiente frente a las prioridades que queremos mover y qué decisión de portafolio está justificada ahora?

La capa Portfolio Lead debe ayudar progresivamente a responder:

1. ¿Qué quiere mover la organización?
2. ¿Cómo se representa como Frentes Estratégicos y KPI/señales?
3. ¿Qué Retos deben abordarse?
4. ¿Qué iniciativas los están abordando?
5. ¿Qué tan fuerte es la relación/contribución?
6. ¿Dónde existe cobertura insuficiente, duplicada o bloqueada?
7. ¿Qué evidencia/valor existe?
8. ¿Qué decisiones requieren atención?
9. ¿Qué debe reportarse a sponsors/liderazgo?
10. ¿Qué aprendizaje debería reutilizarse?

La descomposición exacta en `PL-01`, `PL-02`, etc. permanece experimental hasta ser testeada.

---

# 18. Cobertura de Portafolio vs. Impacto

Estos conceptos deben mantenerse separados.

## Cobertura

Responde:

> ¿Tenemos iniciativas coherentes abordando los Retos que creemos importantes?

Estados posibles:

- sin cobertura;
- cobertura parcial;
- cobertura suficiente;
- posible solapamiento;
- requiere reformulación;
- listo para decisión.

La cobertura utiliza:

- alineamiento confirmado;
- contratos de contribución;
- estado de iniciativas;
- distribución del portafolio;
- recursos/capacidad;
- dependencias;
- mecanismos duplicados;
- Retos no abordados.

Cobertura no prueba impacto de negocio.

---

## Impacto

Responde:

> ¿Qué efecto o valor puede sostenerse realmente con evidencia?

El análisis de impacto utiliza:

- métricas;
- baselines;
- targets;
- observaciones;
- cálculos;
- evidencia;
- supuestos;
- valor realizado;
- métodos de atribución.

Impacto pertenece al análisis de evidencia/valor, no únicamente a la cobertura del portafolio.

---

# 19. Lógica del ciclo de iniciativa

Una iniciativa puede evolucionar mediante múltiples ciclos.

```text
Ciclo
├── decisión que debe habilitar
├── snapshot de contexto de organización/aplicación
├── snapshot de Frente/Reto cuando corresponda
├── restricciones heredadas
├── alcance del ciclo
├── incertidumbre actual
├── Step 0
├── Step 1
├── Step 2
├── Step 3
├── Step 4
└── decisión resultante
```

Un nuevo ciclo se justifica cuando:

- la decisión es continuar;
- cambia materialmente el alcance de la iniciativa;
- cambia la hipótesis/apuesta;
- la implementación crea un nuevo objetivo de aprendizaje;
- ocurre un pivot;
- nuevas restricciones organizacionales requieren reframing;
- un cambio material del Reto obliga a redefinir el trabajo futuro.

No debe crearse un nuevo ciclo únicamente porque se terminó un formulario.

## 19.1 Snapshots y cambios upstream

El ciclo conserva el contexto que justificó sus decisiones.

Si el Reto o el contexto organizacional cambia durante el ciclo, Starteria debe:

1. conservar el snapshot utilizado;
2. registrar la nueva información;
3. analizar si afecta el trabajo actual o futuro;
4. marcar `requires_review` cuando corresponda;
5. evitar reinterpretar retroactivamente lo sucedido con información que todavía no existía.

---

# 20.
---

# 20. Modelo temporal

Starteria distingue tres relojes.

## 20.1 Horizonte estratégico / del Reto

Se define a nivel Portfolio.

Ejemplo:

> Necesitamos suficiente evidencia en 4 semanas para decidir si financiamos la implementación.

---

## 20.2 Ventana del ciclo de iniciativa

Se define en la iniciativa dentro de las restricciones heredadas.

Ejemplo:

> En 4 semanas esta iniciativa validará el efecto sobre el proceso A y entregará una recomendación.

---

## 20.3 Horizonte de realización de beneficios

Puede continuar después de Step 4.

Ejemplo:

> El beneficio financiero será monitoreado durante 6–12 meses después de la implementación.

---

## Regla

Starteria debe ayudar a reducir el alcance de una iniciativa cuando su ambición sea incompatible con el tiempo, capacidad, dependencias o horizonte de decisión disponible.

Debe explicar **por qué** el alcance no encaja, en vez de mostrar un score opaco de factibilidad.

---

# 21. Adaptive Core — Funciones permanentes de Step 0–4

La secuencia sigue siendo Step 0–4.

La ruta adapta la forma en que se ejecuta cada función.

---

## Step 0 — Enmarcar el ciclo actual

### Pregunta estratégica

> Dado el contexto heredado, estado actual, tiempo/recursos disponibles y decisión esperada, ¿qué es razonable que esta iniciativa intente lograr ahora?

### Responsabilidades Core

- heredar contexto de Frente Estratégico / Reto cuando exista;
- entender punto de partida;
- aclarar resultado esperado del ciclo;
- hacer visibles expectativas iniciales de impacto;
- establecer restricciones;
- identificar dependencias mayores;
- evaluar ajuste del alcance;
- definir qué decisión pretende habilitar el ciclo.

### Outputs típicos

Según la ruta:

- Context Brief;
- Opportunity Brief;
- Implementation Brief;
- Project Brief;
- Reconstructed Context;
- lightweight action brief.

### Importante

Step 0 puede contener claims de impacto esperado L0.

No los valida.

---

## Step 1 — Establecer verdad y foco

### Pregunta estratégica

> ¿Qué podemos realmente sostener sobre la situación actual y qué foco está justificado por evidencia?

### Responsabilidades Core

- establecer baseline cuando corresponda;
- separar hechos, supuestos e hipótesis;
- revisar evidencia existente;
- identificar contradicciones;
- refinar/reducir alcance;
- identificar incertidumbre crítica;
- determinar qué todavía debe aprenderse.

### Importante

Step 1 puede cambiar materialmente el framing de Step 0.

Eso es `scope refinement`, no un fallo automático.

---

## Step 2 — Diseñar y preparar aquello que será confrontado con la realidad

### Pregunta estratégica

> Dado lo aprendido, ¿qué podemos diseñar, preparar o construir con el tiempo, recursos, capacidades y dependencias disponibles para generar evidencia útil, y cómo mediremos lo que ocurra?

### Propósito

Step 2 convierte el foco ya sustentado en un **entregable ejecutable o execution-ready**.

No se limita a escribir un plan. Dependiendo de la ruta, puede implicar diseñar y/o construir aquello que Step 3 va a ejecutar, usar, probar u observar.

Ejemplos:

- prototipo;
- piloto;
- experimento;
- automatización;
- flujo n8n;
- script Python;
- dashboard Power BI;
- mock de servicio;
- concierge/manual proxy;
- proceso con formularios + Excel + IA;
- slice técnico;
- implementación acotada;
- plan de coordinación listo para ejecutar.

### Responsabilidades Core

- traducir el aprendizaje de Step 1 en una apuesta/acción concreta;
- elegir la forma de validación o ejecución adecuada a la Ruta;
- adaptar la propuesta a tiempo, recursos y know-how reales del equipo;
- definir qué debe construirse/prepararse y con qué nivel de fidelidad;
- identificar qué puede hacer el equipo y qué requiere IT, Data, Seguridad, proveedor u otra capacidad externa;
- cuando la solución ideal no sea viable, proponer proxies o alternativas de menor costo/fidelidad sin fingir equivalencia;
- preparar o registrar el entregable que será usado en Step 3;
- definir población/entorno de prueba cuando corresponda;
- definir baseline/comparador;
- definir métricas y plan de medición;
- definir criterio de éxito/decisión antes de observar los resultados cuando sea posible;
- identificar evidencia requerida;
- evaluar readiness para ejecutar.

### Boundary Step 2 → Step 3

Step 2 termina cuando existe algo suficientemente preparado para ser confrontado con la realidad.

Step 3 comienza cuando ese entregable/plan **se ejecuta en el entorno, muestra o situación definida y empiezan a generarse observaciones**.

Ejemplo:

```text
Step 1
La evidencia indica que automatizar clasificación puede mover el KPI.

Step 2
Equipo domina n8n.
Construye flujo que conecta plataformas A/B/C.
Define muestra de 1,000 solicitudes.
Baseline: 8.1 min/ticket.
Éxito: reducción ≥20%.
Entregable: workflow n8n listo + Measurement Plan.

Step 3
Se ejecuta el workflow con la muestra.
Se registran tiempos, errores, excepciones y efectos reales.
```

### Cuando falta capacidad

Si el equipo no puede construir la solución ideal, Step 2 no debe bloquearse automáticamente. Puede concluir, por ejemplo:

- `external_dependency_required`;
- `technical_support_required`;
- `proxy_validation_recommended`;
- `scope_reduction_recommended`;
- `not_ready_to_execute`.

Starteria puede proponer alternativas, pero el usuario debe distinguir claramente entre una prueba proxy y la solución final.

### Outputs típicos

Según la Ruta:

- Test Card + prototipo;
- Solution Card + Test Plan + artefacto;
- Implementation Roadmap + slice/configuración preparada;
- Action Plan listo para ejecución;
- reconstructed execution plan;
- lightweight executable action.

### Importante

La medición se define antes de conocer los resultados siempre que sea posible. Esto reduce la selección retrospectiva de métricas para justificar una conclusión.


## Step 3 — Ejecutar, observar y aprender

### Pregunta estratégica

> ¿Qué ocurrió cuando la iniciativa se confrontó con la realidad?

### Responsabilidades Core

- registrar ejecución;
- registrar observaciones;
- comparar resultado vs baseline/expectativa;
- exponer desviaciones;
- actualizar Impact Claims;
- identificar contradicciones;
- generar aprendizaje;
- exponer nuevos riesgos/dependencias.

### Importante

Step 3 puede producir:

- hipótesis apoyada;
- hipótesis refutada;
- resultado mixto;
- resultado inconcluso.

La evidencia negativa sigue siendo evidencia válida.

---

## Step 4 — Cerrar el ciclo y habilitar una decisión

### Pregunta estratégica

> ¿Qué decisión está justificada por la evidencia disponible y qué continuidad se requiere?

### Responsabilidades Core

- consolidar evidencia relevante;
- declarar qué se aprendió;
- comparar esperado vs observado;
- exponer madurez de Impact Claims;
- identificar riesgos/dependencias;
- proponer recomendación;
- solicitar decisión humana;
- definir siguiente owner/acción;
- generar continuidad/handoff cuando corresponda.

### Importante

El output de Step 4 no es por sí mismo la decisión organizacional.

Prepara el Decision Package.

---

# 22. Taxonomía candidata de Rutas de Desarrollo

La taxonomía actual a probar es:

| Ruta | Necesidad primaria | Ejemplo de Step 2 |
|---|---|---|
| `explore_validate` | Reducir incertidumbre / validar oportunidad, problema o apuesta | experimento / prototipo / proxy |
| `design_solution` | Diseñar y probar una solución | solución/prototipo + test plan |
| `implement_handoff` | Implementar, adoptar y transferir | slice implementable / roadmap / readiness pack |
| `plan_coordinate` | Planificar y coordinar delivery | plan ejecutable / dependencias / hitos |
| `reconstruct_existing` | Reconstruir trabajo ya en marcha | plan reconstruido y gaps de ejecución |
| `lightweight_plan` | Resolver una acción pequeña/rápida sin carga metodológica innecesaria | acción mínima lista para ejecutar |

## Regla 1 — Tipo de Reto ≠ Ruta de Desarrollo

El Tipo de Reto describe **qué clase de cambio se busca**.

La Ruta describe **qué clase de trabajo necesita hacer la iniciativa ahora**.

## Regla 2 — Iniciativa independiente ≠ nueva Ruta de Desarrollo

Una iniciativa independiente puede utilizar las mismas rutas que una iniciativa asociada a un Reto.

Ejemplo:

```text
Iniciativa independiente
“Quiero validar si este servicio resuelve una necesidad en constructoras”
→ route = explore_validate

Iniciativa corporativa bajo Reto
“Queremos validar si automatización reduce tiempo de procesamiento”
→ route = explore_validate
```

Lo que cambia es:

- contexto heredado;
- autoridad;
- restricciones;
- quién valida;
- alternativas disponibles después de Step 4.

## 22.1 Ruta de Desarrollo vs. Ruta de Continuidad

Starteria debe separar dos preguntas:

```text
Ruta de Desarrollo
¿Qué trabajo necesita hacer la iniciativa durante este ciclo?

Ruta de Continuidad
¿Qué debe ocurrir después de la decisión de Step 4?
```

Esto evita crear una nueva metodología de Steps para cada tipo de salida organizacional.

---

# 23.
---

# 23. Suficiencia y Gates

Cada Step evalúa suficiencia contra su función.

## Hard gate

Bloquea la transición cuando avanzar produciría trabajo engañoso, riesgoso o inválido organizacionalmente.

Ejemplos:

- no existe objetivo interpretable;
- falta una fuente/evidencia requerida para un claim crítico;
- existe una contradicción no resuelta que cambia la decisión;
- falta validador humano requerido;
- el alcance viola una restricción organizacional no negociable.

## Soft gate

Permite continuar, pero expone:

- qué falta;
- por qué importa;
- qué riesgo introduce;
- quién es owner;
- cuándo se vuelve crítico.

---

# 24. Gobernanza de Impact Claims

Un número de impacto/valor nunca debe aparecer como un número desnudo sin contexto suficiente.

Estructura conceptual mínima:

```text
ImpactClaim
├── statement
├── valueType
├── metric
├── value
├── unit
├── scope
├── period
├── baseline
├── target
├── sourceRefs[]
├── method / formula
├── assumptions[]
├── evidenceStrength L0–L6
├── validationStatus
├── owner / validator
└── updatedAt
```

Para un valor calculado, Starteria debe permitir inspeccionar su genealogía.

Ejemplo:

```text
€81,400 de ahorro anual estimado
│
├── 100,000 tickets → fuente de Operaciones
├── 2.2 min ahorrados → resultado del piloto
├── €0.37/min → fuente de Finanzas
├── fórmula → volumen × tiempo ahorrado × costo
└── supuesto → el efecto del piloto escala
```

---

# 25. Modelo de decisión

Rutas candidatas de decisión:

- continuar validando;
- iterar;
- pivotear;
- escalar en la misma área;
- escalar a área similar;
- transferir a IT / industrializar;
- integrar al roadmap;
- pausar;
- cerrar con aprendizaje.

Una decisión debe contener:

- tipo de decisión;
- rationale;
- evidencia relevante;
- decisor;
- siguiente acción;
- siguiente owner;
- timing/condiciones cuando corresponda.

---

# 26. Modelo de continuidad

Una decisión puede generar una **Ruta de Continuidad** distinta al Route Type utilizado durante el ciclo.

Rutas candidatas:

```text
Decision
├── continue_new_cycle
├── iterate_same_bet
├── pivot
├── implement
├── handoff
├── scale_same_area
├── scale_similar_area
├── integrate_roadmap
├── seek_alignment_or_sponsor
├── seek_external_capability_or_partner
├── venture_or_spinoff_path [cuando aplique]
├── pause
├── close_with_learning
└── benefit_tracking
```

## 26.1 Continuidad según contexto de gobernanza

### Iniciativa corporativa alineada

Alternativas frecuentes:

- nuevo ciclo;
- iterar/pivotear;
- implementar;
- handoff a IT/negocio;
- escalar;
- integrar a roadmap;
- pausar/cerrar;
- iniciar seguimiento de beneficios.

### Iniciativa corporativa independiente / aún no alineada

Puede además:

- buscar Sponsor;
- alinearse a un Reto existente;
- proponer nuevo Reto/Frente;
- mantenerse como exploración independiente;
- cerrarse si no justifica capacidad organizacional.

### Iniciativa independiente del usuario

Puede, según el caso:

- abrir un nuevo ciclo de validación;
- iterar/pivotear;
- construir una versión de mayor fidelidad;
- buscar piloto con una organización objetivo;
- buscar partner/capacidad externa;
- avanzar a comercialización;
- formalizar una ruta de startup/spin-off cuando sea pertinente;
- pausar;
- cerrar con aprendizaje.

La lista exacta y qué opciones son P0/P1 permanece experimental, pero la separación entre **desarrollo** y **continuidad** se considera estable.

## 26.2 Handoff

El handoff no está completo únicamente porque se generó un documento.

Cuando corresponda requiere:

- owner receptor;
- aceptación;
- condiciones;
- dependencias;
- responsabilidades;
- próximo punto de revisión.

---

# 27.
---

# 27. Memoria Organizacional

Starteria almacena más que documentos.

La memoria reutilizable puede incluir:

- contexto estratégico confirmado;
- Frentes Estratégicos;
- Retos;
- iniciativas;
- ciclos;
- evidencia;
- métricas;
- hipótesis;
- Impact Claims;
- decisiones;
- experimentos;
- bloqueos;
- riesgos;
- dependencias;
- validaciones;
- handoffs;
- resultados finales;
- aprendizajes;
- patrones entre iniciativas.

## Reglas de reutilización

- La evidencia histórica puede sugerirse como contexto relevante; no se vuelve automáticamente verdad actual.
- El aprendizaje generado por IA debe diferenciarse del aprendizaje confirmado por personas.
- La similitud sirve para recuperación, no como prueba.
- La reutilización debe preservar procedencia.

---

# 28. Contrato de intervención de IA

Cada skill/agente de IA debe declarar:

1. momento del journey;
2. trigger;
3. un job cognitivo claro;
4. contrato de input;
5. prioridad de fuentes;
6. operaciones realizadas;
7. guardrails;
8. contrato de output;
9. regla de suficiencia;
10. checkpoint humano;
11. modos de fallo;
12. rúbrica de evaluación;
13. casos de test.

Una skill no puede ampliar silenciosamente su autoridad solo porque tenga más información disponible.

---

# 29. Pipeline de integridad de información

Starteria debe evitar:

```text
documento grande
→ resumen IA
→ resumen se convierte en verdad
```

Debe utilizar:

```text
FUENTE
↓
EXTRACCIÓN
↓
OBJETO DE CONOCIMIENTO ESTRUCTURADO
↓
REFERENCIA A LA FUENTE
↓
CONFIDENCE / ESTADO
↓
CONFIRMACIÓN HUMANA CUANDO CORRESPONDA
↓
CONTEXTO CANÓNICO
↓
ANÁLISIS
```

Para transcripciones, conservar cuando esté disponible:

- speaker;
- timestamp;
- contexto circundante;
- fecha;
- fuente;
- confidence.

Si el contexto cambia materialmente la interpretación, Starteria debe solicitar confirmación.

---

# 30. Versionado y propagación de cambios materiales

“Versionar un cambio crítico” significa que Starteria **no reemplaza silenciosamente un estado importante por otro**.

Conserva:

- versión anterior;
- versión nueva;
- qué cambió;
- quién confirmó el cambio;
- fuente/razón;
- fecha;
- objetos dependientes potencialmente afectados.

Ejemplo:

```text
Reto v1
Alcance: todas las solicitudes
Deadline: 30/09

Reto v2
Alcance: solo canal digital
Deadline: 31/10

Change Event
Reason: comité redujo alcance
Confirmed by: Portfolio Lead
Affected initiatives: I-03, I-07, I-11
```

Cambios materiales pueden incluir:

- objetivo;
- resultado esperado;
- Frente;
- Reto;
- alcance;
- ruta;
- KPI;
- baseline/target;
- restricción mayor;
- hipótesis/apuesta;
- deadline/capacidad;
- decisión previamente tomada.

Regla:

```text
cambio crítico upstream
↓
crear nueva versión / change event
↓
identificar outputs dependientes
↓
evaluar impacto
↓
marcar requires_review cuando corresponda
↓
preservar versión anterior
↓
revalidar únicamente lo materialmente afectado
```

### No propagación ciega

“Propagar” no significa copiar automáticamente el nuevo valor dentro de todas las iniciativas. Significa **hacer visible que cambió una condición upstream y evaluar sus consecuencias**.

No eliminar automáticamente trabajo posterior.

---

# 31.
---

# 31. Manual / Humano por diseño

Estas acciones no son deuda de automatización.

Son decisiones de gobernanza.

Se espera confirmación/decisión humana cuando:

- se confirma un Frente Estratégico materialmente importante;
- se confirma alineamiento estratégico donde exista ambigüedad;
- se activa un Reto bajo autoridad organizacional;
- se confirma contexto crítico extraído cuando la fuente es ambigua;
- se valida evidencia cuando se requiere validador humano;
- se toman decisiones de continuidad/inversión del portafolio;
- se acepta un handoff organizacional;
- se confirma atribución cuando la política exige validación responsable.

El validador exacto puede depender de la configuración de cada organización.

---

# 32. Definición de terminado — Lógica Core

La lógica Core del MVP se considera suficientemente definida cuando:

1. Portfolio e Initiative tienen responsabilidades distintas.
2. Existe un modelo explícito de Contexto de Organización / Contexto de Aplicación y su procedencia.
3. Los estados de alineamiento de iniciativas corporativas son explícitos.
4. El Frente Estratégico contiene un resultado deseado y KPI/señal explícitos.
5. La información puede entrar por conversación/archivos/formularios sin convertir el chat en fuente de verdad.
6. Los objetos materiales de conocimiento conservan procedencia.
7. Hecho, supuesto, hipótesis, evidencia, claim, decisión y aprendizaje son distintos.
8. Evidence Strength L0–L6 es implementable y testeable a nivel de claim.
9. Las funciones Step 0–4 son estables y adaptables por ruta.
10. Las restricciones del Reto fluyen al alcance de la iniciativa.
11. Cambios materiales del Reto pueden versionarse y disparar revisión de iniciativas relacionadas.
12. Step 2 produce un entregable ejecutable/execution-ready más un plan de medición apropiado a la ruta.
13. Step 3 comienza cuando ese entregable/plan se confronta con la realidad y genera observaciones.
14. Los ciclos se orientan a decisiones en lugar de duraciones fijas.
15. La suficiencia y los hard/soft gates son explícitos.
16. Iniciativas existentes pueden reconstruirse sin destruir contenido posterior válido.
17. Cambios críticos preservan historial y disparan revisión dirigida.
18. Los claims de impacto muestran método/fuente/supuestos.
19. Step 4 prepara una decisión humana; no decide autónomamente.
20. El seguimiento post-Step de beneficios es conceptualmente distinto del desarrollo de la iniciativa.
21. Las iniciativas independientes utilizan el mismo Adaptive Core y poseen rutas de continuidad adaptables a su contexto.
22. Toda skill de IA puede evaluarse mediante un test harness estándar.

---

# 33.
---

# 33. Restricciones — Lógica Core

Starteria no debe:

- inventar evidencia;
- convertir inferencia IA en verdad confirmada silenciosamente;
- tratar información pública de una empresa como prueba automática de prioridades, capacidades o problemas internos;
- inferir un Frente Estratégico oficial solo por similitud entre iniciativas;
- confundir jerarquía con contribución;
- confundir mejora observada con atribución causal;
- reescribir automáticamente iniciativas activas cuando cambia un Reto;
- reinterpretar retroactivamente un ciclo usando contexto que no existía cuando se tomó la decisión;
- forzar todas las iniciativas al mismo artefacto metodológico;
- asumir que Step 2 siempre requiere desarrollar software;
- tratar un proxy/manual test como equivalente a la solución final sin explicitar la diferencia;
- obligar a rehacer trabajo importado válido solo por cronología;
- tratar porcentaje de completitud como suficiencia metodológica;
- usar un score opaco cuando pueden mostrarse las razones;
- borrar versiones anteriores de decisiones/contexto material;
- dejar estado crítico de negocio únicamente en el historial conversacional;
- tratar resultados negativos/inconclusos como fallo metodológico;
- asumir que el valor financiero es la única forma de valor;
- obligar a todos los claims a llegar a L6;
- mantener toda iniciativa abierta hasta observar beneficios de largo plazo.

---

# 34.
---

# 34. Registros de decisiones de arquitectura / negocio

Cualquier cambio propuesto a un Invariante Core debe registrarse como ADR / Business Logic Decision antes de implementación.

Estructura mínima:

```text
Decision ID:
Fecha:
Problema:
Invariante actual afectado:
Cambio propuesto:
Por qué:
Evidencia que respalda el cambio:
Alternativas consideradas:
Impacto en Portfolio Lead:
Impacto en Step 0–4:
Impacto en modelo de datos:
Impacto en iniciativas existentes:
Requiere migración:
Owner de decisión:
Estado:
```

Esto evita que cambios de prompt redefinan silenciosamente el producto.

---

# 35. Doctrina de testeo

Antes de implementar un cambio importante de IA o lógica de negocio:

```text
Hipótesis
↓
Skill / regla bajo prueba
↓
Casos controlados
↓
Comportamientos esperados
↓
Condiciones de fallo
↓
Rúbrica
↓
Ejecutar contra Starteria
↓
Comparar contra modelos generales cuando aporte valor
↓
Analizar patrones de fallo
↓
Revisar
↓
Solo entonces implementar
```

Los tests deben incluir al menos:

- caso claro;
- caso ambiguo;
- caso incompleto;
- caso contradictorio;
- caso cargado de documentos;
- caso con datos existentes;
- caso de corrección/actualización;
- caso engañoso/adversarial.

---

# 36. Métricas de calidad de IA

Métricas transversales:

- precisión de extracción;
- tasa de afirmaciones no sustentadas;
- cobertura de procedencia;
- detección de ambigüedad crítica;
- carga de corrección del usuario;
- interacciones hasta output validado;
- precisión de actualización de contexto;
- detección de contradicciones críticas;
- tasa de omisiones relevantes para decisión;
- aceptación humana en primera pasada.

Para claims materiales de negocio, priorizar corrección y procedencia sobre completitud de respuesta.

---

# 37. Patrones de entrada que Starteria debe soportar

Una misma experiencia de entrada puede aceptar diferentes condiciones iniciales.

## Context-first / Company-context-first

El usuario aporta primero información de la organización o empresa objetivo:

- web;
- LinkedIn;
- documentos;
- estrategia;
- procesos;
- capacidades;
- políticas.

Starteria estructura un Contexto de Organización/Aplicación con procedencia y freshness.

No debe inferir problemas internos no declarados únicamente desde información pública.

## Strategy-first

El usuario tiene prioridades/objetivos.

Starteria ayuda a estructurar Frentes Estratégicos y Retos usando el Contexto de Organización cuando exista.

## Portfolio-first

El usuario tiene iniciativas existentes pero estructura estratégica poco clara.

Starteria reconstruye primero el portafolio y no fabrica estrategia silenciosamente a partir del inventario.

## Strategy + portfolio

El usuario tiene ambos.

Starteria interpreta el contexto estratégico, reconstruye las iniciativas y luego soporta el análisis de alineamiento.

## Challenge-first

El usuario ya tiene un Reto.

Starteria puede omitir framing estratégico anterior si existe contexto válido. La iniciativa hereda la versión actual del Challenge Constraint Envelope.

## Initiative-first / independiente

El usuario tiene una iniciativa, problema, oportunidad o proyecto.

Starteria realiza revisión guiada y enruta al Core de Iniciativa.

Si la iniciativa pretende generar valor para una empresa concreta, Starteria puede pedir o construir progresivamente su Contexto de Aplicación sin exigir que exista Portfolio Lead o Reto corporativo.

El routing interno de skills puede cambiar; el producto no exige que el usuario entienda la taxonomía de skills.

---

# 38.
---

# 38. Preguntas abiertas actuales — No ocultarlas

Las siguientes preguntas no están congeladas todavía:

1. Límite exacto entre Entry Router, Context Intake y PL-01.
2. Número/nombres exactos de skills de Portfolio Lead.
3. Campos mínimos exactos del Contexto de Organización para P0.
4. Qué fuentes públicas se pueden consultar/capturar automáticamente y con qué reglas de freshness.
5. Campos mínimos exactos para confirmar un Frente Estratégico.
6. Si KPI baseline/target son siempre obligatorios o condicionales.
7. Definición exacta de `sufficient coverage`.
8. Estándares exactos de atribución por tipo de valor.
9. Qué niveles de evidencia requieren qué validadores humanos.
10. Qué autoridad de decisión debe configurarse para Sponsor / Responsable del Reto.
11. Criterios exactos para crear un nuevo ciclo vs continuar el existente.
12. Cuándo un cambio de Reto exige detener el ciclo actual vs solo revisar el siguiente.
13. Límite exacto de `lightweight_plan`.
14. UI exacta para mostrar procedencia y evidencia sin saturar.
15. Qué métricas de benefit tracking pertenecen a Starteria vs sistemas externos.
16. Qué tipos de Impact Claim son P0 para el MVP.
17. Qué Rutas de Continuidad independientes son P0 y cuáles P1 (p. ej. startup/spin-off/comercialización).
18. Cuánto debe ayudar Starteria a generar artefactos técnicos en Step 2 vs limitarse a especificarlos/revisarlos.

Estas preguntas deben resolverse mediante tests y/o decisiones explícitas de negocio, no mediante cambios silenciosos de prompt.

---

# 39.
---

# 39. Uso recomendado en repositorio

Ubicación sugerida:

```text
/docs/core/
    STARTERIA_CORE_LOGIC_CONTRACT.md

/docs/adr/
    ADR-INDEX.md
    ADR-001-...
    ADR-002-...

/skills/
    core-01-context-evidence-intake/
    pl-01-strategic-intent/
    ...
```

Toda skill debería referenciar este contrato.

Las skills pueden especializar la lógica, pero no redefinir silenciosamente los Invariantes Core.

---

# 40. Base utilizada para v0.2

Esta versión consolida la dirección actual de Starteria reflejada en:

- Portfolio Lead V.2
- PRD Starteria V.3
- Actualización v1
- Actualización menor del PRD Core
- PRD — Revisión inicial guiada de iniciativa + Overview post-confirmación
- PRD — Entrada pública y conversión a Step 0 V2
- definiciones de trabajo actuales sobre procedencia, solidez de evidencia, contribución, ciclos adaptativos y seguimiento de beneficios.

La estructura de este contrato toma intencionalmente como referencia un patrón de contrato de repositorio/agentes operativos: identidad, principios, alcance, lógica de fases/estados, gates humanos explícitos, restricciones, definición de terminado y registros de decisión de arquitectura.


---

# 41. Decisiones incorporadas en v0.2

| Observación | Decisión v0.2 | Estado |
|---|---|---|
| Contexto de empresa moldea la iniciativa | Incorporar `Organization/Application Context` como capa transversal con provenance + freshness | Incorporado |
| INV-12 era ambiguo | Separar cierre del ciclo de desarrollo de Benefit Tracking post-Step 4 | Incorporado |
| `Organización → Frente` parecía una fase y no mostraba resultado | Organización pasa a ser envolvente contextual; Frente incluye `resultado deseado` | Incorporado |
| “Cambios críticos se versionan” era ambiguo | Definir Version + Change Event + `requires_review` | Incorporado |
| Sponsor y Challenge Owner se solapan | Unificar experiencia MVP en `Sponsor / Responsable del Reto`, manteniendo autoridad configurable | Incorporado provisionalmente |
| El Reto puede cambiar | Versionar Reto y evaluar impacto en iniciativas; no mutarlas automáticamente | Incorporado |
| Step 2 era demasiado abstracto | Definirlo como diseño/preparación/construcción del entregable ejecutable + Measurement Plan | Incorporado |
| Iniciativas independientes requieren salidas propias | Mantener mismas Rutas de Desarrollo y añadir Rutas de Continuidad adaptadas a contexto | Incorporado |
