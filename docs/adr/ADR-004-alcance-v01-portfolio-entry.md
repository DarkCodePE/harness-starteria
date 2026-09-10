---
id: ADR-004
title: "El alcance de v0.1 es Portfolio Entry, no Starteria entero"
status: proposed
type: standard
date: 2026-09-10
deciders: [producto]
supersedes: null
superseded_by: null
aprobado_por: null
aprobado_en: null
review_trigger: "cuando exista el Experience Logic Contract de una segunda experiencia"
tags: [harness, alcance]
---

# ADR-004: El alcance de v0.1 es Portfolio Entry, no Starteria entero

## 1. Contexto y problema

Starteria es ocho pantallas de Crazy 8s, cinco Steps y un portafolio completo. `doc/` describe todo
eso en distintos grados de detalle.

Pero el detalle **operable** existe en un solo lugar: Portfolio Entry tiene Agent Contract, cuatro
contratos de skill y treinta y dos casos con esperado y rúbrica. El resto tiene lógica base y nada
más.

Un harness que abarque todo tendría comandos que apuntan a contratos que no existen.

## 2. Decisión

**v0.1 cubre Portfolio Entry: Pantalla 1, la interpretación provisional y el pase a Pantalla 2.**

Está declarado en el router, en la primera pantalla que ve el usuario, y no como nota al pie.

## 3. Alternativas consideradas

- **Cubrir Starteria entero:** rechazada. Los comandos quedarían llenos de marcas de pendiente, y
  un harness lleno de pendientes enseña que se puede trabajar con pendientes.
- **Portfolio Entry más andamiaje explícito para la próxima experiencia** (carpeta por experiencia,
  suites parametrizadas): rechazada por ahora. Diseñar la generalización sin un segundo caso real
  produce la abstracción equivocada. Cuando exista el segundo contrato, la forma va a ser evidente,
  y hoy sería una adivinanza. El costo de esperar está anotado en `ARCHITECTURE.md` §7: hoy la
  tabla de suites A a I vive adentro de dos comandos.

## 4. Consecuencias

**Positivas**
- Cada comando apunta a un documento que existe y a casos que se pueden correr hoy.
- El límite es visible desde el primer momento, así que nadie espera que el harness cubra Steps.

**Negativas y trade-offs aceptados**
- La tabla de suites está incrustada en `/starteria-probar` y `/starteria-caso`. Agregar otra
  experiencia obliga a tocar esos dos archivos.
- El harness no ayuda con el trabajo de portafolio, Steps ni las otras siete pantallas, que es la
  mayor parte de Starteria.

## 5. Criterios de aceptación de la decisión

- [x] El router declara el alcance en su segundo párrafo.
- [x] Todos los documentos citados por los comandos existen en `doc/`, salvo los tres que el mapa
      declara ausentes con nombre.
- [x] Los 32 ids de caso de la tabla de suites coinciden con el AI Harness.

## 6. Gatillos de revisión

Cuando exista el Experience Logic Contract de una segunda experiencia. Ese es el momento de
parametrizar y no antes.

## Historial

- 2026-09-10 · proposed · elegido sobre "todo Starteria" al ver que solo Portfolio Entry tiene casos.
