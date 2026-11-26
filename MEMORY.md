---
schemaVersion: 1
scope: workspace
updatedAt: "2026-07-19T00:17:19.085Z"
workspaceName: "Terán Studio"
---

# Project Memory

## Project Overview
Website Template Generator - clonación de estructura visual de noplan.studio en un framework JSX autocontenido con tokens semánticos y dark mode.

## Current State
Template funcional con preview estable (144 nodos, 0 errores). App.jsx incluye navbar, hero, grid de features, pricing y footer con toggle dark mode. DESIGN.md creado como fuente autoritativa del sistema de diseño.

## Artifacts
- **App.jsx** - Template React/JSX autocontenido (sin imports externos, estilos embebidos)
- **styles.css** - Tokens de diseño semánticos (colores oklch, tipografía, espaciado)
- **template.html** - Versión HTML estática exportable
- **DESIGN.md** - Sistema de diseño documentado

## Design Direction
Framework base para React/Vite con componentes modulares y sistema de tokens adaptable vía TWEAK_DEFAULTS.

## Decisions
- Uso de oklch para colores semánticos
- Dark mode implementado con toggle en navbar
- Componentes encapsulados sin dependencias externas
- Estilos embebidos en componentes para preview sin imports

## Open Questions
- Adaptar a framework específico (Next.js, Vite, etc.)
- Agregar secciones adicionales (blog, contacto, casos de estudio)

## Next Steps
Exportar template.html como base de proyecto nuevo o iterar sobre componentes existentes.