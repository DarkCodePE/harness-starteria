---
id: ADR-005
title: "Los comandos citan `doc/`; solo dos archivos derivan contenido, y declaran que `doc/` gana"
status: proposed
type: standard
date: 2026-09-10
deciders: [producto]
supersedes: null
superseded_by: null
aprobado_por: null
aprobado_en: null
review_trigger: "primera vez que `doc/` cambie: medir si los tres derivados quedaron viejos sin que nadie lo notara"
tags: [harness, autoridad, duplicacion]
---

# ADR-005: Los comandos citan `doc/`; solo dos archivos derivan contenido, y declaran que `doc/` gana

## 1. Contexto y problema

Los comandos necesitan material de `doc/`: la rúbrica, los fallos duros, los valores de
`entry_state`, la cadena de autoridad. Copiarlo adentro los haría autosuficientes y rápidos.

Pero el Development Harness §1 dice que el código implementa contratos y no los redefine, y una
copia es una redefinición con retardo: el día que `doc/` cambie, la copia sigue diciendo lo viejo
y nadie se entera, porque una copia desactualizada no falla, contesta distinto.

## 2. Decisión

**Regla general: citar, no copiar.** Los comandos nombran documento y sección, y leen de `doc/` en
el momento.

**Tres excepciones**, porque contienen información que en `doc/` no está escrita en ningún lado:

- **`MAPA-DE-DOCUMENTOS.md`**: la cadena de autoridad es abstracta en el Development Harness §2.
  Cuál de los nueve archivos ocupa cada nivel no está escrito. El mapa lo dice, y de paso nombra los
  tres documentos que se dan por existentes y no están.
- **`GLOSARIO.md`**: las definiciones existen desparramadas en cuatro contratos, en el vocabulario
  del contrato. La traducción a español llano no existe, y es la razón de ser del harness.
- **`RUBRICA.md`**: es el caso más incómodo, porque sí duplica. Las siete dimensiones y los nueve
  fallos duros están tal cual en el AI Harness §3 y §4. Se duplica igual porque puntuar exige
  tenerlos delante en formato de tabla, y mandar a alguien a §4 en la mitad de una corrida es
  perderlo. Encabeza con "si algo acá no coincide con `doc/`, gana el documento".

## 3. Alternativas consideradas

- **Copiar todo lo necesario en cada comando:** rechazada. Multiplica los puntos de deriva y
  convierte al harness en una fuente paralela de verdad, que es exactamente lo que el Development
  Harness prohíbe.
- **No copiar nada, ni la rúbrica:** rechazada. Puntuar siete dimensiones saltando a otro documento
  por cada una es inviable, y el que más lo sufre es el usuario no técnico.
- **Generar los derivados desde `doc/` con un script:** rechazada. Contradice `ADR-003` y agrega
  una dependencia de Node a un harness que quiere correr en un chat.

## 4. Consecuencias

**Positivas**
- Un solo lugar con autoridad. `doc/` cambia y los comandos leen lo nuevo, sin tocar el harness.
- Los tres derivados están identificados por nombre, así que la superficie de deriva es conocida y
  chica.

**Negativas y trade-offs aceptados**
- **`RUBRICA.md` puede quedar vieja y no va a fallar: va a puntuar distinto.** Es el peor modo de
  fallo del harness entero, está anotado también en `ARCHITECTURE.md` §8, y no tiene contención
  mecánica por `ADR-003`.
- Citar cuesta lecturas: cada corrida abre varios documentos.
- En ChatGPT, si un archivo de `doc/` no se subió al Proyecto, la cita apunta a la nada. Los
  comandos dicen qué hacer ahí: pedir que lo peguen, no inventar.

## 5. Criterios de aceptación de la decisión

- [x] Los tres derivados declaran que `doc/` gana.
- [x] Ningún otro archivo del harness copia contenido normativo de `doc/`.
- [x] Los 9 fallos duros de `RUBRICA.md` coinciden literalmente con el AI Harness §3, en el mismo
      orden.
- [x] Los 32 ids de caso coinciden con los del documento.

## 6. Gatillos de revisión

La primera vez que `doc/` cambie. Si los tres derivados quedaron viejos sin que nadie lo notara,
hace falta al menos una fecha de última comparación en cada uno.

## Historial

- 2026-09-10 · proposed · `RUBRICA.md` se aceptó como duplicación consciente, no como descuido.
