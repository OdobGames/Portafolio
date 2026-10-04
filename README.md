# Portafolio — Oscar Ordoñez

Sitio de presentación profesional, pensado para reclutadores y equipos técnicos.
Estático, bilingüe (ES/EN), con tema claro y oscuro, y sin paso de compilación: lo que
está en el repositorio es exactamente lo que se publica.

**En vivo:** https://odobgames.github.io/Portafolio/ · **Hub de proyectos:** https://odobgames.github.io/Portafolio/juegos/

---

## Qué contiene

| Sección | Qué muestra |
| --- | --- |
| Portada | Titular, rol, descarga del CV y una tarjeta con cuatro datos verificables |
| Experiencia | Claro Colombia (vía Grupo CINTE), Softgic, BBVA, OdobGames y la UNAL, con fechas reales |
| Trabajo destacado | **WebCraft**, **Carritos**, **Frente de Papel** y **Backrooms Wanderer**, con captura real y los retos de ingeniería de cada uno |
| Hub (`/juegos/`) | Todos los juegos y apps: jugables en el navegador, Google Play, código abierto y próximos lanzamientos |
| Habilidades | Seis grupos: gobierno de datos, nube y big data, ciencia de datos e IA, SQL/ETL, BI e ingeniería de software |
| Contacto | Correo, CV, GitHub y un botón para copiar la dirección |

## Estructura

```
index.html             El documento. El texto en español vive aquí.
juegos/index.html      El hub de proyectos.
404.html               Página de error, con su propia escena voxel.
data/projects.json     Fuente única de datos del hub.
assets/css/styles.css  Tokens de diseño (claro y oscuro), componentes y responsive.
assets/js/main.js      Idioma, tema, navegación, scroll y utilidades.
assets/js/hub.js       Pinta y filtra las tarjetas del hub.
assets/js/i18n.js      Diccionario en inglés.
assets/js/voxel.js     Motor isométrico voxel propio, usado solo en la página 404.
assets/img/projects/   Capturas de cada proyecto (.webp, 960×540).
assets/cv/             CV en PDF y su fuente LaTeX, en español y en inglés.
tools/check.mjs        Verificador del sitio (ver "Verificar").
tools/check.test.mjs   Pruebas del verificador.
assets/js/hub.test.mjs Pruebas del renderizado del hub.
tools/og.html          Plantilla para regenerar assets/img/og.png.
.github/workflows/     Despliegue automático a GitHub Pages.
```

## Cómo se maneja el idioma

El español está escrito directamente en el HTML: la página tiene contenido real antes de
que corra una sola línea de JavaScript, y eso es lo que ve un buscador. El inglés vive en
`assets/js/i18n.js`, indexado por los atributos `data-i18n` del documento. Al cargar manda primero `?lang=` en el enlace, después la elección guardada en el equipo y por último el idioma del navegador; el botón ES/EN lo cambia y la elección queda guardada.
Cada cambio de idioma emite el evento `langchange`, que el hub usa para repintar.

**Para cambiar un texto en español**, edítalo en `index.html`.
**Para cambiar su versión en inglés**, edita la clave correspondiente en `assets/js/i18n.js`.
Las dos listas de claves deben coincidir exactamente.

## El tema

La hoja de estilos sigue la preferencia del sistema (`prefers-color-scheme`). El botón de la
barra guarda una elección manual en `localStorage` (`oo-theme`) y un pequeño script en
`<head>` la aplica antes del primer pintado para evitar parpadeos.

## El hub de proyectos

`juegos/index.html` carga `data/projects.json` y pinta una tarjeta por proyecto. Cada
proyecto es un objeto con solo datos públicos:

```json
{
  "id": "webcraft",
  "name": "WebCraft",
  "kind": "web | android | pc",
  "status": "playable | store | source | coming-soon",
  "tagline": { "es": "...", "en": "..." },
  "description": { "es": "...", "en": "..." },
  "stack": ["JavaScript", "Cloudflare Pages"],
  "url": "https://…",
  "thumb": "assets/img/projects/webcraft.webp",
  "year": 2026,
  "order": 10
}
```

- `playable`: abre el juego en el navegador. `store`: ficha de Google Play. `source`: repositorio.
  `coming-soon`: sin enlace (no lleva `url`).
- `thumb` es opcional; sin imagen, la tarjeta muestra las iniciales.
- Las URL deben ser `https`; `hub.js` descarta cualquier otra.

**Para añadir un proyecto**, agrega su objeto a `data/projects.json`, copia su captura a
`assets/img/projects/` y ejecuta `node tools/check.mjs`.

## Actualizar el CV

El PDF se compila desde LaTeX y **la fuente vive en el repositorio**:

```
assets/cv/CV-Oscar-Ordonez.tex      fuente en español
assets/cv/CV-Oscar-Ordonez.pdf      compilado en español
assets/cv/CV-Oscar-Ordonez-EN.tex   fuente en inglés
assets/cv/CV-Oscar-Ordonez-EN.pdf   compilado en inglés
```

Edita el `.tex`, compílalo (Tectonic, pdfLaTeX o Overleaf → *Menu → Compiler → pdfLaTeX*) y
guarda el PDF con el mismo nombre; los botones de descarga siguen funcionando. Las dos
versiones comparten márgenes, colores y tamaños: si tocas el formato de una, tócalo igual en
la otra. Es un documento de una sola columna, sin tablas ni íconos, para que los sistemas de
selección (ATS) lean el texto en orden.

Los botones de descarga cambian de archivo con el idioma a través de una sola clave,
`cv.file` en `assets/js/i18n.js`. Si cambias de experiencia laboral hay que tocar cuatro
sitios y deben coincidir: la sección `#experiencia` de `index.html`, sus claves `exp.*` en
`assets/js/i18n.js`, y los dos `.tex`.

## Verificar

```bash
node tools/check.mjs                                # paridad ES/EN, esquema del hub, correo y rutas locales en los archivos de texto (no revisa imágenes ni PDF)
node --test tools/*.test.mjs assets/js/*.test.mjs   # pruebas unitarias
```

## Correr el sitio en local

```bash
npx http-server -p 8080 .
# luego abre http://127.0.0.1:8080/
```

Para regenerar la imagen de previsualización tras cambiar `tools/og.html`:

```bash
npx playwright screenshot --viewport-size=1200,630 --wait-for-timeout=3000 \
  http://127.0.0.1:8080/tools/og.html assets/img/og.png
```

## Despliegue

`.github/workflows/deploy.yml` publica el sitio en GitHub Pages en cada push a `main` o a la
rama de trabajo. El sitio de Pages se activa una sola vez desde
**Settings → Pages → Build and deployment → Source: `GitHub Actions`**. El archivo
`.nojekyll` ya está para que Pages sirva las rutas tal cual.
