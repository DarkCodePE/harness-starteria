# Plantilla de revisión

Un caso que nadie revisó se corre igual, y su resultado vale menos. Copiá el bloque, llenalo entero,
y guardalo en `$STARTERIA_STATE_ROOT/revisiones/<id-del-caso>.md`.

```text
CASE_ID:
FECHA:
QUIEN REVISO:
CASO LEIDO DE:    $STARTERIA_STATE_ROOT/casos/<archivo> / me lo pasaron a mano / no lo encontré

1. DE DONDE SALIO LO ESPERADO
   cita:          <archivo y sección de doc/ que lo sostiene>
   veredicto:     del contrato / copiado de la salida del agente / no se puede rastrear

2. YA ESTA CUBIERTO
   casos que se le parecen:   <ids, o "ninguno">
   veredicto:     nuevo / duplicado de <id> / variante más dura de <id>

3. DOS PERSONAS LO PUNTUARIAN IGUAL
   frases no puntuables encontradas:   <las que dicen "bien", "entiende", "correcto">
   veredicto:     puntuable / mide al que puntúa

4. LO PROHIBIDO ES DE ESTE INPUT
   lo específico:  <qué prohíbe este caso más allá de los nueve fallos duros>
   veredicto:     específico / solo repite los fallos duros

VEREDICTO:        LISTO / AJUSTAR / HALLAZGO

SI ES AJUSTAR:
<el cambio concreto, escrito. No "mejorar lo esperado": qué frase sale y qué frase entra>

SI ES HALLAZGO:
<qué debería decir algún contrato y no dice, y a qué nivel de autoridad le corresponde>
```

## Antes de darlo por terminado

- ¿Leíste el caso **sin imaginar** qué contestaría el agente?
- ¿Los cuatro chequeos tienen veredicto, incluso los que pasaron?
- ¿Un `AJUSTAR` dice qué frase sale y qué frase entra, o solamente que algo está flojo?
- Si revisaste una tanda, ¿hay un archivo por caso, y dijiste cuántos quedaron sin revisar?
