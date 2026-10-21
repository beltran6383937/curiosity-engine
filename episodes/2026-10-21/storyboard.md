# Storyboard · 2026-10-21 · Wombat: un intestino que fabrica heces casi cúbicas

Fuente única de cifras: `episode.json` (claims verificados, Yang et al., *Soft Matter* 17, 475-488, 2021).
Cifras permitidas en pantalla: **2021**, **17 %**, **×2 (grosor)**, **×4 (rigidez)**. Ninguna otra. No hay longitudes, tamaños de heces, número de esquinas medido ni velocidades de contracción en cifras.

## Identidad y reglas globales

- Lienzo 1080 × 1920. Subtítulos (`Captions`) en 300-480 px: no se dibuja nada importante ahí. Contenido entre 520 y 1540 px. Nada importante por debajo de 1540 px (`Source` ya termina en 1540).
- Tipografía: Hanken Grotesk (`SANS`, `T3` en 3D). Sin imágenes externas: todo con `Stage`/`Clay`/geometrías de three, SVG y CSS.
- Fondos profundos y cálidos, de madriguera: `BG = { top: "#07050a", mid: "#1a1210", glow: "#3a2618" }`.
- Paleta:
  - `OCHRE "#e3a96b"`: wombat, heces, acento de subtítulos (`accent`).
  - `WALL "#c98478"`: pared intestinal (zona fina).
  - `STIFF "#ff9a5c"`: zona gruesa/rígida.
  - `MINT "#7fe0c4"`: todo lo que sea **modelo/simulación** (malla, etiquetas «MODELO», trazos de cálculo). Así el espectador asocia el color con «predicción».
  - `ROSE "#ff7a6b"`: negaciones («sin molde», «sin grabación»).
- Luz: principal lateral cálida (`sun` a la izquierda y arriba), contraluz `rim` frío `#6fb8ff` muy suave para recortar siluetas. `env` activo solo en las escenas con arcilla (Clay barnizada); apagado en los esquemas planos.
- Movimiento: travellings lentos y un único movimiento por escena. Nada de zoom continuo; nada de `Dust`/partículas (como mucho un velo de polvo de tierra *estático y muy tenue* en la escena 1, opcional). Las transiciones entre escenas son las de `Reel` (fundido con leve desenfoque); las de abajo describen la continuidad lógica de formas.
- Etiqueta «Esquema, no a escala» (`Source`) en toda escena con anatomía o corte: escenas 2, 4, 5, 6, 7 y 8.
- Etiqueta permanente «MODELO» (`Tag`, MINT) en las escenas 6 y 7. Las frases 9-13 se visualizan como **simulación/esquema**, nunca como imagen realista de un intestino ni como «grabación».

## SCENES

```ts
const SCENES: SceneDef[] = [
  { from: 0, C: Hook },      // 0-1
  { from: 2, C: Inside },    // 2-3
  { from: 4, C: Study },     // 4
  { from: 5, C: Last17 },    // 5
  { from: 6, C: Wall },      // 6-8
  { from: 9, C: Model },     // 9-10
  { from: 11, C: NotSeen },  // 11-12
  { from: 13, C: Close },    // 13
];
```

---

### Escena 1 · Hook · from 0 (frases 0-1)

> 0 «¿Por qué el wombat hace cacas casi cúbicas?» · 1 «No usa ningún molde.»

- **Qué se ve**: wombat de arcilla (`Clay` OCHRE oscuro `#8a6242`): cuerpo = cápsula tumbada achatada, cabeza = esfera ancha, dos orejas = conos pequeños, hocico = esfera aplanada. Sentado sobre suelo invisible (`Floor`, sombra suave). A su lado, en primer plano a la derecha, tres heces modeladas como **cubos de aristas muy redondeadas** (`RoundedBox` construido a mano o `BoxGeometry` + `mergeVertices` + empuje esférico de vértices; radio de redondeo generoso: «casi» cúbicas, nunca cubos perfectos), apiladas de forma irregular, `Clay` `#5b3e2a`.
- **Cámara**: `cam` de `[1.6, 1.1, 9]` a `[0.6, 0.9, 7.8]` con `inOut` durante toda la escena (un solo travelling lateral, no zoom). `look` sobre las heces.
- **Dato programático**: al sonar «cúbicas» (`w(0, /cúbicas/)`) un contorno MINT fino de un cubo ideal se superpone a una de las heces y se desvanece: muestra que la forma se parece, pero no es exacta. Frase 1, en «molde» (`w(1, /molde/)`): aparece en el aire, a la izquierda, un molde de alambre (aristas de caja como tubos finos, blanco 40 %) y lo cruza una X ROSE; `Tag` «Sin molde» (ROSE) en y = 1360.
- **Transición**: el molde tachado se disuelve; la cámara termina encuadrando el costado del wombat, que es por donde entra la escena 2.
- **Paleta**: OCHRE + marrones de arcilla sobre `BG`; ROSE solo en la X.

### Escena 2 · Inside · from 2 (frases 2-3)

> 2 «El secreto está dentro de su intestino.» · 3 «Pero ¿cómo sale una esquina de un tubo blando?»

- **Qué se ve**: la silueta del wombat pasa a corte esquemático: contorno SVG del cuerpo (trazo OCHRE 30 %) y dentro un tubo intestinal dibujado como trazo grueso WALL que se recorre con `strokeDashoffset` (en «intestino», `w(2, /intestino/)`). Recorrido plegado y estilizado, claramente diagramático (curvas suaves, sin texturas de tejido).
- Frase 3: el tubo se «saca» del cuerpo y queda como un segmento recto en 3D (`TubeGeometry` recto, `Clay` WALL, translúcido `o=0.85`), visto en tres cuartos. Se aprecia su sección: **circular**. Junto a la boca del tubo, un pequeño cuadrado de esquinas vivas en contorno blanco con un «?» (Hanken 900, OCHRE) en «esquina» (`w(3, /esquina/)`).
- **Cámara**: fija durante el corte SVG; en frase 3 una órbita suave de 15° alrededor del tubo (de `[3, 1, 8]` a `[1.5, 1.4, 8.4]`).
- **Dato programático**: el trazado del intestino y su sección circular. No hay cifras.
- **Transición**: el tubo recto se queda en el centro y su color se apaga; la escena 3 lo deja de fondo desenfocado.
- **Paleta**: WALL sobre fondo profundo; OCHRE para el «?».
- `Source`: «Esquema, no a escala».

### Escena 3 · Study · from 4 (frase 4)

> 4 «En 2021, un equipo de científicos lo estudió a fondo.» (locución: «dos mil veintiuno»)

- **Qué se ve**: fondo con el tubo de la escena anterior muy desenfocado (CSS `filter: blur` sobre un `Stage` simple o un gradiente que lo sugiere). En el centro, el año en grande.
- **Cámara**: estática; solo el número entra con muelle (`useSpring`).
- **Dato programático**: `2021` en grande (usar `Num` como en VenusPilot o `Stat` con `from={2000}`; **no** `Stat` con `from=0`, porque `useGrouping` lo pintaría «2.021»). Debajo, `Tag` «Estudio» y `Source` con «Yang et al., Soft Matter, 2021».
- **Transición**: el «2021» se encoge y sube; el tubo de fondo se enfoca y se estira en horizontal, que es la barra de la escena 4.
- **Paleta**: OCHRE para el número; texto secundario `#dfe6ff`.

### Escena 4 · Last17 · from 5 (frase 5)

> 5 «Las heces toman forma en el último 17 % del intestino.»

- **Qué se ve**: el intestino rectificado como una barra horizontal (SVG, x 110→970, y ≈ 1000, alto 70 px, esquinas redondeadas, WALL 55 %). Etiquetas extremos: «inicio» a la izquierda, «final» a la derecha (Hanken 700, 30 px, mayúsculas).
- **Dato programático**: en «último» (`w(5, /último/)`) se ilumina el tramo final con anchura exacta **0,17 × longitud de la barra** (calculada, no a ojo), relleno STIFF→OCHRE. Llave/cota encima del tramo. En «17» `Stat` `to={17}` `suffix=" %"` sobre la barra (y ≈ 640, size ≈ 200, sub «del intestino»). Dentro del tramo iluminado, el contenido pasa de cilindro (círculo de sección) a sección redondeada-cuadrada de forma progresiva, solo como pictograma.
- **Cámara**: plano frontal; leve deriva horizontal de 20 px hacia la derecha (acompaña la lectura), sin zoom.
- **Transición**: zoom «lógico», no de cámara: el tramo del 17 % se separa de la barra y gira 90° hasta mostrarse de frente como un anillo: la sección transversal de la escena 5.
- **Paleta**: WALL apagado + tramo final en STIFF/OCHRE.
- `Source`: «Proporción del 17 % a escala; resto, esquema».

### Escena 5 · Wall · from 6 (frases 6-8)

> 6 «Allí la pared no es igual en todas partes.» · 7 «Hay zonas con el doble de grosor.» · 8 «Y cuatro veces más rígidas.»

- **Qué se ve**: corte transversal del intestino como anillo SVG centrado (cx 540, cy ≈ 960, radio medio ≈ 260). La pared alterna sectores finos (WALL) y sectores gruesos (STIFF). El número y reparto de sectores es **ilustrativo** (no es un dato del estudio): no se rotula ningún recuento.
- Frase 6: el anillo aparece uniforme y, al sonar «igual» (`w(6, /igual/)`), los sectores se diferencian en color.
- Frase 7, en «doble» (`w(7, /doble/)`): los sectores rígidos crecen hacia fuera hasta **exactamente el doble del grosor** de los finos (p. ej. 36 px frente a 18 px; proporción 2:1 calculada). Cotas a un sector fino y a uno grueso; `Tag` «×2 grosor» (STIFF) en y ≈ 1330.
- Frase 8, en «cuatro» (`w(8, /cuatro/)`): debajo del anillo (y 1360-1500) dos barras horizontales de rigidez relativa, «zona fina» = 1 unidad, «zona gruesa» = **4 unidades** (longitud 4:1 calculada). `Tag` «×4 rigidez» (STIFF, `solid`). Pequeña nota MINT 26 px: «medido en tejido».
- **Cámara**: frontal y fija; el anillo rota muy despacio (≈ 4°/s) para dar vida sin distraer.
- **Transición**: las barras de rigidez se retiran; el anillo se mantiene y cambia a estilo de malla MINT: entra en la escena 6 como simulación.
- **Paleta**: WALL / STIFF sobre `BG`; cotas en blanco 70 %.
- `Source`: «Esquema, no a escala · proporciones ×2 y ×4 sí».

### Escena 6 · Model · from 9 (frases 9-10)

> 9 «Según su modelo matemático, esas zonas rígidas se contraen más rápido.» · 10 «Y proponen que así nacen las esquinas.»

- **Qué se ve**: estética de simulación, no de anatomía: fondo con cuadrícula fina MINT 8 %, el anillo como malla de nodos (puntos MINT unidos por segmentos), sin brillos «biológicos». `Tag` «MODELO» (MINT) fijo arriba a la izquierda del área de contenido (x 70, y 540) durante toda la escena, con indicador «simulación» parpadeante sobrio (opacidad 0,5-1, sin REC rojo).
- Frase 9, en «rápido» (`w(9, /rápido/)`): los sectores rígidos avanzan hacia dentro antes que los finos (desfase temporal programático: `k(t, a, d)` con `d` menor para los rígidos). A la derecha del anillo, dos indicadores de progreso de contracción (`Arc` o barras SVG) «rígida» y «fina»: el de la rígida se llena antes. **Sin cifras de velocidad** (no existen en los claims).
- Frase 10, en «esquinas» (`w(10, /esquinas/)`): dentro del anillo, la sección del contenido (OCHRE, relleno) se transforma de círculo a cuadrado redondeado (interpolación de un superelipse: exponente de 2 a ≈ 4; nunca cuadrado de esquinas vivas). `Tag` «Propuesta» (MINT).
- **Precaución de fidelidad**: los claims no precisan en qué posición relativa a los sectores rígidos aparece cada esquina. Para no inventar, la deformación del contenido se dibuja **centrada pero sin alinear explícitamente esquinas con sectores** (o se valida con VERITAS antes de alinearlas).
- **Cámara**: fija; la malla gira 0°. Todo el movimiento lo hace la deformación.
- **Transición**: la malla se congela (la simulación «se pausa»); el color MINT se mantiene en la escena 7.
- **Paleta**: MINT dominante, OCHRE solo para el contenido.
- `Source`: «Modelo matemático (Yang et al., 2021) · esquema, no a escala».

### Escena 7 · NotSeen · from 11 (frases 11-12)

> 11 «Ojo: nadie lo ha visto en directo dentro de un wombat.» · 12 «Es lo que predicen las cuentas, no una grabación.»

- **Qué se ve**: frase 11: silueta del wombat de la escena 1 en contraluz (solo `rim`, cuerpo casi negro), con el contorno SVG del intestino de la escena 2 en trazo discontinuo. Sobre la zona del intestino, un marco de visor vacío (cuatro esquinas de encuadre en blanco 50 %) con `Tag` ROSE «No observado en vivo».
- Frase 12: pantalla dividida en dos tarjetas (x 70-520 y 560-1010, y 760-1300). Izquierda «CÁLCULO» (MINT): la malla congelada de la escena 6 en miniatura, con un check. Derecha «GRABACIÓN» (ROSE 60 %): marco vacío con X. Entrada escalonada en «cuentas» (`w(12, /cuentas/)`) y «grabación» (`w(12, /grabación/)`).
- **Cámara**: frase 11, travelling muy lento de izquierda a derecha sobre la silueta (`cam.x` de -0.4 a 0.4); frase 12, plano 2D estático.
- **Dato programático**: ninguno numérico; solo la distinción modelo / observación.
- **Transición**: la tarjeta «CÁLCULO» crece al centro y su malla se convierte en el tubo de arcilla de la escena 8.
- **Paleta**: siluetas negras con contraluz frío; MINT frente a ROSE.
- `Source`: «Esquema, no a escala».

### Escena 8 · Close · from 13 (frase 13)

> 13 «Un tubo blando que, según las matemáticas, sabe hacer esquinas.»

- **Qué se ve**: tramo de tubo de arcilla blanda (`Clay` WALL, `r=0.5`) flotando en diagonal, iluminación de estudio con contraluz cálido. Por su extremo asoma el contenido con sección de **cuadrado redondeado** (OCHRE), mismo superelipse que en la escena 6, para cerrar la idea. Sobre la superficie del tubo, una malla MINT tenue (opacidad 0,25) recuerda que es la versión del modelo.
- **Cámara**: un único travelling de retroceso lento y lateral (`cam` de `[1.2, 0.6, 8]` a `[2.2, 0.9, 10]`, `inOut`).
- **Dato programático**: ninguno nuevo. Título «WOMBAT» (Hanken 900, 140 px, OCHRE claro `#f2d3a8`, tracking amplio) en y ≈ 1300, entra en «esquinas» (`w(13, /esquinas/)`). `Source`: «Yang et al., Soft Matter 17, 475-488 (2021) · esquema, no a escala».
- **Transición**: final; fundido a `BG.top`.
- **Paleta**: WALL + OCHRE con un toque MINT.

---

## Notas para implementación (para ATLAS / quien monte el `.tsx`)

1. **Clave «17 %» en subtítulos**: `Captions` parte por espacios, así que «17» y «%» llegan como palabras separadas; `clean("17 %")` = «17%» no coincide con ninguna. Para que se resalte, añadir `"17"` a `KEYS` (y opcionalmente `"%"`).
2. **«2021»**: la locución dice «dos mil veintiuno» (`say`). Si el alineador produce palabras en texto hablado, `w(4, /2021/)` no encontrará la palabra; usar `/2021|dos/` como en VenusPilot (`/117|ciento/`).
3. Las cifras ×2 y ×4 y el 17 % se dibujan con proporciones calculadas en código (2:1, 4:1, 0,17), no a ojo.
4. Ninguna escena debe sugerir una imagen real del interior de un wombat: corte SVG, malla y arcilla estilizada únicamente.
