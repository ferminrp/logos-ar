# Loguitos (Logos Argentina)

Directorio de logos/favicons de marcas y entidades argentinas para uso rápido en proyectos web. El catálogo cubre unas 22 categorías (bancos, fintechs, crypto, retail, medios, telecomunicaciones, entes estatales, salud, energía, etc.) más banderas de países.

La app permite:
- buscar entidades por nombre o dominio,
- filtrar por categoría,
- ver la ficha de cada logo, copiar sus URLs y descargarlo en PNG o SVG.

Documentación de API disponible en [`/docs`](http://localhost:4321/docs) al correr la app localmente.

**Producción:** [https://loguitos.app](https://loguitos.app) — documentación en [https://loguitos.app/docs](https://loguitos.app/docs).

## Stack

- Astro 7 + `@astrojs/cloudflare` (Cloudflare Workers)
- React 19 islands + TypeScript
- Tailwind CSS 4 (vía `@tailwindcss/vite`)
- Descarga de logos en el Worker con WASM: `@jsquash/*`, `@cf-wasm/photon` y `@resvg/resvg-wasm` (`sharp` es solo dev dependency para scripts y tests)
- pnpm

## Requisitos

- Node.js LTS (recomendado: 22+)
- `pnpm` instalado globalmente

## Setup local

```bash
pnpm install
pnpm dev
```

Abrí [http://localhost:4321](http://localhost:4321).

## Scripts disponibles

- `pnpm dev`: entorno de desarrollo
- `pnpm lint`: lint del proyecto
- `pnpm typecheck`: `astro check`
- `pnpm test`: tests offline
- `pnpm build`: build de producción
- `pnpm preview`: vista previa del build Astro
- `pnpm start`: Worker local con Wrangler (`dist/server/wrangler.json`, incluye el wrapper post-build; corré `pnpm build` antes)
- `pnpm indexnow:submit-all`: notificar todas las URLs del sitemap a IndexNow
- `pnpm indexnow:ping-changed`: notificar solo URLs con `<lastmod>` cambiado
- `pnpm sync:logos-r2`: subir `public/logos/*` al bucket R2 `loguitos-assets` (salta objetos ya idénticos por MD5/etag; requiere `wrangler login` o `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` con lectura R2 para el listado rápido)
- `pnpm sync:isotipos-r2`: subir `data/isotipos/<slug>.svg` (205 isotipos) a `loguitos.app/logos/<slug>/isotipo.svg` (idempotente; `--dry-run`; requiere `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` con escritura R2 y metadata `source_url` / `source_type` / `synced_at` / `verified_official` cuando aplique; slugs validados contra `data/logos-dataset.json`)

Hoy el proyecto no requiere variables de entorno obligatorias para ejecutarse localmente.

### Worker entry (deploy / previews)

`wrangler.jsonc` en la raíz no define `main`: el bundle real vive en `dist/server/` después de `pnpm build`. Post-build se genera `dist/server/wrapper.mjs` (headers `Link` + cache en `/`, y serving de `/logos/*` desde R2 con fallback a assets estáticos). Wrangler deploy y `wrangler versions upload` desde la raíz siguen el redirect en `.wrangler/deploy/config.json` → `dist/server/wrangler.json` (`main: wrapper.mjs`), que es lo que usan previews como `pr-58-loguitos…`.

### Logos en R2

Las URLs públicas siguen siendo `/logos/<slug>.png` (o `.svg`). En producción el Worker resuelve primero el binding R2 `LOGOS` (`loguitos-assets`, claves `loguitos.app/logos/<slug>/logo.png`) y, si no hay objeto, sirve el PNG de `public/logos/` vía `ASSETS`. Para cargar o actualizar el bucket: `pnpm sync:logos-r2`.

Los **isotipos** SVG viven en `/logos/<slug>/isotipo.svg` (misma política de cache, ETag/HEAD y headers de seguridad SVG que los logos planos). Fallback local: `public/isotipos/<slug>.svg` (generado en `prebuild`). Sync: `pnpm sync:isotipos-r2` (opcionalmente `--dry-run`).

### URL canónica (SEO)

Para override en otros entornos, definí `PUBLIC_SITE_URL` (build y runtime). Sin esa variable, metadata, sitemap y `robots.txt` usan `https://loguitos.app` por defecto.

En Cloudflare Workers, conviene fijar explícitamente en el dashboard (Variable / secret):

```bash
PUBLIC_SITE_URL=https://loguitos.app
```

### Sitemap y Google Search Console

El build genera `public/sitemap.xml` (archivo estático) y valida el XML en `postbuild`. La ruta pública es:

`https://loguitos.app/sitemap.xml`

Si Search Console muestra **Couldn't fetch** después de un deploy:

1. Verificá en vivo con inspección de URL que el sitemap devuelva **200** y XML válido.
2. En **Sitemaps**, eliminá el envío fallido y volvé a enviar la misma URL.
3. Si el error persiste (caché de GSC), probá una URL alternativa para forzar un fetch nuevo, por ejemplo `https://loguitos.app/sitemap.xml?v=2`.
4. En Cloudflare, confirmá que no haya reglas de WAF/firewall que bloqueen a Googlebot.

### `lastmod` real e imágenes en el sitemap

`data/sitemap-lastmod.json` guarda, por URL, un fingerprint del contenido (datos del catálogo, copy SEO, bytes del logo y versión del template) y la fecha en que cambió por última vez. `pnpm build` lo actualiza en `prebuild`; después de tocar el catálogo corré `pnpm sync:sitemap-lastmod` y commiteá el JSON (un test offline falla si quedó desactualizado). Si cambiás el template de una página, subí su número en `PAGE_TEMPLATE_VERSIONS` (`lib/sitemap-lastmod.ts`).

Las páginas `/logo/<slug>` con logo alojado en el catálogo incluyen su imagen en el sitemap (`<image:image>`).

### Markdown para agentes

Cada página HTML tiene un gemelo Markdown prerenderizado: `/index.md`, `/categorias.md`, `/docs.md`, `/logo/<slug>.md`, `/categoria/<id>.md` y `/guia/<slug>.md` (servidos con `X-Robots-Tag: noindex`). La misma URL HTML devuelve Markdown si el request manda `Accept: text/markdown`; eso lo resuelve el wrapper del Worker (`lib/markdown-negotiation.ts`), porque las páginas prerenderizadas no pasan por el middleware de Astro. `llms.txt` enlaza a estas versiones.

### IndexNow

Tras el deploy, el sitio expone la clave de verificación en la raíz (`public/<key>.txt`) y un workflow de GitHub notifica a IndexNow solo las URLs cuyo `<lastmod>` cambió respecto al sitemap anterior (cache en Actions).

Comandos (después de `pnpm build`, que genera `public/sitemap.xml`):

```bash
# Envío inicial o reindex completo (verifica la clave en producción y POST a api.indexnow.org)
pnpm indexnow:submit-all

# Solo URLs con lastmod nuevo o distinto (usa .cache/indexnow-previous-sitemap.xml por defecto)
pnpm indexnow:ping-changed
```

Variables opcionales para `indexnow:ping-changed`:

- `INDEXNOW_FETCH_CURRENT=1` — lee el sitemap en vivo desde `PUBLIC_SITE_URL` / `https://loguitos.app`
- `INDEXNOW_PREVIOUS_SITEMAP_PATH` — ruta al XML baseline anterior
- `INDEXNOW_CURRENT_SITEMAP_PATH` — ruta al sitemap actual (si no se usa fetch)

## Estructura del proyecto

Puntos clave para contributors:

- `src/pages`: rutas Astro (páginas, gemelos `.md`, `api/`, `mcp`, `robots.txt`, `llms.txt`)
- `src/layouts`, `src/styles/globals.css`: layout base y estilos globales (Tailwind)
- `views`: vistas React de cada página
- `components`: componentes de UI y bloques funcionales (`components/ui`: primitivas shadcn en uso)
- `lib`: datos y helpers de dominio
  - `lib/logos-data.ts`: fuente principal de categorías/entidades
  - `lib/logo-download-*.ts`: endpoint de descarga de logos
  - `lib/worker-*.ts`: lógica del wrapper del Worker (R2, redirects, headers)
- `data`: datasets generados y overrides (JSON, isotipos)
- `scripts`: prebuild/postbuild, sync a R2, chequeos de calidad de logos
- `public/logos`: logos alojados (fallback de R2)

## Cómo contribuir

### Flujo recomendado

1. Forkeá el repo y creá una rama:
   - `feature/<descripcion-corta>` para features
   - `fix/<descripcion-corta>` para correcciones
2. Hacé cambios acotados y enfocados.
3. Validá localmente antes de abrir PR:
   - `pnpm lint`
   - `pnpm typecheck`
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

Después corré `pnpm build` (regenera los datasets en `data/`) y verificá en la UI:
- resultados de búsqueda,
- conteos por categoría,
- ficha del logo y descarga.

#### Cambios de UI o interacción

- Las rutas viven en `src/pages` y renderizan vistas de `views` (la home usa `components/home-page.tsx`).
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
