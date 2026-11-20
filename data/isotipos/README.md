# Isotipos SVG

Banco de 199 isotipos SVG validados para loguitos.app. Más adelante se suben a R2 (`loguitos-assets`, clave `loguitos.app/logos/<slug>/isotipo.svg`) para servirlos como CDN. No reemplazan el PNG ni el `logo.svg` actuales.

## Origen

- **136** vienen de sitios oficiales de las marcas (`source_type: official-site`).
- **58** vienen de [Simple Icons](https://simpleicons.org) (`source_type: simple-icons`). Los SVG de Simple Icons están en CC0, pero las marcas son trademarks de sus dueños.
- **5** vienen de Wikimedia Commons con procedencia oficial (`source_type: wikimedia(official-sourced)`).

Estos archivos no otorgan derechos sobre las marcas. Uso nominativo / de referencia; aplican las guidelines de cada titular.

## Contenido

- `<slug>.svg`: isotipo validado (XML bien formado, `viewBox` en el root, al menos un path o forma, sin `<script>`, handlers `on*`, `<foreignObject>` ni referencias externas).
- `metadata.json`: array ordenado por `slug` con `{slug, source_url, source_type, kind, colors, license_note}`. Las entradas del segundo lote (oficiales verificadas) también incluyen `verified_official: true`.
