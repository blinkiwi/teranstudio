---
version: alpha
name: NoPlan Studio Template System
---

## Overview

Template generator inspirado en noplan.studio. Sistema visual editorial con modo claro/oscuro, tokens semánticos y componentes reutilizables en React (JSX) sin dependencias externas.

## Colors

- `--color-bg`: oklch(0.97 0.01 250) — fondo claro
- `--color-surface`: oklch(1 0 0) — superficie/tarjetas
- `--color-text`: oklch(0.2 0.01 250) — texto principal
- `--color-text-muted`: oklch(0.5 0.01 250) — texto secundario
- `--color-border`: oklch(0.9 0.01 250) — bordes
- `--color-accent`: oklch(0.78 0.16 200) — acento cian
- `--color-primary`: oklch(0.65 0.12 250) — azul principal

Modo oscuro:
- `--color-bg`: oklch(0.16 0.01 250)
- `--color-surface`: oklch(0.22 0.01 250)
- `--color-text`: oklch(0.95 0.01 250)
- `--color-border`: oklch(0.3 0.01 250)

## Typography

- Familia: system-ui stack (sin fuentes externas hotlinked)
- Escala: xs 0.75 → 5xl 3rem
- Line-height: tight 1.25 / normal 1.5 / loose 1.75

## Components

- Navbar con toggle dark mode
- Hero con eyebrow + headline + CTAs
- Grid de features (3 col)
- Pricing cards
- Footer multi-columna

## Rounded

- sm 6px · md 8px · lg 12px · xl 16px

## Spacing

- xs 0.5 · sm 1 · md 1.5 · lg 2 · xl 3 · xxl 4 (rem)

## Tweakables

- `accentColor`: color de acento
- `density`: escala de espaciado (0.8–1.4)
- `darkMode`: booleano