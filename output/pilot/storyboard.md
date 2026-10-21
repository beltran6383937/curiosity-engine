# Storyboard · Venus (7 escenas, 1080×1920, 30 fps)

Paleta: fondo `#04030a → #2c1f3a`, Venus en ocres (`#8a5a2b → #fbeccb`), **oro `#ffc86b` = giro**, **cian `#7fd6ff` = órbita**, rosa `#ff7a6b` = «al revés». Luz única: el Sol. Subtítulos palabra a palabra arriba (300–480 px). Implementación: `remotion/src/episodes/VenusPilot.tsx`.

| # | Frases | Plano | Animación | Dato dibujado | Transición |
|---|---|---|---|---|---|
| 1 Gancho | 0–1 | Negro → Venus 3D (textura procedural de nubes, atmósfera fresnel), Sol al fondo a la izquierda | Travelling de acercamiento (z 16 → 8,6) mientras se enciende la luz; con «girar» aparece la flecha dorada de giro **retrógrado**; con «vuelta» se dibuja el arco cian de su órbita **centrada en el Sol** | Etiqueta VENUS; fuente «Datos: NASA» con «NASA» | Zoom suave y desenfoque |
| 2 Comparación | 2–4 | Pantalla partida: izquierda, Venus girando con un marcador en el ecuador; derecha, mini-sistema Sol-Venus en perspectiva | Un mismo reloj de días terrestres (0 → 224,7) mueve las dos cosas: el anillo dorado (giro) y el cian (órbita) | 243 «1 giro» · 225 «1 vuelta al Sol»; al llegar a 225: «Año completo» frente a «92 % del giro» | — |
| 3 Superficie | 5–6 | Llanura volcánica bajo cielo naranja; el Sol es un resplandor tras las nubes | El Sol cruza el cielo durante la escena | Contador → 117 «días de amanecer a amanecer» (≈ 116,75, NASA) | — |
| 4 Por qué | 7 | Esquema 2D cenital (SVG): Sol, órbita discontinua, Venus con marcador | Venus avanza antihorario por la órbita mientras gira horario; flechas cian (órbita) y oro (giro), y con «suman» aparece **ÓRBITA + GIRO** | 1/243 + 1/224,7 = 1/116,75 · «esquema, no a escala» | — |
| 5 Al revés | 8 | Tierra y Venus 3D lado a lado | Las dos giran a la vez: Tierra antihoraria (flecha cian), Venus horaria (flecha rosa) | Etiquetas Tierra / Venus / «Al revés» | — |
| 6 Amanecer | 9 | Horizonte de Venus | Con «oeste» el Sol sale por la izquierda (OESTE), recorre el arco y con «este» se pone por la derecha (ESTE) | OESTE / ESTE | — |
| 7 Cierre | 10 | Venus a contraluz con el Sol detrás | Travelling de alejamiento | Título VENUS | Fundido de la música |
