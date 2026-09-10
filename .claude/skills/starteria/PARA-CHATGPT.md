# Usar este harness en ChatGPT

Funciona igual, con un armado previo de diez minutos que se hace una sola vez.

## 1. Creá un Proyecto

En ChatGPT, **Proyectos → Nuevo proyecto**. Llamalo `Starteria - Portfolio Entry`.
Un Proyecto y no un chat suelto, porque los archivos quedan disponibles en todas las
conversaciones de adentro.

## 2. Subí los contratos

Los nueve archivos de `doc/`, tal cual están:

```text
CONTRATO_LOGICA_CORE_STARTERIA_MVP_v0.2_ES(1).md
PORTFOLIO_ENTRY_AGENT_CONTRACT_v0.1.md
PORTFOLIO_ENTRY_AI_HARNESS_v0.1.md
STARTERIA_CRAZY8S_E2E_BASE_LOGIC_v0.1.md
STARTERIA_DEVELOPMENT_HARNESS_v0.1.md
entry-01-intent-detection_SKILL_v0.1.md
entry-02-context-extraction_SKILL_v0.1.md
entry-03-reverse-alignment_SKILL_v0.1.md
entry-04-question-planner_SKILL_v0.1.md
```

## 3. Subí los comandos, renombrándolos

Acá hay una trampa: en Claude Code todos los comandos se llaman `SKILL.md` y se distinguen por la
carpeta. ChatGPT no tiene carpetas, así que si los subís tal cual vas a terminar con ocho archivos
llamados igual y el modelo no va a saber cuál es cuál.

**Renombralos al subirlos**, usando el nombre de la carpeta:

| Archivo original | Subilo como |
|---|---|
| `starteria/SKILL.md` | `starteria.md` |
| `starteria/MAPA-DE-DOCUMENTOS.md` | `starteria-MAPA-DE-DOCUMENTOS.md` |
| `starteria/GLOSARIO.md` | `starteria-GLOSARIO.md` |
| `starteria-afilar/SKILL.md` | `starteria-afilar.md` |
| `starteria-autoridad/SKILL.md` | `starteria-autoridad.md` |
| `starteria-probar/SKILL.md` | `starteria-probar.md` |
| `starteria-probar/RUBRICA.md` | `starteria-probar-RUBRICA.md` |
| `starteria-probar/REGISTRO.md` | `starteria-probar-REGISTRO.md` |
| `starteria-caso/SKILL.md` | `starteria-caso.md` |
| `starteria-caso/PLANTILLA.md` | `starteria-caso-PLANTILLA.md` |
| `starteria-decision/SKILL.md` | `starteria-decision.md` |
| `starteria-decision/PLANTILLA-ADR.md` | `starteria-decision-PLANTILLA-ADR.md` |
| `starteria-cierre/SKILL.md` | `starteria-cierre.md` |
| `starteria-glosario/SKILL.md` | `starteria-glosario.md` |

Los enlaces internos entre archivos van a quedar rotos (apuntan a rutas de carpetas). No importa:
el modelo tiene todos los archivos a la vista y los encuentra por nombre.

## 4. Pegá esto en las instrucciones del Proyecto

Copiá el bloque completo, tal cual, en **Instrucciones** del Proyecto:

```text
Sos el asistente del harness de Portfolio Entry de Starteria, para gente de producto que no es
técnica. Los contratos y los comandos están en los archivos del Proyecto.

Cuando la persona escriba uno de estos comandos, buscá el archivo con ese nombre y seguí sus
instrucciones al pie de la letra, incluidas las que dicen qué NO podés hacer:

/starteria             mapa: qué comando corresponde a cada situación
/starteria-afilar      entrevista por rondas para afilar una idea
/starteria-autoridad   qué contrato manda, si hay conflicto, si hace falta ADR
/starteria-probar      corre un caso del AI Harness y lo puntúa
/starteria-caso        convierte una conversación real en un caso nuevo
/starteria-decision    registra un ADR
/starteria-cierre      deja el estado escrito para la próxima sesión
/starteria-glosario    explica un término del contrato

Si escribe algo que no es un comando, respondé normal, y si su situación encaja con alguno,
ofrecelo en una línea.

Reglas que valen siempre, con comando o sin comando:
- La IA propone, la persona decide. No apruebes, no confirmes, no cierres nada por tu cuenta.
- Nunca inventes un KPI, un baseline, un target ni una evidencia. Si no está en el texto, falta.
- Nunca crees ni propongas crear una Iniciativa, un Reto, un Frente, un Step ni una Decisión.
- Distinguí siempre lo que la persona dijo de lo que vos dedujiste.
- Si dos documentos se contradicen, gana el de más autoridad segun starteria-MAPA-DE-DOCUMENTOS.md,
  y decilo en voz alta en vez de elegir una lectura por tu cuenta.
- Escribí en español llano. Si usás un término del contrato, explicalo en la misma línea.
```

## 5. Probá que quedó bien

Abrí un chat dentro del Proyecto y escribí `/starteria`. Tiene que responderte con el mapa de los
ocho comandos. Si te responde otra cosa, o los archivos no subieron o las instrucciones quedaron
en el chat en vez de en el Proyecto.

## Lo único que cambia respecto de Claude Code

**`/starteria-probar` necesita dos chats, no uno.**

El comando separa *responder* de *puntuar*, porque un modelo que ve la rúbrica y la respuesta
esperada antes de contestar se saca mejor nota de la que merece. En Claude Code esa separación la
hace un subagente. En ChatGPT la hacés vos:

1. **Chat A, "responder".** Abrilo dentro del Proyecto. Pegá el bloque de instrucciones que
   `/starteria-probar` te da para esta fase, y después el input del caso. Copiá la respuesta.
2. **Chat B, "puntuar".** Volvé al chat donde corriste `/starteria-probar`, pegá esa respuesta, y
   ahí se puntúa contra la rúbrica.

Si te da fiaca y hacés todo en un chat, el comando igual funciona, pero escribe en el registro que
el resultado está inflado. Eso es a propósito.

**El resto de los comandos no guardan nada.** En Claude Code, `/starteria-cierre` puede escribir el
archivo de bitácora. En ChatGPT te devuelve el bloque y lo pegás vos donde lleven el estado.
