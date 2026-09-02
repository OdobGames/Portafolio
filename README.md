# Portafolio — Oscar Ordoñez

Sitio de presentación profesional, pensado para reclutadores y equipos técnicos.
Estático, bilingüe (ES/EN) y sin paso de compilación: lo que está en el repositorio
es exactamente lo que se publica.

**En vivo:** https://odobgames.github.io/Pruebaclaude/

---

## Qué contiene

| Sección | Qué muestra |
| --- | --- |
| Portada | Titular, disponibilidad y cuatro datos verificables |
| Trabajo destacado | **WebCraft** y **Carritos**, con los retos de ingeniería de cada uno |
| Más trabajo | Monitor DIAN, los juegos de OdobGames en Google Play, Retro Arcade, Survival Tank y los repos del pregrado |
| Habilidades | Seis grupos, cada uno atado a algo concreto del sitio |
| Trayectoria | Cuatro hitos, sin fechas inventadas |
| Contacto | Correo, GitHub y un botón para copiar la dirección |

## Estructura

```
index.html            El documento. El texto en español vive aquí.
404.html              Página de error, con su propia escena voxel.
assets/css/styles.css Tokens de diseño, componentes y responsive.
assets/js/voxel.js    Motor isométrico voxel propio (sin librerías).
assets/js/i18n.js     Diccionario en inglés.
assets/js/main.js     Idioma, navegación, scroll y utilidades.
assets/img/og.png     Imagen de previsualización al compartir el enlace.
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

Los recuadros de WebCraft y Carritos no son capturas: son escenas dibujadas en
vivo por `assets/js/voxel.js`, un renderizador isométrico escrito para este sitio
sin dependencias. La geometría estática se rasteriza una sola vez a un lienzo
fuera de pantalla, así que cada cuadro cuesta un `drawImage` y unas pocas figuras
en movimiento. Las escenas se detienen cuando salen de la pantalla o la pestaña
pierde el foco, y con `prefers-reduced-motion` se dibuja un solo cuadro estático.

**Para reemplazarlas por capturas reales**, cambia el `<canvas data-voxel="...">`
de cada tarjeta por un `<img>` y borra el párrafo `.media-note` que aclara que es
una ilustración.

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
`main` o a la rama de trabajo. El paso `configure-pages` intenta activar Pages
por sí solo; si el repositorio no lo permite, hay que encenderlo una vez en
**Settings → Pages → Source: GitHub Actions**.
