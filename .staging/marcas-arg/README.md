# Logos candidatos — top 10 de @marcasarg_ para loguitos

Fecha: 19 de noviembre de 2026 (America/Mendoza).
Criterio: SVG oficial y actual, con paths reales (no PNG embebido), viewBox, sin scripts. No se vectorizó a mano ni se usaron capturas, versiones históricas o logos con fondo. Brandfetch/Seeklogo no se usaron porque no había un SVG de paths que coincidiera con el oficial actual.

Hoja de contacto: `contact-sheet.png`

## Resumen

| Marca | Slug | Estado | Fuente | Peso | Categoría |
|---|---|---|---|---|---|
| Guaymallén | guaymallen | OK | [logo.svg oficial](https://www.alfajoresguaymallen.com.ar/assets/logo.svg) | 43.503 B | alimentos |
| Freddo | freddo | sin logo bueno | solo PNG oficial (ver abajo) | — | alimentos |
| Rapanui | rapanui | OK | [logo_rapa 1.svg oficial](https://cdn.prod.website-files.com/6691754224c3508065500a46/68dac70d3b895229f0ec6f1a_logo_rapa%201.svg) | 7.777 B | alimentos |
| Baggio | baggio | sin logo bueno | solo PNG oficial (ver abajo) | — | alimentos |
| Tecpetrol | tecpetrol | OK | [Manual de Marca ed. 2.0, nov. 2022, p. 4](https://www.tecpetrol.com/media/kbtiukes/tecp_manual-de-marca_nov2022_v02.pdf) | 9.677 B | energia |
| Tiendanube | tiendanube | OK | SVG inline del navbar de [tiendanube.com](https://www.tiendanube.com/) | 9.590 B | tecnologias |
| Lucciano's | luccianos | sin logo bueno | solo PNG oficial (ver abajo) | — | gastronomia |
| Piporé | pipore | OK | [logo.svg del theme oficial](https://www.pipore.com.ar/wp-content/themes/pipore/img/logo.svg) | 14.985 B | alimentos |
| Catena Zapata | catena-zapata | OK | [logo-bcz-1.svg oficial, abr. 2025](https://catenazapata.com/wp-content/uploads/2025/04/logo-bcz-1.svg) | 7.538 B | alimentos |
| Cagnoli | cagnoli | OK | [logo.svg oficial](https://www.cagnoli.com/images/logo/logo.svg) | 18.195 B | alimentos |

Categorías alineadas al catálogo actual de loguitos: Grido/Havanna/Trapiche/Norton/Paladini = `alimentos`; Café Martínez = `gastronomia`; Pampa Energía = `energia`; el resto de software/plataformas = `tecnologias`. Freddo sigue a Grido (`alimentos`). Lucciano's se propone como `gastronomia` por el posicionamiento «Ristorante + Bar».

## Detalle de los OK

Todos son marca registrada de sus dueños, sin licencia abierta publicada. Se copió el arte oficial (sitio o press kit) sin recolorizar.

### guaymallen
- Archivo: `/workspace/loguitos-marcasarg-logos/guaymallen.svg`
- Previews: `preview/guaymallen.png`, `preview/guaymallen-light.png`, `preview/guaymallen-dark.png`
- Colores: #C2A06B, #D51317, #DAC174, #FFFFFF
- Validación: paths, viewBox `0 0 346 70.3`, sin `<image>` ni scripts. Se ve bien en claro y oscuro (gaucho en círculo + «ALFAJORES GUAYMALLEN®»).

### rapanui
- Archivo: `/workspace/loguitos-marcasarg-logos/rapanui.svg`
- Previews: `preview/rapanui.png`, `preview/rapanui-light.png`, `preview/rapanui-dark.png`
- Colores: #E8E5D1 (crema oficial)
- Validación: paths, viewBox `0 0 241 80`, sin scripts. El sitio también publica un «SVG» que envuelve un PNG: se descartó.
- Caveat: el wordmark crema es casi invisible sobre fondo claro y excelente sobre oscuro. Es el color oficial; no se recolorizó.

### tecpetrol
- Archivo: `/workspace/loguitos-marcasarg-logos/tecpetrol.svg`
- Previews: `preview/tecpetrol.png`, `preview/tecpetrol-light.png`, `preview/tecpetrol-dark.png`
- Colores (manual): azul #0072AE (Pantone 3015), verde #008752 (PMS 348), lima #6DB33F (PMS 369), gris #696A6C (Cool Gray 10)
- Método: el press kit no publica un SVG suelto, sí el manual vectorial (Illustrator, 24 pp.). Se convirtió la p. 4 («Elementos del Isologo») con pdftocairo y se conservaron solo los paths con los 4 colores de marca del isologo preferido a 4 colores. Sin cotas ni rótulos. El PDF `/media/yfffscoh/tp_manual-de-marca_vfinal.pdf` es la edición 1.0 de julio 2009: no se usó.
- Caveat: el gris oficial pierde un poco de contraste sobre fondo oscuro (el manual prevé variantes en negativo). Se entregó la versión preferida a 4 colores.

### tiendanube
- Archivo: `/workspace/loguitos-marcasarg-logos/tiendanube.svg`
- Previews: `preview/tiendanube.png`, `preview/tiendanube-light.png`, `preview/tiendanube-dark.png`
- Color: #0050C3 (`--primary-nimbus-blue` / color del logo en el header actual). El SVG original traía `fill="currentColor"`; se horneó ese hex para que el asset standalone coincida con el sitio.
- Validación: 2 paths, viewBox `0 0 160 40`, sin `<image>` ni scripts. Se prefirió este (2026, azul actual) al SVG de Wikimedia Commons de 2021 (azul #2C3356, más oscuro).

### pipore
- Archivo: `/workspace/loguitos-marcasarg-logos/pipore.svg`
- Previews: `preview/pipore.png`, `preview/pipore-light.png`, `preview/pipore-dark.png`
- Colores: #000000 y #FFFFFF
- Validación: 17 paths, viewBox `0 0 132.082 69.091`, export de Illustrator 15, sin scripts. Wordmark «Piporé®». El `img/logo.png` del mismo theme es un leftover de «VOODOO CHILLI WEB DESIGN STUDIO»: no es la marca.

### catena-zapata
- Archivo: `/workspace/loguitos-marcasarg-logos/catena-zapata.svg`
- Previews: `preview/catena-zapata.png`, `preview/catena-zapata-light.png`, `preview/catena-zapata-dark.png`
- Color visible: #FFFFFF. El CSS del SVG define también `.st0 { #231F20 }`, pero está en paths degenerados, no en el wordmark.
- Validación: paths, viewBox `0 0 164 23`, abril 2025 en el sitio oficial. No hay un SVG oscuro oficial (404 en variantes tipo `logo-bcz-black.svg`).
- Caveat: wordmark blanco, casi invisible en fondo claro; excelente en oscuro. No se recolorizó.

### cagnoli
- Archivo: `/workspace/loguitos-marcasarg-logos/cagnoli.svg`
- Previews: `preview/cagnoli.png`, `preview/cagnoli-light.png`, `preview/cagnoli-dark.png`
- Colores: #082240, #F58232, #FFFFFF
- Validación: paths, viewBox `0 0 93 61`, «GENUINO CAGNOLI de Tandil». El footer del sitio tiene una variante monócroma crema; se prefirió el isologo a color.

## Sin logo bueno (no se forzó un SVG)

No hay archivo `.svg` entregable para estas tres. En `sources/` y `preview/*-ref-*.png` quedó el raster oficial solo como referencia visual.

### freddo
- Por qué: el sitio actual (`ar.freddo.com`) solo publica PNG, p. ej. [logo-header-web.png](https://ar.freddo.com/wp-content/uploads/2025/04/logo-header-web.png) (568×160, wordmark blanco «freddo GELATO TRADIZIONALE EST. 1969»). Wikimedia `Logo-freddo.jpg` es un JPEG histórico de 2010. Cadbury Freddo es otra marca.
- Categoría propuesta: alimentos (como Grido).
- Referencia: `sources/freddo-official-logo-header-web.png`

### baggio
- Por qué: el sitio solo publica PNG, [ /es/images/logo.png ](https://www.baggio.com.ar/es/images/logo.png) (460×180, «Baggio®» rojo con recorte blanco). La raíz `/images/logo.png` redirige a HTML. Wikimedia `File:Jugos Baggio Logo.png` es un PNG «own work» de 2023, no un SVG oficial.
- Categoría propuesta: alimentos.
- Color de referencia: ~#C02008 + blanco.
- Referencia: `sources/baggio-official-es-images-logo.png`

### luccianos
- Slug propuesto: `luccianos` (no `lucciano-s`).
- Por qué: el sitio oficial vigente es [www.luccianos.com](https://www.luccianos.com) (Squarespace; `luccianos.com.ar` tiene certificado inválido) y solo publica PNG, p. ej. [Primary Logo Almond](https://images.squarespace-cdn.com/content/v1/68c82b63f87f3538a1b9aaa9/bb32551a-b455-47e9-b44a-ff8456c46df2/Primary+Logo+Almond.png). Wikimedia tiene fotos de locales, no un SVG del logo.
- Categoría propuesta: gastronomia.
- Color de referencia: crema/almond ~#E8E0D0.
- Referencia: `sources/luccianos-official-primary-logo-almond.png`

## Paths

```
/workspace/loguitos-marcasarg-logos/
  contact-sheet.png
  README.md
  metadata.json
  guaymallen.svg
  rapanui.svg
  tecpetrol.svg
  tiendanube.svg
  pipore.svg
  catena-zapata.svg
  cagnoli.svg
  preview/<slug>.png            (claro + oscuro, solo OK)
  preview/<slug>-light.png
  preview/<slug>-dark.png
  preview/<slug>-ref-light.png  (solo las 3 sin SVG)
  preview/<slug>-ref-dark.png
  sources/                      (originales y PDF del manual Tecpetrol)
```
