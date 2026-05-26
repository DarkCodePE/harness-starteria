# ADR 2026-05-17 - Centro de mando para Portfolio Lead

## Estado
Aceptado

## Contexto
El modulo Portfolio Lead necesitaba que la pantalla de inicio dejara de comportarse como un resumen plano y funcionara como un punto de lectura ejecutiva para decidir que mirar primero.

El flujo actual ya tenia rutas para frentes estrategicos, retos, iniciativas y decisiones. La decision debia reforzar esa secuencia sin crear un flujo paralelo ni asumir validaciones o evidencia no realizadas.

## Decision
Se convierte `/portfolio/inicio` en un centro de mando con:
- Un riel de acciones primarias para crear frentes, revisar bloqueos, revisar retos y entrar a decisiones.
- Un snapshot ejecutivo basado en el modelo de dominio, no en calculos aislados dentro de la pagina.
- Una cola de atencion para mostrar bloqueos, decisiones y retos listos con siguiente accion recomendada.
- Tarjetas de frentes estrategicos con conteo explicito de bloqueos.

Se agrega `/portfolio/iniciar` como punto de entrada orientador para elegir como comenzar:
- Crear frente estrategico.
- Preparar importacion de iniciativas existentes.
- Crear reto rapido.
- Ir a iniciativas.

La importacion queda marcada como siguiente fase. La interfaz puede abrir un dialogo explicativo, pero no sube archivos, no clasifica datos y no publica informacion.

Tambien se centralizan reglas de dominio para normalizar estados canonicos y legados de frentes, retos, cobertura, iniciativas, pasos, validaciones, evidencia, importacion y decisiones.

## Modulo y Step impactado
Modulo: Portfolio Lead.

Step funcional: capa de gestion transversal del portafolio sobre la secuencia Frente -> Reto -> Activacion -> Iniciativas -> Decision.

Objetivo funcional:
- Ayudar al portfolio lead a entender que esta bloqueado, que falta y que conviene hacer despues.
- Mantener visible la progresion secuencial sin reemplazar los flujos existentes.
- Preparar el modelo para importacion futura sin simular evidencia ni validacion.

## No debe romperse
- La navegacion existente hacia `/portfolio/frentes-estrategicos`, `/portfolio/retos`, `/portfolio/iniciativas` y `/portfolio/decisiones`.
- La lectura de estados legados ya presentes en datos mock o persistidos.
- La regla de que la IA puede orientar, pero no inventar evidencia ni asumir validaciones.
- La narrativa secuencial del producto.

## Consecuencias
Positivas:
- La pagina de inicio ahora prioriza accion y foco ejecutivo.
- Las reglas de estado quedan centralizadas y reutilizables.
- El copy aclara bloqueos, faltantes y siguiente accion.
- La importacion futura queda preparada sin activar funcionalidad incompleta.

Riesgos:
- Hay mas superficie de modelo de dominio, por lo que cambios futuros de estados deben pasar por las funciones de normalizacion.
- La ruta `/portfolio/iniciar` debe mantenerse como orientadora hasta que exista carga real de archivos.

## Verificacion esperada
- Ejecutar `npm run build`.
- Validar navegacion manual desde `/portfolio/inicio` hacia frentes, retos, iniciativas, decisiones e iniciar.
- Confirmar que el dialogo de importacion no permita subir ni publicar datos todavia.
