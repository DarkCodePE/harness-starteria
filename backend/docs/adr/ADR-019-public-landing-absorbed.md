# ADR-019: Absorber el landing público en `front/` y rutear `/` → landing → piloto

## Status
Accepted — 2026-06-03

## Date
2026-06-03

## Context

`https://starter-ia.com/` (raíz) mandaba directo a login: en
`front/src/app/routes.ts` el index de `/` hacía `redirect('/dashboard')` bajo
`AppLayout`, que tiene guard de auth → rebota a `/auth`. No había página de
marketing pública.

Existía un landing ya diseñado (export de Figma) en la carpeta `landing/`,
fuera del build de la app. Stack idéntico al de `front/` (React + Vite +
Tailwind + el mismo `theme.css`/`fonts.css`), por lo que es portable 1:1. Es
esencialmente un solo `landing/src/app/App.tsx` (página estática con Tailwind +
`lucide-react`) más una imagen importada vía `figma:asset/…png`. Sus CTAs
("Postular al piloto", "Quiero sumarme al piloto") apuntaban a un externo
(`starteria.taplink.site`), no al piloto interno que ya construimos
(`/public/start`, ADR-015/016/018).

Objetivo: absorber el landing dentro de `front/` **sin perder el diseño** y que
`/` lo muestre y rutee al piloto interno.

## Decision

1. **Portar como componente, no como app standalone.** `landing/src/app/App.tsx`
   se copia a `front/src/app/pages/LandingPage.tsx` exportando `LandingPage`. El
   `main.tsx`/`RouterProvider` del landing se descartan; el front ya los tiene.

2. **Asset sin resolver Figma + optimizado a WebP.** El front NO incluye el
   `figmaAssetResolver` del `vite.config` del landing (y no se añade, para no
   acoplar el build a Figma). El screenshot original (un JPEG 4676×2448 de
   ~2.7 MB con extensión `.png`) se redimensiona a 2400px de ancho y se convierte
   a **WebP q82** → `front/src/assets/starteria-dashboard.webp` (~123 KB, −96%).
   Se importa con ruta relativa normal — Vite lo procesa como asset estático.

3. **`/` = landing público para todos.** Se agrega `LandingPage` como **index de
   `RootLayout`** (no de `AppLayout`), por lo que queda **fuera del guard de
   auth**. Se elimina el `{ index: true, loader: () => redirect('/dashboard') }`
   de `AppLayout`. Las rutas autenticadas (`/dashboard`, `/projects/*`,
   `/portfolio/*`) y públicas (`/public/*`, `/auth`) quedan intactas.

4. **CTA condicional según sesión.** El botón del header usa `useApp()`:
   - sesión activa → "Ir a mi panel" (`/dashboard`).
   - anónimo → "Iniciar sesión" (`/auth`).
   No se redirige automáticamente al dashboard a usuarios autenticados — `/` es
   marketing-first y siempre muestra el landing.

5. **CTAs de piloto internas.** Todos los `<a href="https://starteria.taplink.site/">`
   se reemplazan por navegación interna de React Router (`useNavigate`/`Link`) a
   **`/public/start`**. Se elimina la dependencia del taplink externo.

## Consequences

- **Positivas**: una sola SPA y un solo deploy; el diseño se versiona en el repo;
  navegación sin recarga del landing al piloto; `/` deja de rebotar a login.
- **Negativas / deuda**: ninguna pendiente. La carpeta `landing/` (export
  original de Figma, fuera del build) se **eliminó** una vez absorbida; el
  diseño vive ahora versionado en `LandingPage.tsx`. El asset se sirvió como
  WebP optimizado (~123 KB) en lugar del PNG/JPEG de 2.7 MB.
- El landing usa Tailwind utility classes ya disponibles en `front` (mismo
  `tailwind.css`/`theme.css`), por lo que no requiere CSS adicional.

## Traceability

- Issue: nmindFa/Dashboardstarteria#71 · Milestone #4
- Relacionado: ADR-015 (lead capture), ADR-016 (refine público), ADR-018
  (código piloto → proyecto). El piloto interno destino es `/public/start`.
- Método: SPARC S/P/A/R/C.
