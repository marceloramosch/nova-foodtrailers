# Lone Star Food Trailers — Rediseño

Sitio actual: https://lonestarfoodtrailers.com/

Propuesta de rediseño (v1) en `index.html`.

## Concepto de diseño
- **Colores:** gris / negro con detalles amarillos (industrial/amber).
- **Firma visual:** "marco negro con tuercas" — un marco negro con bolts/remaches que
  replica la construcción de los trailers. Se usa en hero, secciones destacadas y badges.
- **Tipografía:** Anton (títulos), Oswald (labels/UI), Inter (texto).
- **Tono:** fabricante + vendedor, detalles importan, servicio y garantías 5 estrellas.

## Modelo de negocio
Es un **sitio de venta (pitch)**: se le presenta a Lone Star para vendérselos. Cuando
compren, se publica en **su** dominio (lonestarfoodtrailers.com, que es del cliente).
Mientras tanto se muestra con un link de preview gratis.

## Funcionalidad
- **Bilingüe ES/EN** — toggle en el header (desktop y mobile), guarda preferencia en
  `localStorage`. Diccionario completo en el `<script>` (`I18N`).
- **Tema claro/oscuro** — toggle (ícono sol/luna) junto al selector de idioma. El marco
  negro con tuercas (firma visual) se mantiene siempre oscuro en ambos temas a propósito.
- **Animaciones** — fade/slide-in en el hero al cargar, y reveal-on-scroll (IntersectionObserver)
  en el resto de las secciones, tarjetas y galería.
- **Video más compacto** — ancho máximo reducido (560px) para que no domine la página.

## Contenido (datos reales del sitio actual + listados)
- Dueños/socios: **Steve Banda** y **Ricardo Banda** (fabricante + vendedor).
- Teléfono / WhatsApp: **(214) 994-0452**.
- Dirección: 6451 S Great Trinity Forest Way, Dallas, TX 75217.
- **Precios reales:** Base $26,999 · Plus $29,500 · XL 26ft/3 ejes $38,000.
- **Financiamiento** propio (buy here, pay here) + bancos.
- **Entrega a los 50 estados**, choferes con fianza, $2.00–$2.75/milla.
- Todo listo para inspección del departamento de salud.
- Reseñas: 5.0 con 11 reseñas confirmado en Birdeye. Una es cita textual real (traducida):
  "Steve es un perfeccionista... aquí todo se hace correctamente, sin atajos." Las otras dos
  siguen siendo paráfrasis de los temas recurrentes (acompañamiento, disponibilidad) —
  **pendiente** reemplazar por el texto exacto de más reseñas si se consigue acceso a Google Maps.
- Correo: **stevebanda77@yahoo.com** (público, listado en el perfil de BBB de la empresa).
- Horario: **Lunes a sábado, 10:00 am – 7:00 pm** (confirmado directamente por el cliente).
- 25 fotos + 1 video (MP4) en `assets/`.
- Contacto: **4 canales** — Llamar (tel:, destacado como opción principal), WhatsApp,
  Mensaje de texto (sms:) y Correo — en la sección de Contacto, hero, tarjetas de precio,
  menú móvil, burbuja de chat flotante (mobile) y footer. Sin formulario backend real (todo
  son enlaces tel:/sms:/wa.me/mailto:).
- Redes sociales: **Facebook real** (facebook.com/61560769346352) en el footer. Instagram no
  se agregó — el único que aparece en búsquedas es de otra sucursal (San Antonio), no de Dallas.
- Galería agrupada por trailer (4 portadas — Big Daddie's Kitchen, verde, Divine Bites,
  Sweets & Treat's), con foquitos de luz LED (estilo marquesina, foco de vidrio) animados
  alrededor del marco del hero y de "Nosotros".
- Páginas legales: `terms.html` y `privacidad.html` (Términos y Aviso de Privacidad, con
  contenido real reflejando el modelo de negocio fabricante+vendedor).
- SEO/social: favicon, meta Open Graph y theme-color agregados en el `<head>`.

## Pendientes / placeholders
- [ ] Logo y nombre (hay espacio reservado — "Tu logo aquí").
- [ ] Confirmar si `stevebanda77@yahoo.com` (correo personal) es el que quieren mostrar
  públicamente, o si prefieren un correo de dominio propio (ej. info@lonestarfoodtrailers.com).
- [ ] Reemplazar reseñas parafraseadas por texto exacto de más reseñas de Google/Birdeye.
- [ ] Instagram — agregar el link real cuando el cliente confirme cuál es (o si tienen uno).
- [ ] Optimizar/redimensionar imágenes (hoy 2–5 MB c/u) antes de lanzar.
- [ ] Convertir/recomprimir el video para web (el .MOV no se reproduce en todos los navegadores).
- [ ] Hosting: repo propio + Cloudflare Pages (preview .pages.dev; dominio del cliente al vender).
- [ ] El link de Google Maps que compartió el cliente está bloqueado por la política de red de
  este entorno (403 a nivel de proxy, no es un límite temporal) — no se pudo leer directamente
  en ninguna sesión. Los datos de arriba salen de Yelp/BBB/Birdeye vía búsqueda web.

## Dominio
Este es un proyecto/negocio **aparte** de Nova Food Trailers. Va en su **propio dominio**
(por definir) — **no** bajo novafoodtrailers.com. Vive en este repo solo mientras se
desarrolla.

## Ver la propuesta
Abrir `index.html` en el navegador (los assets son rutas relativas a `assets/`).
