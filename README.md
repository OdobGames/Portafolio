# Portafolio — Oscar Ordoñez

Sitio de presentación profesional, pensado para reclutadores y equipos técnicos.
Estático, bilingüe (ES/EN) y sin paso de compilación: lo que está en el repositorio
es exactamente lo que se publica.

**En vivo:** https://odobgames.github.io/Portafolio/

---

## Qué contiene

| Sección | Qué muestra |
| --- | --- |
| Portada | Titular, disponibilidad, cuatro datos verificables y descarga del CV |
| Experiencia | Claro Colombia (vía Grupo CINTE), Softgic, BBVA, OdobGames y la UNAL, con fechas reales |
| Trabajo destacado | **WebCraft**, **Carritos**, **Frente de Papel** y **Backrooms Wanderer**, con los retos de ingeniería de cada uno |
| Otros proyectos | Monitor DIAN, los juegos de OdobGames en Google Play, Retro Arcade, Survival Tank y los repos del pregrado |
| Habilidades | Seis grupos: gobierno de datos, nube y big data, ciencia de datos e IA, SQL/ETL, BI, e ingeniería de software |
| Contacto | Correo, CV, GitHub y un botón para copiar la dirección |

## Estructura

```
index.html            El documento. El texto en español vive aquí.
404.html              Página de error, con su propia escena voxel.
assets/css/styles.css Tokens de diseño, componentes y responsive.
assets/js/voxel.js    Motor isométrico voxel propio (sin librerías).
assets/js/i18n.js     Diccionario en inglés.
assets/js/main.js     Idioma, navegación, scroll y utilidades.
assets/img/og.png     Imagen de previsualización al compartir el enlace.
assets/cv/            CV en PDF y su fuente LaTeX, en español y en inglés.
tools/og.html         Plantilla para regenerar assets/img/og.png.
.github/workflows/    Despliegue automático a GitHub Pages.
```

## Cómo se maneja el idioma

El español está escrito directamente en el HTML: la página tiene contenido real
antes de que corra una sola línea de JavaScript, y eso es lo que ve un buscador.
El inglés vive en `assets/js/i18n.js`, indexado por los atributos `data-i18n` del
documento. Al cargar, se elige idioma según el navegador; el botón ES/EN lo
cambia y la elección queda guardada en `localStorage`.

**Para cambiar un texto en español**, edítalo en `index.html`.
**Para cambiar su versión en inglés**, edita la clave correspondiente en `assets/js/i18n.js`.
Las dos listas de claves deben coincidir exactamente.

## Las escenas voxel

Los recuadros de los cuatro proyectos destacados no son capturas: son escenas
dibujadas en vivo por `assets/js/voxel.js`, un renderizador isométrico escrito
para este sitio sin dependencias. La geometría estática se rasteriza una sola vez
a un lienzo fuera de pantalla, así que cada cuadro cuesta un `drawImage` y unas
pocas figuras en movimiento. Las escenas se detienen cuando salen de la pantalla
o la pestaña pierde el foco, y con `prefers-reduced-motion` se dibuja un solo
cuadro estático.

Cada tarjeta elige su escena con `data-voxel`:

| `data-voxel` | Qué dibuja |
| --- | --- |
| `world` | Una isla que se carga columna por columna, como chunks llegando de un servidor |
| `karts` | Un circuito cerrado con karts dando una vuelta |
| `paper` | Una arena de papel recortado con dos equipos moviéndose entre coberturas |
| `rooms` | Habitaciones amarillas con puertas y una figura que las recorre sin rumbo |
| `ambient` | La deriva lenta de cubos detrás de la portada |

**Para añadir una escena** hacen falta dos piezas: una función que construya la
lista de columnas y otra que sepa pintar una de ellas. `Scene.prototype.lay` las
une, se encarga del encuadre y deja que `stream()` rasterice la placa; lo que se
mueva encima va en `draw()`.

**Para reemplazarlas por capturas reales**, cambia el `<canvas data-voxel="...">`
de cada tarjeta por un `<img>` y borra el párrafo `.media-note` que aclara que es
una ilustración.

## Actualizar el CV

El PDF se compila desde LaTeX y **la fuente vive en el repositorio**, así que se
edita desde GitHub sin reconstruir nada:

```
assets/cv/CV-Oscar-Ordonez.tex      fuente en español
assets/cv/CV-Oscar-Ordonez.pdf      compilado en español
assets/cv/CV-Oscar-Ordonez-EN.tex   fuente en inglés
assets/cv/CV-Oscar-Ordonez-EN.pdf   compilado en inglés
```

Edita el `.tex`, compílalo con **pdfLaTeX** (en Overleaf: *Menu → Compiler →
pdfLaTeX*) y sube el PDF resultante con el mismo nombre; los tres botones de
descarga —portada, experiencia y contacto— siguen funcionando.

Las dos versiones comparten márgenes, colores y tamaños: si tocas el formato de
una, tócalo igual en la otra o dejarán de verse como el mismo documento.

### El CV en inglés

Los tres botones de descarga cambian de archivo con el idioma de la página. Lo
hacen a través de una sola clave, `cv.file` en `assets/js/i18n.js`, leída por el
atributo `data-i18n-attr="href:cv.file"` de cada enlace: al pasar a inglés se
reescribe el `href`, y al volver a español se restaura el original del HTML. No
hay JavaScript propio detrás de esto.

**Para cambiar a qué archivo apunta la versión en inglés** basta con esa línea:

```js
'cv.file': 'assets/cv/CV-Oscar-Ordonez-EN.pdf',
```

Si cambias de experiencia laboral hay que tocar cuatro sitios y deben coincidir:
la sección `#experiencia` de `index.html`, sus claves `exp.*` en
`assets/js/i18n.js`, y los dos `.tex`.

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

`.github/workflows/deploy.yml` publica el sitio en GitHub Pages en cada push a
`main` o a la rama de trabajo.

**Hay un paso manual que solo se hace una vez.** El token del workflow puede
publicar en Pages, pero no puede *crear* el sitio de Pages (`Resource not
accessible by integration`), así que primero hay que encenderlo a mano:

> **Settings → Pages → Build and deployment → Source: `GitHub Actions`**

Después de eso, cada push despliega solo.

Si prefieres no usar Actions, la alternativa es igual de válida para un sitio
estático: **Settings → Pages → Source: `Deploy from a branch`**, eligiendo esta
rama y la carpeta `/ (root)`. El archivo `.nojekyll` ya está para que Pages
sirva las rutas tal cual.
