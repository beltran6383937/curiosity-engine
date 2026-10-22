# Storyboard · 2026-10-22 · Por qué las llantas parecen girar al revés en vídeo

Fuente única de cifras: `episode.json` (2 claims verificados: cálculo 360°/5 = 72°, 72° × 24 fps = 4,8 vueltas/s; Purves et al., PNAS, 1996).
Cifras permitidas en pantalla: **5 radios**, **24 fps**, **72°**, **4,8 vueltas/s** y **1996**. Ninguna otra. No se muestran contadores de fotogramas con dígitos, ni grados por segundo, ni los pasos internos «algo menos» y «algo más» en cifras, ni el 360°. Tampoco el volumen ni las páginas de PNAS.

## Identidad y reglas globales

- Lienzo 1080 × 1920. Los subtítulos (`Captions`) van en 300-480 px y ahí no se dibuja nada importante. El contenido va entre 520 y 1540 px (`Source` termina en 1540).
- Tipografía: Hanken Grotesk (`SANS`; `T3` si hace falta texto en 3D). Las cifras usan `fontVariantNumeric: "tabular-nums"`. No hay imágenes externas: todo se hace con `Stage`/`Clay`/three, SVG y CSS.
- Fondo profundo de noche y asfalto: `BG = { top: "#05070c", mid: "#0e1420", glow: "#1c2840" }`.
- Paleta (cada color tiene un único significado durante todo el episodio):
  - `AMBER "#ffb547"`: **la cámara y lo filmado**. Reloj de fotogramas, llanta «VÍDEO», marca del radio filmado. También es el acento de subtítulos (`accent`).
  - `CYAN "#6fd3ff"`: **lo real y continuo**. Llanta «REAL», flechas de avance real, luz continua.
  - `MINT "#7fe0c4"`: **cálculo**. Arco de 72°, la etiqueta «Cálculo, no medición» y las cotas.
  - `ROSE "#ff7a6b"`: **retroceso aparente** e ilusión. Flecha de giro hacia atrás.
  - `CHROME "#cfd8e6"` / `CHROME_D "#7d8798"`: metal de la llanta. `TIRE "#14161b"`: neumático. `INK "#dfe6ff"`: texto secundario.
- Luz: principal fría y lateral (`sun` arriba a la izquierda) con contraluz `rim` ámbar suave (`#ffb070`) en las escenas 3D. En la llanta SVG, el brillo especular es un `radialGradient` **fijo en el lienzo** que no gira con la llanta. Así se lee que lo que gira es el metal y no la luz, y el brillo sirve de referencia quieta.
- Movimiento: un único movimiento de cámara por escena, travellings lentos, sin zoom continuo, sin `Dust` ni partículas. Las transiciones son las de `Reel`; abajo se describe la continuidad lógica de formas.
- Nada de destellos a 24 Hz: el obturador **no** se representa con parpadeos de pantalla completa (riesgo fotosensible). Solo se ilumina un tic del reloj.
- «Esquema, no a escala» se pone en todas las escenas con coche o llanta (1, 2, 3-6, 8 y 9). La etiqueta **«Cálculo, no medición»** es fija en las escenas del ejemplo (3, 4, 5 y 6, frases 4-7). En la escena de la luz continua (8, frases 9-10) va **«Purves et al., PNAS, 1996»**.

## Motor de giro (obligatorio, común a todas las escenas)

El vídeo final sale a 30 fps, pero la llanta «filmada» se muestrea a **24 fps en código**. El ángulo depende solo del índice de fotograma filmado `n = floor(t·24)`, nunca de `t` continuo. Así el render respeta el muestreo aunque cada fotograma de 24 fps dure 1 o 2 fotogramas de 30 (patrón 2-1-1-1, judder aceptado y real).

```ts
const FILM = 24;                                   // fps de la cámara simulada
const SPOKES = 5, PITCH = 360 / SPOKES;            // 72°
// índice de fotograma filmado; con enteros: floor(f * 24 / fps) evita errores de coma flotante
const filmN = (f: number, fps: number) => Math.floor((f * FILM) / fps);
// llanta filmada: paso fijo `step` grados por fotograma filmado (positivo = horario = avance en SVG)
const filmedDeg = (n: number, step: number, n0 = 0, deg0 = 0) => deg0 + (n - n0) * step;
// llanta real: continua
const realDeg = (t: number, step: number) => step * FILM * t;
// lo que el ojo «lee» entre dos fotogramas con radios idénticos: el desplazamiento más corto módulo 72°
const apparent = (step: number) => ((((step + PITCH / 2) % PITCH) + PITCH) % PITCH) - PITCH / 2;
```

Pasos internos por fotograma filmado (**nunca se rotulan**):
- `STEP_FREEZE = 72`: aparente 0°, la llanta se congela (4,8 vueltas/s).
- `STEP_LESS = 68`: aparente −4° por fotograma, retrocede.
- `STEP_MORE = 76`: aparente +4° por fotograma, avanza despacio.

Al cambiar de paso dentro de una escena hay que mantener la continuidad de fase: `filmedDeg(n, nuevo, nCambio, degEnCambio)`. Si no, la llanta da un salto.

**Llanta «real» y aliasing del propio render.** Una llanta continua a 4,8 vueltas/s pintada a 30 fps avanza 57,6° por fotograma de salida, que con 5 radios se lee como −14,4°: **parecería ir hacia atrás también**. Por eso la llanta REAL nunca se pinta nítida a esas velocidades. Va con **desenfoque de movimiento por submuestreo**: K = 12 copias de los radios en `realDeg(t + j/(fps·K))`, con j = 0…K−1, opacidad 0,16 cada una y el aro y el buje nítidos. Así queda como un disco «girando rápido» sin dirección engañosa. La dirección la da una flecha CYAN curva y fija sobre el aro. **Regla general**: cualquier objeto continuo que no lleve desenfoque (carretera, llanta del cierre) debe avanzar como máximo 1/4 de su periodo por fotograma de 30 fps.

**Comprobación programática** (opcional, `remotion/scripts/check-sampling.ts`, con `npx tsx`, no entra en el render):
1. `apparent(72) === 0`, `apparent(68) === -4` y `apparent(76) === 4`.
2. Para f = 0…299 a 30 fps, `filmN` es no decreciente, salta como mucho 1 y da exactamente 24 valores distintos por cada 30 fotogramas.
3. Con `STEP_FREEZE`, `filmedDeg % 72 === 0` en todos los fotogramas.

## Llanta (pieza común)

- **SVG `Rim`** (escenas 2-9), centrada en `(cx, cy)` y con radio exterior `R`:
  - Neumático: anillo TIRE de `R` a `0,8R` con un borde interior `#262a33`.
  - Aro: anillo CHROME_D de `0,8R` a `0,74R`.
  - Buje: círculo CHROME de `0,16R` con 5 tuercas pequeñas (giran con la llanta).
  - Radios: 5 trapecios redondeados de `0,16R` a `0,74R`, de ancho `0,13R` en la base y `0,09R` en la punta, cada uno a `i·72°`. Relleno CHROME con un `linearGradient` que gira con el radio.
  - Todo el grupo de radios y tuercas lleva `transform={rotate(deg cx cy)}`.
  - Encima va el brillo fijo: un `radialGradient` blanco al 18 % centrado arriba a la izquierda (`cx − 0,35R`, `cy − 0,4R`), con `mixBlendMode: "screen"`, que **no** rota.
  - Sombra de contacto: una elipse negra difuminada bajo el neumático.
- `mark?: string`: un punto de `0,05R` en la punta del radio 0. AMBER en la llanta filmada y CYAN en la real.
- `blur?: { t, step, fps }`: activa el submuestreo de la llanta real descrito arriba.
- **3D `Rim3`** (escenas 1, 2 y 9): llanta con `ExtrudeGeometry` de la misma silueta de 5 radios (profundidad 0,12, bisel 0,02). `meshPhysicalMaterial` CHROME con `metalness 0.85` y `roughness 0.3`. El neumático es un `torusGeometry` TIRE con `roughness 0.9`. Gira con `rotation.z = -deg·π/180`: con la cámara mirando a −z, el giro horario es el avance de un coche que va hacia la derecha.

## Reloj de fotogramas (pieza común, AMBER, sin dígitos)

- Barra de 24 tics (rectángulos de 22 × 34 px, separación 11 px) centrada en x = 540, con y entre 610 y 644.
- Se ilumina el tic `n % 24` (AMBER al 100 %, con `boxShadow` suave). Los demás quedan al 18 %.
- El tic avanza con el `filmN` real, así que da una vuelta completa por segundo.
- A la derecha, en x = 1010 alineado a la derecha y en y = 540, va el rótulo «24 FPS» (Hanken 800, 30 px, AMBER) con un punto AMBER fijo. No es un REC rojo.
- No lleva número de fotograma.

## SCENES

```ts
const SCENES: SceneDef[] = [
  { from: 0, C: Hook },        // 0-1
  { from: 2, C: Camera },      // 2-3
  { from: 4, C: Setup },       // 4
  { from: 5, C: Step72 },      // 5
  { from: 6, C: Frozen },      // 6
  { from: 7, C: LessMore },    // 7
  { from: 8, C: Purves },      // 8
  { from: 9, C: Continuous },  // 9-10
  { from: 11, C: Close },      // 11
];
```

---

### Escena 1 · Hook · from 0 (frases 0-1)

> 0 «¿Por qué las llantas parecen girar al revés en vídeo?» · 1 «El coche avanza, pero la rueda parece retroceder.»

- **Qué se ve**: plano lateral bajo, de noche, de un coche esquemático de arcilla que va hacia la derecha.
  - Carrocería: `ExtrudeGeometry` de una silueta lateral sencilla, de profundidad 1,6. `Clay` `#2c3a55`, `r 0.35`. Ventanillas `#0b0f18`, faros con `emissive` blanco cálido.
  - Dos `Rim3` en los pasos de rueda.
  - Asfalto: plano `#0f1218`, `roughness 0.95`, con discontinuas blancas al 55 % (periodo 2,4) que se desplazan hacia −x para que se lea que el coche avanza.
  - Desplazamiento de la carretera por fotograma de 30 fps ≤ 0,6, es decir, ≤ 1/4 del periodo (regla de aliasing).
  - `<fog>` en `BG.mid` y un reflejo de farola cálido fijo en el asfalto.
- **Muestreo**: las dos llantas son «filmadas» con `STEP_LESS` (68° por fotograma de 24 fps) y van **nítidas**, sin desenfoque. En pantalla se leen girando despacio hacia atrás mientras el suelo corre hacia delante. Es el gancho real, calculado, no un efecto dibujado a mano.
- **Cámara**: un único travelling lateral lento que acompaña al coche y se acerca un poco a la rueda trasera. `cam = [mix(-0.6, 0.4, p), mix(0.55, 0.45, p), mix(7.2, 6.4, p)]` con `look` fijo en la rueda trasera (`[-1.2, 0.35, 0]`) y `p = k(t, 0, len, inOut)`. El coche entero cabe con `|ndc.x| ≤ 0,8` al inicio. La rueda trasera queda entre 900 y 1300 px.
- **Dato programático**: ninguna cifra en esta escena.
  - En «avanza» (`w(1, /avanza/)`) aparece una flecha recta CYAN bajo el coche, en y ≈ 1380, apuntando a la derecha.
  - En «retroceder» (`w(1, /retroceder/)`) aparece una flecha curva ROSE antihoraria alrededor de la rueda trasera (SVG proyectado una sola vez, porque el `look` es fijo) y el `Tag` ROSE «Parece retroceder» en `x 540`, `y 1440`, centrado.
- **Transición**: la cámara termina con la rueda trasera grande y casi de frente. La escena 2 arranca con esa misma rueda en el mismo punto del lienzo.
- **Paleta**: azules nocturnos, CHROME, una nota cálida de farola; CYAN frente a ROSE.
- `Source`: «Esquema, no a escala».

### Escena 2 · Camera · from 2 (frases 2-3)

> 2 «La culpa no es de la rueda.» · 3 «Es de la cámara, que graba fotos sueltas.»

- **Qué se ve**:
  - Frase 2: la rueda trasera (`Rim3`) ya está sola y de frente, girando con `STEP_LESS` (sigue leyéndose hacia atrás). El coche se funde a negro detrás. En «rueda» (`w(2, /rueda/)`) la llanta se ilumina con un contraluz CYAN breve y aparece un `Tag` INK «La rueda va bien» bajo ella (y ≈ 1360).
  - Frase 3: al empezar la frase, la llanta 3D se sustituye en corte lógico por la llanta SVG `Rim` (misma posición y radio, `cx 540`, `cy 900`, `R 260`). En «cámara» (`w(3, /cámara/)`) se dibujan cuatro esquinas de visor AMBER al 70 % alrededor de la llanta y aparece el reloj de fotogramas (aún sin el rótulo «24 FPS», que se dice en la frase 4).
  - En «fotos» (`w(3, /fotos/)`) entra desde la derecha una tira de película (SVG, y 1240-1440): 5 celdas de 170 × 170 px con perforaciones. Cada celda es una **instantánea calculada** de la llanta con `mark` AMBER, en los ángulos `filmedDeg(n0 + i, STEP_LESS)` para i = 0…4.
  - La tira se desliza una celda por cada fotograma filmado. **Entre celdas no hay nada**: el hueco negro entre fotos es el mensaje («sueltas»).
- **Cámara**: fija en la frase 2. En la frase 3 no hay cámara 3D; la tira es el único movimiento.
- **Dato programático**: los ángulos de cada celda salen de `filmedDeg`. El tic iluminado del reloj sigue a `filmN`. No hay cifras.
- **Transición**: la tira sale por la izquierda y la llanta SVG se queda **quieta** (paso 0) y centrada. Es el punto de partida del ejemplo.
- **Paleta**: CHROME sobre `BG`. El AMBER aparece por primera vez con la cámara.
- `Source`: «Esquema, no a escala».

### Escena 3 · Setup · from 4 (frase 4)

> 4 «Supongamos 5 radios y vídeo a 24 fps. Es un cálculo, no una medición.» (locución: «cinco», «veinticuatro»)

- **Qué se ve**: la llanta SVG quieta (`cx 540`, `cy 980`, `R 300`, ángulo 0) con el reloj de fotogramas arriba.
- **Dato programático**:
  - En «5» (`w(4, /^5$|cinco/)`) los 5 radios se resaltan uno a uno: un contorno AMBER que se enciende con 0,12 s de desfase. El `Tag` CHROME «5 radios» aparece en `x 540`, `y 1330`, centrado.
  - En «24» (`w(4, /24|veinticuatro/)`) aparece el rótulo «24 FPS» del reloj y el tic empieza a avanzar a 24 fps reales (la llanta sigue quieta: todavía no gira).
  - En «cálculo» (`w(4, /cálculo/)`) aparece el `Tag` MINT «Cálculo, no medición» en `x 70`, `y 540`. Se queda fijo durante las escenas 3-6.
- **Cámara**: estática. Lo único que se mueve es el tic del reloj y el resaltado de los radios.
- **Transición**: el resaltado se apaga en cuatro radios y queda solo el radio 0, que gana su `mark` AMBER. Así entra la escena 4.
- **Paleta**: CHROME, AMBER (cámara) y MINT (cálculo).
- `Source`: «Esquema, no a escala».

### Escena 4 · Step72 · from 5 (frase 5)

> 5 «Si gira 72° por fotograma, cada radio ocupa el hueco del siguiente.» (locución: «setenta y dos grados»)

- **Qué se ve**: la misma llanta, ahora en modo **fotograma a fotograma**. Se recorren los mismos índices `n` del muestreo de 24 fps, pero cada fotograma filmado se mantiene 0,6 s en pantalla. Se rotula «FOTOGRAMA A FOTOGRAMA» (INK, 26 px, `x 540`, `y 1460`, centrado) para que nadie lo confunda con tiempo real.
  - El reloj avanza también un tic por paso, coherente con la llanta.
  - El ángulo es exactamente `filmedDeg(nPaso, STEP_FREEZE)`, sin interpolar entre pasos: cada cambio es un salto seco.
- **Dato programático**:
  - En «72» (`w(5, /72|setenta/)`) se dibuja un arco MINT de 0° a 72° entre el radio marcado y el siguiente, con cota y la etiqueta «72°» (Hanken 800, 56 px, MINT) en la bisectriz, a `R + 60`. El arco se calcula con `PITCH`, no a ojo.
  - En cada paso queda un **fantasma** del fotograma anterior (radios CHROME al 22 %).
  - En «hueco» (`w(5, /hueco/)`), el hueco entre el radio marcado y el siguiente se rellena de MINT al 25 %. En el paso siguiente el radio marcado cae exactamente encima: el fantasma y el fotograma nuevo coinciden en todos los radios salvo por la marca AMBER, que ha saltado un radio.
- **Cámara**: estática.
- **Transición**: la marca AMBER se desvanece. Sin marca, los 5 radios son idénticos y el fantasma y la llanta coinciden. La llanta se desplaza a la derecha y se encoge a `R 200`, que es la posición de «VÍDEO» en la escena 5.
- **Paleta**: CHROME, AMBER y MINT.
- `Source`: «Esquema, no a escala».

### Escena 5 · Frozen · from 6 (frase 6)

> 6 «A 4,8 vueltas por segundo, la llanta parece quieta.» (locución: «cuatro coma ocho»)

- **Qué se ve**: dos llantas, ambas a `R 200` y `cy 960`.
  - **Izquierda «REAL»** (`cx 290`): continua con `realDeg(t, STEP_FREEZE)`, con desenfoque por submuestreo, `mark` CYAN difuminado y la flecha curva CYAN horaria fija sobre el aro.
  - **Derecha «VÍDEO · 24 FPS»** (`cx 790`): filmada en **tiempo real** con `filmedDeg(filmN(f, fps), STEP_FREEZE)`, nítida y sin marca. Se ve totalmente quieta: es el muestreo real, no un `rotate(0)`.
  - Rótulos bajo cada llanta en y = 1190 (Hanken 800, 28 px, tracking 3): «REAL» en CYAN y «VÍDEO · 24 FPS» en AMBER.
  - El reloj sigue corriendo: el tiempo pasa y la llanta no se mueve.
- **Dato programático**:
  - En «4,8» (`w(6, /4,8|cuatro/)`) entra `Stat` `to={4.8}` con `decimals={1}`, `suffix=""`, `sub="vueltas/s"`, `y 1250`, `size 150`, `c CHROME`. El formato es-ES da «4,8».
  - Debajo, una línea pequeña MINT de 26 px: «72° por fotograma × 24 fps».
  - En «quieta» (`w(6, /quieta/)`), `Tag` AMBER «Parece quieta» encima de la llanta derecha (`x 790`, `y 700`, centrado).
- **Cámara**: estática. Todo el contraste está entre las dos llantas.
- **Transición**: las dos llantas se quedan en su sitio y el `Stat` se retira hacia abajo. La escena 6 reutiliza el mismo encuadre.
- **Paleta**: CYAN frente a AMBER, cálculo en MINT.
- `Source`: «Esquema, no a escala».

### Escena 6 · LessMore · from 7 (frase 7)

> 7 «Si gira algo menos, parece que retrocede. Algo más, avanza despacio.»

- **Qué se ve**: el mismo encuadre de dos llantas. La REAL sigue continua y desenfocada, siempre hacia delante (su paso cambia con la filmada para que sea la misma rueda).
- **Muestreo de la llanta VÍDEO** (nítida, ahora **con** `mark` AMBER para que se lea el sentido):
  - Desde el inicio de la frase hasta «Algo más», paso `STEP_LESS`, que en pantalla retrocede despacio. Flecha curva ROSE antihoraria y `Tag` ROSE «Retrocede» en `x 790`, `y 700`. Bajo la llanta, el rótulo MINT «algo menos de 72°».
  - En «más» (`w(7, /más/)`), paso `STEP_MORE` con continuidad de fase. La llanta avanza despacio en sentido horario, la flecha pasa a AMBER horaria y el `Tag` cambia a «Avanza despacio». El rótulo pasa a «algo más de 72°».
- **Dato programático**: los sentidos los decide `apparent(step)` en código, no la animación. El rótulo solo dice «algo menos» o «algo más» de 72°: los pasos internos no se muestran.
- **Cámara**: estática.
- **Transición**: la llanta VÍDEO se apaga, el reloj se queda congelado en su último tic y la llanta REAL se desliza al centro y se funde con el fondo. En su lugar entra la tarjeta de PNAS.
- **Paleta**: ROSE y luego AMBER sobre la llanta filmada. CYAN constante en la real.
- `Source`: «Esquema, no a escala».

### Escena 7 · Purves · from 8 (frase 8)

> 8 «Pero en 1996, Purves y su equipo señalaron algo en PNAS.» (locución: «mil novecientos noventa y seis», «pe, ene, a, ese»)

- **Qué se ve**: una tarjeta de revista estilizada en el centro (`x 190-890`, `y 760-1240`, fondo `#f2f4f8` al 92 %, `borderRadius 18`, sombra larga). Arriba lleva «PNAS» (Hanken 900, 64 px, tracking 6, `#11131a`). Debajo, 6 barras grises redondeadas que **sugieren** texto sin escribir ninguno: no se inventa ni título ni frases.
- **Dato programático**:
  - En «1996» (`w(8, /1996|mil/)`), el año entra con `useSpring` en un `div` propio (Hanken 900, 230 px, CHROME, `y 560`), como el `Study` de 2026-10-21. **No** se usa `Stat` contando desde 0 (pintaría «1.996») ni desde un año previo, para no mostrar cifras intermedias.
  - En «Purves» (`w(8, /Purves/)`), `Tag` INK «Purves y su equipo» bajo la tarjeta (`x 540`, `y 1300`, centrado).
- **Cámara**: estática. Solo hay un travelling vertical de 30 px de la tarjeta al entrar.
- **Transición**: la tarjeta se aparta hacia arriba y se desvanece. La llanta REAL vuelve al centro, ahora bajo una luz fija.
- **Paleta**: neutros claros sobre `BG`. Ni AMBER ni MINT: aquí no hay cámara ni cálculo.
- `Source`: «Purves et al., PNAS, 1996».

### Escena 8 · Continuous · from 9 (frases 9-10)

> 9 «Una ilusión parecida también se ve con luz continua.» · 10 «Su causa no la damos por resuelta.»

- **Qué se ve**:
  - Frase 9: no hay reloj de fotogramas (se fue en la escena 6) ni visor. La llanta REAL está en el centro (`cx 540`, `cy 1000`, `R 280`), continua y desenfocada, con la flecha CYAN horaria.
  - En «luz continua» (`w(9, /continua/)`) entra una lámpara esquemática arriba a la izquierda (SVG). El haz es un cono con `linearGradient` CYAN al 12 %, **constante, sin parpadeo ni pulsos**, y se evita la franja de subtítulos: el haz empieza en y ≥ 560. Aparece el `Tag` CYAN «Luz continua» en `x 70`, `y 560`.
  - En «ilusión» (`w(9, /ilusión/)`) aparece una flecha curva ROSE **discontinua** y antihoraria por fuera del aro, al 70 %, con el `Tag` ROSE «Ilusión parecida» en `x 540`, `y 1360`, centrado. No se anima la llanta hacia atrás: el guion no da velocidades ni condiciones, solo que se ve.
  - Frase 10: en «causa» (`w(10, /causa/)`) aparece un «?» grande (Hanken 900, 220 px, INK al 85 %) a la derecha de la llanta (`x 900`, `y 760`) y el `Tag` INK «Causa sin resolver» en `x 540`, `y 1430`, centrado.
- **Prohibido en esta escena**: ojos, cerebros, instantáneas, tiras de película, relojes o cualquier forma que sugiera un mecanismo. El guion no explica la causa y la escena tampoco.
- **Cámara**: estática. El único movimiento es la llanta.
- **Transición**: el «?» y las etiquetas se desvanecen y la llanta se convierte en la rueda trasera 3D del coche de la escena 1 (mismo punto del lienzo).
- **Paleta**: CYAN (luz y realidad), ROSE solo en la flecha de la ilusión e INK para la duda.
- `Source`: «Purves et al., PNAS, 1996». Además, una nota pequeña aparte en INK al 55 %, 24 px, «Esquema, no a escala», en `x 70`, `y 1470`.

### Escena 9 · Close · from 11 (frase 11)

> 11 «La rueda avanza. Lo que se lía es lo que la mira.»

- **Qué se ve**: el coche de la escena 1 en el mismo plano lateral nocturno, pero ahora las ruedas giran **de verdad**: continuas, nítidas y lentas, a 1 vuelta/s (12° por fotograma de 30 fps, menos de 1/4 de 72°, así que se leen hacia delante sin aliasing). La velocidad no se rotula y la carretera corre en coherencia.
  - En «avanza» (`w(11, /avanza/)`), flecha CYAN horaria fija sobre la rueda trasera.
  - En «mira» (`w(11, /mira/)`) se cierran sobre la rueda las cuatro esquinas del visor AMBER de la escena 2. Es solo un marco: no se dibuja ojo ni cámara ni ningún mecanismo.
- **Cámara**: un único travelling de retroceso lateral lento, `cam` de `[0.4, 0.45, 6.4]` a `[1.2, 0.7, 8.2]` con `inOut` y `look` fijo en el coche. Es el inverso del gancho.
- **Dato programático**: ninguno nuevo. El giro de la rueda es `realDeg` a velocidad baja.
- **Transición**: final, con fundido a `BG.top` en los últimos 0,6 s.
- **Paleta**: la del gancho; CYAN y AMBER juntos al final.
- `Source`: «Cálculo: 5 radios, 24 fps · Purves et al., PNAS, 1996».

---

## Notas para implementación (para ATLAS / quien monte el `.tsx`)

1. **Locución en palabras**: `say` cambia lo que dice la voz en las frases 4, 5, 6 y 8. Si el alineador devuelve palabras habladas, `w()` debe aceptar ambas formas: `/^5$|cinco/`, `/24|veinticuatro/`, `/72|setenta/`, `/4,8|cuatro/` y `/1996|mil/`.
2. **Claves de subtítulos**: `Captions` parte por espacios, así que las claves de dos palabras de `episode.json` («al revés», «fotos sueltas», «luz continua») no coinciden nunca. En `KEYS` hay que ponerlas sueltas: `"revés"`, `"sueltas"`, `"continua"`, etc. `clean("72°")` da «72» y `clean("4,8")` da «48», que sí coinciden con la palabra del subtítulo.
3. **24 fps reales**: la llanta filmada depende **solo** de `filmN(f, fps)`, que es entero. No uses `t * 24` sin `floor`, no interpoles entre fotogramas filmados y no apliques `useSpring` ni `k()` al ángulo. El modo «fotograma a fotograma» de la escena 4 recorre los mismos índices, solo que más despacio y rotulado.
4. **Aliasing del render a 30 fps**: la llanta real a 4,8 vueltas/s **tiene** que ir desenfocada por submuestreo. Si se pinta nítida, a 30 fps se leería hacia atrás y contradiría la escena. La carretera y la rueda del cierre cumplen la regla de 1/4 de periodo por fotograma.
5. **Cifras**: los pasos 68° y 76° son constantes internas y no aparecen en ningún texto, ni tampoco 360°, 1728 o 57,6. El reloj no lleva dígitos.
6. **Sin flashes**: no hay obturador de pantalla completa a 24 Hz. Solo se ilumina un tic.
