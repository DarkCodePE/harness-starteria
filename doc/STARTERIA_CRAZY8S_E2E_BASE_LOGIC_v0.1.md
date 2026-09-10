# Starteria — Crazy 8s E2E Base Logic

**Versión:** v0.1  
**Estado:** Referencia de experiencia para diseño y testing  
**Usuario inicial:** Portfolio Lead funcional  
**Propósito:** Congelar la experiencia objetivo que conecta prioridad de negocio, iniciativas, ejecución, evidencia y decisión sin obligar al usuario a comprender la taxonomía interna de Starteria.

---

## 1. Hipótesis de usuario

El usuario inicial es una persona responsable de **varias apuestas/iniciativas** o de ciclos sucesivos de iniciativas y necesita mantener claridad sobre:

- qué quiere mover el negocio;
- qué iniciativas están intentando moverlo;
- cuáles están alineadas o no;
- dónde existe solapamiento, duplicidad o conflicto;
- qué está bloqueado;
- qué evidencia existe;
- qué necesita atención;
- qué decisión debería prepararse.

El usuario puede tener cargos como:
- Innovation Lead;
- Transformation Lead;
- Product Lead;
- Marketing Lead;
- Growth Lead;
- Operations Lead;
- PMO / Strategy;
- responsable de un programa de iniciativas.

La definición funcional no depende del cargo, sino de su responsabilidad sobre una cartera de apuestas.

---

## 2. Problema que Starteria intenta validar

Hipótesis de problema:

> **Los responsables de varias iniciativas tienen dificultades para mantener trazabilidad consistente entre lo que el negocio intenta conseguir, las iniciativas que están financiando o ejecutando, la evidencia que estas producen y las decisiones de continuidad que deben tomar.**

Síntomas posibles:
- seguimiento manual;
- información distribuida en Excel, PPT, chats, Drive y reuniones;
- iniciativas que permanecen activas con valor incierto;
- duplicidades o solapamientos tardíamente detectados;
- dificultad para explicar contribución a KPIs;
- falta de criterio consistente para continuar, iterar, escalar o cerrar;
- equipos que reportan “avance” sin evidencia suficiente;
- decisiones preparadas tarde.

Estos dolores siguen siendo hipótesis a validar mediante entrevistas y tests de comportamiento.

---

## 3. Tesis de producto

> **Starteria conecta intención de negocio, iniciativas, evidencia y decisiones.**

No busca ser únicamente:
- gestor de proyectos;
- repositorio;
- chatbot;
- framework metodológico;
- generador de ideas.

La experiencia debe permitir responder progresivamente:

```text
¿Qué quiere mover el negocio?
        ↓
¿Qué iniciativas están intentando moverlo?
        ↓
¿Qué sabemos realmente de cada una?
        ↓
¿Qué requiere atención?
        ↓
¿Qué decisión está justificada ahora?
```

---

## 4. Principios de UX derivados

### P1 — El usuario no necesita aprender la ontología para empezar

Starteria debe aceptar lenguaje natural y reconstruir estructura progresivamente.

### P2 — Mínima estructura necesaria

La experiencia visible no debe forzar taxonomía cuando no aporta valor.

Conceptualmente puede verse:

```text
Prioridad → Iniciativa
```

cuando el caso es simple, y expandirse a:

```text
Prioridad → Reto → Iniciativas
```

cuando existe necesidad de agrupar, comparar, activar, detectar cobertura o gobernar distintas respuestas.

**Nota de gobernanza:** el modelo canónico corporativo vigente sigue regido por el Core Logic Contract. Si se decide que `Reto` sea opcional también en el modelo de dominio, deberá registrarse mediante ADR y actualizarse el Core antes de modificar datos.

### P3 — Starteria no acepta una solución sin buscar su justificación

Si el usuario entra con:

> “Quiero implementar un chatbot para ventas”

Starteria no debe saltar a ejecución.

Debe realizar reverse alignment:

```text
Solución
   ↑
¿Qué debería cambiar?
   ↑
¿Qué métrica/señal representa el cambio?
   ↑
¿Qué intención de negocio soporta?
   ↑
¿Cómo sabremos si merece continuar?
```

### P4 — Steps no es la puerta de entrada del Portfolio Lead

Portfolio responde:

> ¿Estamos trabajando en las cosas correctas?

Steps responde:

> ¿Estamos desarrollando correctamente esta iniciativa y generando evidencia suficiente para decidir?

Una iniciativa entra a Steps cuando necesita ser desarrollada/reconstruida con rigor, no automáticamente por existir en el portafolio.

### P5 — Conversación para trabajar, estructura para recordar, portfolio para decidir

La interfaz puede ser flexible; el estado gobernado debe ser estructurado y trazable.

---

# CRAZY 8s

---

# 1. Landing / Primer valor

## Job

Conseguir que el Portfolio Lead entienda rápidamente qué problema aborda Starteria y pueda empezar sin conocer su metodología.

## Promesa propuesta

### Convierte tus iniciativas en decisiones conectadas al negocio.

Subcopy:

> Starteria conecta prioridades y métricas con las iniciativas de tu equipo para mostrar qué está alineado, qué se solapa, qué está bloqueado y qué merece continuar.

## Pregunta principal

### ¿Qué necesitas conseguir o entender de tus iniciativas?

Input libre.

Ejemplos:
- Quiero aumentar las ventas en 200 este trimestre.
- No sé cuáles de mis iniciativas realmente contribuyen a nuestros objetivos.
- Tengo que presentar a dirección qué está pasando con nuestras iniciativas.
- Creo que distintos equipos están trabajando en soluciones parecidas.

## Preview

Mostrar un ejemplo ilustrativo de la claridad futura:

```text
8 iniciativas
5 alineadas
2 posibles solapamientos
1 bloqueada
1 requiere decisión
```

Etiqueta obligatoria: **Ejemplo de lectura Starteria**.

## Capacidades comunicadas

```text
ALINEAR → DETECTAR → SEGUIR → DECIDIR
```

## CTA

**Analizar mi situación**

## IA

Puede:
- detectar intención;
- detectar estado de entrada;
- extraer información explícita;
- identificar solution-first;
- preparar preguntas.

No puede:
- crear objetos corporativos;
- declarar alineamiento;
- generar retos definitivos;
- llevar automáticamente a Steps;
- tomar decisiones.

## Persistencia

Antes de confirmación solo existe contexto temporal/provisional.

## Valor

> “Puedo empezar desde mi realidad; no necesito aprender Starteria primero.”

---

# 2. Diagnóstico inicial / Mirada Starteria

## Job

Demostrar que Starteria comprende la situación y puede aportar criterio antes de pedir configuración o datos exhaustivos.

## Secuencia

```text
Input
↓
Interpretación
↓
Máximo ~3 preguntas críticas
↓
Primera lectura
```

## Lo que debe mostrar

### Esto es lo que entendimos

- intención / resultado;
- situación actual;
- señal/KPI cuando existe;
- qué está claro;
- qué falta;
- qué parece ser el principal problema de gobernanza.

### Mirada Starteria

Puede organizar la lectura en dimensiones como:
- claridad del resultado;
- métrica/señal;
- visibilidad de iniciativas;
- evidencia;
- ownership;
- restricciones.

No mostrar “probabilidad de éxito” sin modelo/evidencia suficientes.

## Caso solution-first

Si el usuario introduce una solución:

> Entiendo la solución que quieres probar. Antes de trabajarla, quiero comprobar qué debería justificar que exista.

Preguntas candidatas:
1. ¿Qué tendría que cambiar en el negocio si funciona?
2. ¿Qué señal o métrica mostraría ese cambio?
3. ¿Qué tendría que ocurrir para justificar seguir invirtiendo tiempo/recursos?

## Human checkpoint

El usuario puede:
- confirmar;
- corregir;
- agregar contexto.

## Valor

> “Starteria no solo repite mi input; identifica qué debería aclararse antes de actuar.”

---

# 3. Registro + creación propuesta del espacio

## Job

Convertir el contexto provisional en un workspace gobernado sin permitir que inferencias IA se conviertan silenciosamente en verdad corporativa.

## Entrada

Después del primer valor, el usuario decide continuar.

CTA orientado al resultado:
- **Quiero ordenar mi portafolio**
- **Continuar con mi organización**

## Registro

Crear usuario / organización según el modelo definido.

## Importación

Después del registro puede habilitarse progresivamente:
- XLSX / CSV / texto como P0 recomendado;
- otros formatos posteriormente.

## Starteria propone, el usuario confirma

Mostrar:

```text
Esto es lo que Starteria propone crear/ordenar
```

Puede incluir:
- prioridad estratégica candidata;
- KPI/señal;
- retos/focos candidatos cuando realmente aportan estructura;
- iniciativas detectadas/importadas;
- información pendiente.

No publicar automáticamente.

## Estados

```text
proposed
→ user_review
→ corrected / confirmed
→ published
```

## Valor

> “Starteria convierte información dispersa en una estructura que puedo revisar antes de adoptarla.”

---

# 4. Home del Portfolio Lead / Centro de atención

## Job

Responder:

> **¿Qué requiere atención hoy?**

No funcionar como dashboard estático.

## Contenido principal

### Resumen
- prioridades/frentes activos;
- iniciativas activas;
- decisiones pendientes;
- alertas relevantes.

### Attention Queue

Tipos candidatos:
- desalineamiento;
- posible duplicidad;
- solapamiento;
- contradicción;
- conflicto de recursos;
- bloqueo;
- gap de evidencia;
- decisión requerida;
- solicitud de equipo.

Cada alerta debe mostrar:

```text
Qué pasa
Por qué importa
Qué evidencia/razón existe
Qué recomienda Starteria
Qué acción puede realizar el humano
```

## Copilot contextual

Panel lateral opcional.

Puede:
- explicar;
- consultar el contexto visible;
- proponer edición;
- proponer nuevo foco/reto;
- sugerir acción.

No modifica silenciosamente objetos críticos.

## Navegación P0 recomendada

```text
Inicio
Portafolio
Decisiones
+ Crear / importar
```

Evitar convertir cada objeto de dominio en una sección principal.

## Valor

> “No necesito revisar todas las iniciativas para saber dónde intervenir.”

---

# 5. Vista de Prioridad Estratégica / Frente

## Job

Entender qué resultado quiere mover la organización y cómo está siendo abordado.

## Lo que muestra

- prioridad/frente;
- resultado deseado;
- KPI/señal;
- baseline cuando exista;
- target cuando exista;
- horizonte;
- alertas de precisión;
- focos/retos relacionados cuando existen;
- iniciativas relacionadas;
- gaps de cobertura.

## Copilot

Puede:
- señalar ambigüedad;
- proponer mejorar precisión;
- sugerir que un nuevo reto no es necesario;
- proponer un nuevo foco como hipótesis;
- mostrar impacto de un cambio antes de aplicarlo.

## Human checkpoint

Cambios materiales requieren confirmación y versionado.

## Regla de estructura progresiva

Si una prioridad tiene una única iniciativa y no existe necesidad de agrupar/comparar/activar otras respuestas, la UX no debe añadir taxonomía solo por completitud estética.

Si aparecen varias iniciativas o espacios de intervención, Starteria puede proponer estructura adicional.

## Valor

> “Puedo ver qué estamos intentando mover y cómo el trabajo activo se relaciona con ello.”

---

# 6. Vista de Reto / Cobertura / Iniciativas

## Cuándo existe

El Reto aporta valor cuando se necesita:
- descomponer una prioridad;
- activar equipos;
- recibir varias propuestas;
- agrupar respuestas;
- analizar cobertura;
- comparar apuestas;
- detectar redundancia;
- gobernar una decisión común.

## Job

Responder:

> **¿Cómo estamos abordando este espacio y qué está faltando/sobrando?**

## Lo que muestra

- definición del reto;
- KPI/señal;
- alcance/restricciones;
- cobertura;
- iniciativas asociadas;
- owners/equipos;
- Step/estado;
- evidencia;
- alertas;
- gaps;
- decisiones.

## Análisis IA

Puede identificar:
- posible duplicidad;
- solapamiento;
- contradicción;
- conflicto de recursos;
- gap de cobertura;
- iniciativa sin alineamiento suficiente.

Debe explicar por qué.

Nunca presentar similitud semántica como prueba definitiva de duplicidad.

## Activación

Dos acciones diferentes:

### Asignar una iniciativa existente

```text
Initiative → owner/equipo
```

### Invitar a abordar un reto

```text
Challenge Assignment / Initiative Brief
→ persona/equipo
→ propuesta
→ revisión
→ Initiative
```

No crear iniciativas vacías que cuenten como iniciativas reales.

## Solicitudes de equipo

Separarlas de señales del sistema.

Ejemplo:
- acceso;
- reunión;
- sponsor;
- recurso;
- decisión;
- dependencia.

Cada solicitud queda vinculada a iniciativa/contexto.

## Valor

> “Puedo detectar cobertura, redundancia y bloqueos sin perseguir manualmente a cada equipo.”

---

# 7. Detalle de Iniciativa + Steps

## Job

Responder:

> **¿Qué intenta conseguir esta iniciativa, qué sabemos, qué falta y qué debería ocurrir después?**

## Overview

Mostrar:
- intención/prioridad vinculada;
- reto cuando corresponda;
- owner/equipo;
- estado de alineamiento;
- ciclo;
- Step actual;
- contribución esperada;
- evidencia;
- bloqueos;
- siguiente hito;
- decisión objetivo.

## Steps

Skeleton estable:

```text
Step 0 — Enmarcar el ciclo
Step 1 — Establecer verdad y foco
Step 2 — Diseñar/preparar lo ejecutable
Step 3 — Ejecutar, observar y aprender
Step 4 — Cerrar el ciclo y preparar decisión
```

La IA adapta:
- preguntas;
- profundidad;
- ejemplos;
- outputs;
- evidencia requerida;
- checkpoints;
- ruta.

No adapta arbitrariamente la función de cada Step.

## Iniciativas importadas

Usan gating retroactivo.

Starteria reconstruye:
- qué ya existe;
- qué corresponde a cada función de Step;
- qué gaps críticos permanecen.

No obliga a rehacer trabajo válido solo para satisfacer orden visual.

## Alertas al Portfolio Lead

El Initiative Owner puede solicitar soporte contextual.

Toda solicitud debe registrar:
- situación;
- impacto;
- ayuda requerida;
- owner;
- fecha;
- estado.

## Valor

> “El equipo sabe qué debe producir para avanzar y el Portfolio Lead obtiene trazabilidad sin gestionar el detalle de ejecución.”

---

# 8. Decisión + retorno al Portfolio

## Job

Convertir evidencia de la iniciativa en una decisión humana explícita y actualizar la lectura del portafolio.

## Output de iniciativa

Brief / Decision Package con:
- decisión solicitada;
- contexto estratégico;
- trabajo realizado;
- evidencia;
- resultado vs baseline/target;
- claims y fuerza de evidencia;
- aprendizajes;
- riesgos;
- límites de atribución;
- recomendación del equipo/IA;
- alternativas de continuidad.

## Recomendación IA

Puede proponer:
- continuar validando;
- iterar;
- pivotear;
- escalar;
- implementar;
- handoff;
- pausar;
- cerrar con aprendizaje.

Debe explicar:
- evidencia usada;
- faltantes;
- incertidumbre;
- límites.

No toma la decisión organizacional.

## Autoridad humana

La autoridad depende del tipo de decisión.

El sistema debe indicar:
- quién recomienda;
- quién decide;
- quién ejecuta el siguiente movimiento.

## Retorno al portafolio

Una decisión actualiza no solo la iniciativa.

También puede actualizar:
- cobertura del reto;
- lectura de la prioridad;
- alertas;
- recursos;
- aprendizajes reutilizables;
- benefit tracking cuando corresponda.

## Closed loop

```text
ESTRATEGIA
   ↓
INICIATIVA / RETO
   ↓
STEPS
   ↓
EVIDENCIA
   ↓
DECISIÓN
   ↓
PORTFOLIO
   ↓
NUEVA LECTURA / NUEVO CICLO
```

## Valor

> “Las iniciativas no terminan en un entregable; terminan en una decisión trazable y en aprendizaje para el portafolio.”

---

## 5. Diferenciación de tipos de entrada

La misma experiencia debe soportar varios puntos de entrada.

### Strategy-first

> Quiero aumentar ventas 20%.

Starteria reconstruye intención/KPI/contexto antes de proponer trabajo.

### Portfolio-first

> Tengo 20 iniciativas y no sé si están alineadas.

Starteria prioriza reconstrucción/alineamiento antes de generar nuevas iniciativas.

### Solution-first

> Quiero implementar un chatbot.

Starteria realiza reverse alignment antes de entrar a ejecución.

### Reporting-first

> Mañana tengo comité y necesito presentar estado.

Starteria identifica necesidad de lectura de portafolio, estado, evidencia y decisiones.

### Governance-first

> Necesito una metodología consistente para que los equipos desarrollen iniciativas.

Starteria conecta activación de retos/iniciativas con Steps y seguimiento de Portfolio.

Todos convergen en el mismo sistema gobernado.

---

## 6. Qué no debe convertirse Starteria

La experiencia se considera desviada si termina percibiéndose principalmente como:
- Jira/Monday para innovación;
- Notion con IA;
- ChatGPT con plantillas;
- sistema de reportes;
- metodología rígida convertida en formularios.

El comportamiento diferencial buscado es:

> **Starteria mantiene trazabilidad entre por qué existe una iniciativa, qué evidencia genera y qué decisión debería habilitar.**

---

## 7. Principios de intervención IA/Humano

### IA propone

Puede:
- interpretar;
- estructurar;
- inferir;
- cuestionar;
- comparar;
- detectar gaps;
- sugerir;
- recomendar.

### Humano confirma/decide

Debe intervenir en:
- contexto crítico ambiguo;
- estructura estratégica material;
- alineamiento;
- activación;
- cambios materiales;
- validaciones requeridas;
- decisiones de continuidad/inversión/cierre.

### Sistema registra

Backend conserva:
- estado;
- provenance;
- historial;
- versiones;
- decisiones;
- relaciones entre objetos.

---

## 8. Señales que el E2E debe hacer visibles

Taxonomía candidata:

### Portfolio/system signals
- alignment_gap;
- possible_duplicate;
- overlap;
- strategic_conflict;
- resource_conflict;
- coverage_gap;
- evidence_gap;
- blocked;
- decision_required.

### Team requests
- access_request;
- meeting_request;
- sponsor_request;
- resource_request;
- decision_support;
- external_dependency.

No mezclar ambas categorías aunque se presenten juntas en Attention Queue.

---

## 9. Hipótesis de valor a validar

El E2E debe permitir comprobar si el Portfolio Lead percibe valor en:

1. conectar iniciativas con resultados/KPIs;
2. descubrir iniciativas sin suficiente justificación;
3. encontrar solapamientos/duplicidades/gaps;
4. recibir estado/evidencia sin seguimiento manual intensivo;
5. identificar rápidamente qué requiere atención;
6. preparar decisiones de continuidad con evidencia;
7. reutilizar aprendizajes en el portafolio.

No asumir que todos son igual de valiosos.

---

## 10. Preguntas de test recomendadas

No preguntar “¿te gusta?”.

Preguntar:
- ¿Qué crees que hace Starteria?
- ¿Qué problema te parece que está resolviendo?
- ¿Qué parte de esto ya haces hoy?
- ¿Cómo lo haces?
- ¿Qué parte sería difícil recrear con ChatGPT/Excel/Notion/Jira?
- ¿En qué momento viste algo que normalmente tienes que hacer manualmente?
- ¿Qué información no confiarías a Starteria todavía?
- ¿Qué alerta realmente te haría actuar?
- ¿Qué decisión te gustaría poder tomar desde aquí?
- Si Starteria desapareciera mañana, ¿qué perderías?

---

## 11. Criterio de éxito conceptual

Un tester nuevo debería poder entender, sin explicación del creador:

> “Starteria conecta lo que el negocio quiere conseguir con las iniciativas que están intentando moverlo, ayuda a ver qué requiere atención y hace que cada iniciativa avance con evidencia hasta que exista una decisión.”

Si la explicación espontánea es solamente:
- “gestiona proyectos”;
- “es una IA de innovación”;
- “es un dashboard”;
- “es un chatbot”;

la experiencia todavía no expresa suficientemente la tesis de producto.

---

## 12. Relación con el Development Harness

Este documento es una **referencia E2E de producto/experiencia**.

No reemplaza el Core Logic Contract.

Debe utilizarse para derivar:
- Experience Logic Contracts;
- Agent Contracts;
- Skill Contracts;
- Tech Specs;
- prototipos;
- tests E2E.

Si una decisión contenida aquí entra en conflicto con un Invariante Core vigente, se debe:

```text
identificar conflicto
→ crear ADR si se propone cambiar Core
→ resolver autoridad
→ actualizar contratos
→ implementar
```

---

## 13. Principio final

> **Starteria empieza desde la realidad que el usuario ya tiene, construye únicamente la estructura necesaria para darle trazabilidad y utiliza Steps allí donde hace falta generar evidencia suficiente para tomar una decisión.**
