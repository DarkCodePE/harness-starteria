# PRD-01 — Arquitectura de producto, workspaces y navegación

## 1. Metadata

| Campo | Valor |
|---|---|
| Producto | Starteria Platform |
| Módulo | Arquitectura de producto y workspaces |
| Versión | v0.2 Copilot-first |
| Estado | Draft accionable |
| Usuarios principales | Individual, Team Lead, Portfolio Lead |
| Objetivo del release | Presentar Starteria según la operación que el usuario necesita realizar, permitiendo progresar desde una iniciativa privada hasta un portafolio organizacional sin perder información |

## 2. Problema

Starteria corre el riesgo de forzar a todos los usuarios a una de dos experiencias extremas:

- una iniciativa individual dentro de Step 0–4;
- un Portfolio Lead corporativo completo.

Entre ambos existen usuarios que quieren organizar un objetivo de seis meses, varios retos personales, un equipo pequeño o una estructura que todavía no ha sido aprobada por su organización. Si esa persona debe declararse “empresa” o pagar Portfolio Lead antes de entender el valor, se genera fricción. Si todo se mete dentro de una sola iniciativa, se mezclan objetivos, retos, owners y decisiones.

## 3. Objetivo

Crear una arquitectura progresiva donde el usuario pueda elegir o recibir una recomendación sobre el nivel de estructura que necesita:

1. una iniciativa;
2. un Strategic Workspace personal;
3. un Team Workspace;
4. un Portfolio Lead / Enterprise Workspace.

## 4. Principio estructural

Los Steps pertenecen a la iniciativa. Los objetivos/frentes y retos viven por encima de ella.

```text
Objetivo o Frente
└── Reto
    ├── Iniciativa A → Step 0–4
    ├── Iniciativa B → Step 0–4
    └── Iniciativa C → Step 0–4
```

No se permite modelar varios retos independientes como módulos internos de un único Step 0.

## 5. Tipos de workspace

### 5.1 Initiative Workspace

Para desarrollar una unidad de trabajo concreta.

Incluye:

- Revisión inicial.
- Overview.
- Step 0–4.
- evidencia;
- feedback IA;
- outputs individuales;
- reporte de cierre.

### 5.2 Personal Strategic Workspace

Para una persona que desea organizar un objetivo con varias líneas independientes.

Incluye:

- objetivos personales;
- retos;
- iniciativas;
- priorización;
- dependencias simples;
- roadmap consolidado;
- vista privada;
- Step 0–4 por iniciativa.

No incluye inicialmente:

- sponsors corporativos obligatorios;
- challenge owners organizacionales;
- importación masiva;
- comité;
- permisos empresariales;
- auditoría organizacional avanzada.

### 5.3 Team Workspace

Para un equipo pequeño que trabaja varias iniciativas.

Incluye:

- miembros;
- Initiative Owners;
- comentarios;
- assignments;
- permisos básicos;
- vista consolidada;
- reportes de equipo;
- invitaciones limitadas.

### 5.4 Portfolio Lead / Enterprise Workspace

Para gobernar estrategia e iniciativas corporativas.

Incluye:

- organización/programa;
- múltiples frentes;
- KPI, baseline, meta y horizonte;
- retos y modalidades de activación;
- sponsor, challenge owner y owners;
- importación masiva;
- cobertura, solapamientos y decisiones;
- reportes para comité;
- handoff entre áreas;
- seguridad, auditoría y configuración corporativa.

## 6. Journey de selección

### 6.1 Entrada

Starteria pregunta:

> ¿Qué necesitas llevar a cabo?

El usuario puede escribir libremente. La IA analiza estructura, personas y gobernanza.

### 6.2 Recomendación

La plataforma presenta una recomendación explicada:

- **Una iniciativa:** un resultado, un owner y una decisión principal.
- **Objetivo con retos:** varias líneas independientes, gestionadas inicialmente por la misma persona.
- **Trabajo en equipo:** varios responsables que necesitan colaborar.
- **Portafolio:** múltiples áreas, KPI, sponsors, comité o gobernanza.

### 6.3 Selección humana

El usuario puede:

- aceptar;
- elegir una opción menos robusta;
- elegir una opción más robusta;
- empezar privado y convertir después.

## 7. Pantalla “¿Cómo quieres gestionarlo?”

### Componentes

1. Resumen de lo que Starteria entendió.
2. Señales detectadas:
   - resultados independientes;
   - cantidad de personas;
   - áreas;
   - decisiones;
   - necesidad de reporte.
3. Cards de opción.
4. Recomendación destacada.
5. Comparador de capacidades.
6. CTA principal según selección.

### Copy de ejemplo

> Detectamos tres resultados que podrían avanzar y decidirse por separado. Puedes mantenerlos dentro de un objetivo personal o crear un workspace colaborativo para asignar responsables.

## 8. Reglas de recomendación

### Recomendar Initiative Workspace cuando

- existe un resultado principal;
- el usuario lidera la ejecución;
- las actividades dependen del mismo resultado;
- existe una decisión de cierre común.

### Recomendar Personal Strategic Workspace cuando

- hay varios retos o resultados;
- la persona aún explora la estructura;
- no necesita gobernanza corporativa;
- quiere probar el modelo antes de invitar personas.

### Recomendar Team Workspace cuando

- participan varios owners;
- se requieren comentarios, assignments y seguimiento compartido;
- no existe todavía comité o portafolio corporativo formal.

### Recomendar Portfolio Lead cuando

- existen diferentes áreas;
- hay sponsors o challenge owners;
- se requiere importación masiva;
- se reporta a comité;
- hay KPI corporativos;
- se necesita gobernanza, auditoría, handoff o decisiones consolidadas.

## 9. Conversión progresiva

```text
Initiative Workspace
→ Personal Strategic Workspace
→ Team Workspace
→ Portfolio Lead Workspace
```

### Información que debe conservarse

- contexto y versiones;
- StepProgress;
- evidencias;
- archivos;
- comentarios;
- owners;
- decisiones;
- outputs;
- analytics de origen.

### Transformaciones

| Origen | Destino | Transformación |
|---|---|---|
| iniciativa independiente | objetivo personal | se vincula como primera iniciativa |
| objetivo personal | frente estratégico | se solicita KPI, baseline, meta y sponsor |
| subobjetivo personal | reto | se solicita challenge owner y modalidad |
| colaborador | role assignment | se formalizan permisos |
| iniciativa privada | portfolio linked | se agrega organización, frente y reto |

## 10. Monetización y paywall

### Regla

No mostrar paywall antes de que el usuario visualice la estructura recomendada.

### Momentos de upgrade

- invitar a más personas que el límite;
- asignar owners múltiples;
- convertir objetivo personal en frente corporativo;
- activar reportes consolidados;
- importar varias iniciativas;
- configurar sponsor/comité;
- habilitar seguridad y auditoría organizacional.

## 11. Requerimientos funcionales

| ID | Requerimiento | Prioridad |
|---|---|---|
| RF-WSP-001 | El sistema debe permitir crear una iniciativa independiente | MUST |
| RF-WSP-002 | El sistema debe permitir crear un objetivo personal con retos e iniciativas | MUST |
| RF-WSP-003 | Cada iniciativa debe conservar su propio Step 0–4 | MUST |
| RF-WSP-004 | El sistema debe recomendar el workspace según necesidad de gobernanza | MUST |
| RF-WSP-005 | El usuario debe poder elegir otra estructura | MUST |
| RF-WSP-006 | El sistema debe permitir convertir workspace sin perder información | MUST |
| RF-WSP-007 | El sistema debe mostrar capacidades adicionales antes de solicitar upgrade | SHOULD |
| RF-WSP-008 | Portfolio Lead debe exigir organización y permisos contextuales | MUST |
| RF-WSP-009 | Un objetivo personal no debe requerir sponsor corporativo | MUST |
| RF-WSP-010 | Una iniciativa puede permanecer independiente o vincularse posteriormente | MUST |

## 12. Reglas de negocio

1. Los Steps nunca contienen múltiples iniciativas independientes.
2. Un reto puede contener varias iniciativas.
3. Un objetivo personal puede existir sin organización.
4. Un frente corporativo pertenece a una organización/programa.
5. Convertir un workspace no aprueba automáticamente sus iniciativas.
6. La estructura estratégica preliminar puede generarse antes del pago.
7. Las capacidades de gobernanza se habilitan según plan y permisos.
8. Ningún upgrade elimina el origen ni el historial del objeto.

## 13. Modelo de datos mínimo

```typescript
type WorkspaceType =
  | 'initiative'
  | 'personal_strategic'
  | 'team'
  | 'portfolio';

type Workspace = {
  id: string;
  type: WorkspaceType;
  ownerId: string;
  organizationId?: string;
  name: string;
  plan: 'free' | 'pro' | 'strategic' | 'team' | 'portfolio' | 'enterprise';
  status: 'draft' | 'active' | 'archived';
  convertedFromWorkspaceId?: string;
};

type StrategicObjective = {
  id: string;
  workspaceId: string;
  scope: 'personal' | 'organizational';
  name: string;
  objective: string;
  mainKpiOrSignal?: string;
  baseline?: string;
  target?: string;
  horizon?: string;
};
```

## 14. Analytics

- `workspace_recommended`
- `workspace_option_selected`
- `personal_strategic_workspace_created`
- `team_workspace_created`
- `portfolio_upgrade_viewed`
- `workspace_converted`
- `member_invitation_limit_reached`
- `portfolio_feature_requested`

## 15. Criterios de aceptación

1. Un usuario puede estructurar objetivo → retos → iniciativas sin organización.
2. La UI explica por qué recomienda una estructura.
3. El usuario puede elegir una alternativa.
4. Cada iniciativa conserva un core independiente.
5. La conversión a Team o Portfolio conserva datos y vínculos.
6. El paywall aparece por capacidades de colaboración/gobernanza, no por visualizar la estructura.
7. Diseño diferencia claramente iniciativa, objetivo, reto y portafolio.

## 16. Fuera de alcance inicial

- billing completo;
- marketplace de expertos;
- permisos empresariales personalizados por cliente;
- multi-organización por usuario;
- plantillas sectoriales avanzadas.

## 17. Integración con Copilot-first

### Intenciones que activan este PRD

- organizar una sola iniciativa;
- gestionar un objetivo con varias líneas;
- trabajar con varias personas;
- gestionar un portafolio corporativo;
- convertir un workspace existente.

### Inputs mínimos

- diagnóstico de intención y unidad de PRD-02;
- cantidad de resultados/retos;
- participantes y owners;
- necesidad de colaboración, comité, importación o auditoría.

### Output hacia el orquestador

- workspace recomendado;
- razones y señales;
- capacidades disponibles y restringidas;
- transformación necesaria si existe un workspace previo;
- campos adicionales requeridos.

### Confirmación

El usuario confirma el tipo de workspace. Una recomendación puede aceptarse, modificarse o posponerse.

### Comandos de dominio

- `CreateWorkspaceCommand`
- `ConvertWorkspaceCommand`
- `LinkInitiativeToWorkspaceCommand`

### Proyección en dashboard

- navegación y selector de workspace;
- estructura Objetivo/Frente → Reto → Iniciativa;
- capacidades visibles;
- CTA de conversión o upgrade.

### Regla

El Copiloto puede recomendar un workspace, pero no puede convertirlo sin preview de información conservada, capacidades nuevas y confirmación humana.

