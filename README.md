# Logos Argentina

Directorio de logos/favicons de entidades financieras argentinas para uso rápido en proyectos web.

La app permite:
- buscar entidades por nombre o dominio,
- filtrar por categoría,
- previsualizar y copiar endpoints/curls de Google y DuckDuckGo.

Documentación de API disponible en [`/docs`](http://localhost:3000/docs) al correr la app localmente.

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- pnpm

## Requisitos

- Node.js LTS (recomendado: 22+)
- `pnpm` instalado globalmente

## Setup local

```bash
pnpm install
pnpm dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Scripts disponibles

- `pnpm dev`: entorno de desarrollo
- `pnpm lint`: lint del proyecto
- `pnpm build`: build de producción
- `pnpm start`: correr build en modo producción

Hoy el proyecto no requiere variables de entorno obligatorias para ejecutarse localmente.

## Estructura del proyecto

Puntos clave para contributors:

- `app`: layout global y página principal
  - `app/page.tsx`: búsqueda, filtros, render de categorías, panel de configuración
  - `app/layout.tsx`: metadata y estructura raíz
- `components`: componentes de UI y bloques funcionales
  - `components/category-section.tsx`: render por categoría
  - `components/logo-card.tsx`: tarjeta de logo/endpoints
  - `components/config-panel.tsx`: controles de parámetros
- `lib`: datos y helpers de dominio
  - `lib/logos-data.ts`: fuente principal de categorías/entidades
  - `lib/config-context.tsx`: estado/configuración de curls y endpoints
  - `lib/utils.ts`: utilidades compartidas

## Cómo contribuir

### Flujo recomendado

1. Forkeá el repo y creá una rama:
   - `feature/<descripcion-corta>` para features
   - `fix/<descripcion-corta>` para correcciones
2. Hacé cambios acotados y enfocados.
3. Validá localmente antes de abrir PR:
   - `pnpm lint`
   - `pnpm build`
4. Abrí un Pull Request con contexto claro:
   - problema/oportunidad,
   - qué cambiaste,
   - por qué este enfoque.

### Guía para cambios frecuentes

#### Agregar o editar entidades

Editá `lib/logos-data.ts` respetando:
- tipos `Category` y `Entity`,
- unicidad de `id` dentro del archivo,
- dominios válidos y sin duplicados innecesarios.

Después verificá en la UI:
- resultados de búsqueda,
- conteos por categoría,
- generación de endpoint/curl.

#### Cambios de UI o interacción

- Ubicá la lógica principal en `app/page.tsx`.
- Si el cambio es reutilizable, movelo a `components`.
- Mantené consistencia visual con componentes de `components/ui`.

## Checklist antes de abrir PR

- [ ] Corre localmente (`pnpm dev`)
- [ ] `pnpm lint` sin errores
- [ ] `pnpm build` sin errores
- [ ] Probé manualmente los flujos afectados
- [ ] La descripción del PR explica impacto y alcance

## Licencia y atribución

Este repositorio distribuye una interfaz y referencias a endpoints públicos de favicons.
Los logos y marcas pertenecen a sus respectivas entidades.

Si vas a reutilizar assets descargados, revisá términos de uso y políticas de marca de cada organización.
