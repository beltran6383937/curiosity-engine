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

Esta versión corrige lo que rechazó SENTINEL (80 < 90): el morro salía cortado, el modelo era tosco y la escena estaba vacía. Todo se construye con geometría de three y `kit`, sin assets externos. **Ninguna cifra en pantalla** en esta escena. Todas las coordenadas son de mundo y **se elimina el `group scale={0.8}`** actual, así que se pasan tal cual.

#### Composición (de fondo a primer plano)

Plano en tres cuartos dentro de una madriguera. Al fondo y a la derecha, la boca del túnel. En el centro, el wombat acaba de salir y mira hacia la izquierda del espectador. Delante y a la derecha, la pila de heces casi cúbicas. En los bordes inferiores, hierba y terrones desenfocados. Con el encuadre de abajo, el wombat queda entre unos 780 y 1250 px de alto, las heces entre unos 1000 y 1300 px y el suelo llega hasta 1540 px. Por encima, la luz y el montículo del túnel llenan la franja de 520 a 780 px.

#### Cámara y encuadre (margen de seguridad)

- `Stage` `fov={40}` (el del kit), `look={[0.15, 0.7, 0.2]}`, que es **fijo** durante toda la escena.
- Un solo travelling lateral con un leve avance, sin zoom de lente: `cam = [mix(1.5, 0.7, p), mix(1.35, 1.1, p), mix(7.4, 6.8, p)]`, con `p = k(t, 0, len, inOut)`. La distancia al `look` solo pasa de unos 7,4 a unos 6,6, así que se percibe como desplazamiento y no como zoom.
- **Regla de margen**: el wombat entero (morro, mejilla izquierda, orejas y grupa), la pila de heces y el molde de alambre cumplen `|ndc.x| ≤ 0,76`, es decir, al menos un 12 % del ancho hasta cada borde, **en todo el travelling**. En vertical van entre 520 y 1540 px: `ndc.y` entre `+0,458` y `−0,604`. Lo más ajustado es al final del travelling:
  - morro del wombat: ≈ −0,63;
  - mejilla izquierda: ≈ −0,67;
  - arista derecha de la pila: ≈ +0,71;
  - esquina izquierda del molde: ≈ −0,68.
  
  Al inicio (p = 0) todo queda más centrado (≈ −0,62 / +0,55).
- **Comprobación programática obligatoria**: añadir `remotion/scripts/check-hook-frame.ts`, que se ejecuta con `npx tsx` y no entra en el render. No hace falta dibujar nada. Debe:
  1. Construir `new THREE.PerspectiveCamera(40, 1080 / 1920, 0.1, 400)`.
  2. Para `p` en 0, 0,05, …, 1, colocar la cámara con la fórmula de arriba (aplicando `inOut` a `p`), hacer `lookAt(0.15, 0.7, 0.2)` y `updateMatrixWorld()`.
  3. Proyectar con `v.applyMatrix4(mesh.matrixWorld).project(cam)` **todos los vértices** de la geometría del wombat, de las tres heces y de las aristas del molde.
  4. Fallar si algún vértice sale de `|x| ≤ 0,76` o `−0,604 ≤ y ≤ 0,458`.
  
  Si falla, se corrige primero desplazando `look.x` (±0,05) y, si no basta, moviendo el wombat en x. **No** se corrige alejando la cámara.
- El montículo, la pared del fondo, el suelo y el primer plano desenfocado **sí pueden salir del cuadro**: son entorno, no sujeto.

#### Wombat: silueta nueva (cabeza fundida con el cuerpo)

- **Cuerpo, cabeza, hocico y patas en una sola malla** con `MarchingCubes` (`import { MarchingCubes } from "three/examples/jsm/objects/MarchingCubes.js"`, que viene con three). Se calcula una vez en `useMemo`:
  - Crear `new MarchingCubes(72, mat, false, false, 120000)` con `isolation = 80` y `scale.setScalar(S = 1.25)`.
  - Llamar a `reset()`, luego `addBall(...)` por cada bola y por último `update()`.
  - Para pasar de coordenadas locales del modelo a coordenadas normalizadas: `u = 0.5 + x / (2 * S)`, y lo mismo con y y z. Para centrar la altura, restar 0,5 a y antes de convertir y volver a sumarlo con `position.y` del objeto.
  - El radio de la superficie de una bola aislada es `r = sqrt(strength / (isolation + subtract))`. Con `subtract = 12` sale `strength = 92 · r²`. Como los campos se suman, el conjunto engorda: empezar con `strength × 0,8` y ajustar a ojo.
  - Todas las bolas deben quedar dentro de u ∈ [0,1; 0,9]. Si tocan el límite de la rejilla, la malla sale con agujeros.
  - El resultado se monta con `<primitive object={mc} castShadow />` y material `Clay` (`meshPhysicalMaterial`, FUR `#8a6242`, `roughness 0.6`).
- Bolas de referencia en unidades locales `(x, y, z, r)`. La cabeza mira a −x.
  - grupa `(0.55, 0.50, 0, 0.42)`
  - lomo `(0.10, 0.50, 0, 0.44)`
  - pecho `(−0.35, 0.46, 0, 0.38)`
  - cuello y hombro `(−0.62, 0.52, 0, 0.30)`, que es el puente y evita la costura
  - cabeza ancha y achatada: dos bolas `(−0.84, 0.56, ±0.10, 0.26)`
  - hocico `(−1.03, 0.47, 0, 0.17)`
  - patas: cuatro bolas cortas `(±0.42, 0.17, ±0.24, 0.13)` que se funden con el vientre. Quedan rechonchas y medio ocultas, como en un wombat real, sin «palitos».
  
  Después, `mc.scale` en z × 0,9 para que el cuerpo no sea un tubo redondo. Así la silueta tiene la grupa alta y redondeada, el lomo arqueado, el pecho más bajo y la cabeza ancha unida al cuerpo sin cuello visible.
- **Piezas añadidas** (mallas aparte, siempre **hundidas al menos un 40 %** en la superficie para que no se vea ningún hueco ni costura desde ningún punto del travelling):
  - Orejas: dos elipsoides (`sphereGeometry(0.1)` con `scale [0.6, 1.0, 0.35]`) en `(−0.76, 0.84, ±0.17)`, `rotation [±0.35, 0, 0.15]` y color FUR. Dentro de cada una va otro elipsoide más pequeño, `#5a3c28`, adelantado 0,02 hacia la cara. Son orejas pequeñas y redondeadas, **no conos**.
  - Nariz: un elipsoide ancho (`sphereGeometry(0.1)` con `scale [0.55, 0.6, 1.1]`) en `(−1.15, 0.50, 0)`, color `#241610`, `roughness 0.35`. Es una nariz ancha y chata, hundida la mitad en el hocico.
  - Ojos: esferas de `r 0.028` en `(−0.93, 0.64, ±0.16)`, color `#0d0806`, `roughness 0.15`, hundidas la mitad.
- **Instancia**: `position [−0.15, 0, 0]`, `rotation [0, 1.05, 0]` (la cabeza hacia la izquierda y hacia la cámara, en tres cuartos), `scale 0.85`.
- **Plan B**, solo si `MarchingCubes` diera problemas en el render: mantener las primitivas, pero con un elipsoide «cuello» que se solape un 35 % con la cabeza y con el cuerpo, la cabeza hundida un 30 % en el pecho y las patas hundidas un 60 % bajo el vientre. Quedan prohibidas las cápsulas sueltas con forma de salchicha y los conos como orejas.

#### Heces casi cúbicas

- Se mantiene `RoundedBox` (`radius ≈ 0.09`, `smoothness 5`, `Clay POO #5b3e2a`, `r 0.55`): son «casi» cúbicas, **nunca** cubos de aristas vivas. Nuevas posiciones (`p`, `r`, `s`):
  - `[0.50, 0.16, 1.35]`, `[0, 0.35, 0]`, `[0.33, 0.31, 0.32]`
  - `[0.85, 0.16, 1.20]`, `[0, −0.25, 0.03]`, `[0.31, 0.30, 0.34]`
  - `[0.68, 0.46, 1.28]`, `[0.06, 0.6, −0.08]`, `[0.30, 0.30, 0.31]`
- Tapan en parte las patas traseras del wombat, lo que da profundidad. Nunca le tapan la cabeza ni el lomo.

#### Relleno de escena (sin cifras)

- **Suelo de tierra visible**: `circleGeometry(7, 64)` horizontal en y = 0, `meshStandardMaterial` `#24170f`, `roughness 1`, `receiveShadow`. Lleva un `alphaMap` radial (un `CanvasTexture` hecho en código, blanco en el centro y negro en el borde) para que se funda con `Backdrop` sin borde visible. Sustituye al `Floor` invisible.
- **Madriguera**:
  - Montículo de tierra detrás y a la derecha: `useRock("e1021-mont", 4, 0.18, [2.2, 1.8, 1.3])` centrado en `[0.6, 0, −2.6]`, con media roca bajo el suelo, `meshStandardMaterial` `#3b2619`, `roughness 0.95`.
  - Boca del túnel en la cara frontal del montículo, centrada en `[1.0, 0.5, −1.5]` y con `rotation y −0.25`:
    - un disco `circleGeometry(0.6)` con `scale [1, 0.85, 1]` y `meshBasicMaterial #050304`;
    - detrás, un cilindro abierto corto (`radius 0.6`, `length 1.2`, `side BackSide`, `#120b07`) para que el hueco tenga fondo;
    - un labio de tierra, `torusGeometry(0.62, 0.14, 16, 48, Math.PI * 1.15)`, que cubre la parte superior y los lados de la boca, en `#4a301f`.
  - Pared de fondo: un cilindro abierto (`radius 6`, `height 6`, `thetaLength ≈ π·0,8`, `side BackSide`, `#2a1b12`, `roughness 1`) que envuelve la escena por detrás (z ≈ −4). Así el espectador sabe que está bajo tierra.
  - Unas pocas raíces (4 o 5 `TubeGeometry` finos sobre `CatmullRomCurve3` deterministas, radio 0,015-0,03, `#3a2618`) cuelgan de y ≈ 2,6 a 3,2 junto a la pared. Son estáticas.
- **Terrones**: entre 8 y 10 `useRock(\`e1021-terron${i}\`, 2, 0.35)`, con escala 0,05-0,14 y colores `#4a301f` y `#5a3a26` alternos. Material `meshStandardMaterial` **mate** (`roughness 0.9`, sin clearcoat). Así se distinguen de las heces, que son la única pieza barnizada y la única con aspecto cúbico. Se reparten de forma determinista (`random`) alrededor de la boca del túnel y por el suelo, a más de 0,35 de la pila de heces para no confundirlos con ella.
- **Hierba**: entre 5 y 7 matas en el borde del montículo y del suelo. Cada mata tiene de 7 a 12 hojas: `coneGeometry(0.012, h, 4)` con h entre 0,25 y 0,45, inclinadas entre ±0,35 rad de forma determinista, en colores oliva apagados `#5d6b3a` y `#7a7d45`, `roughness 0.8`. Son estáticas, sin viento.
- **Luz volumétrica estática y tenue**: un haz que entra desde arriba a la izquierda, alineado con `sun`, hasta el lomo del wombat.
  - Geometría: `coneGeometry(1.1, 5, 32, 1, true)` con el vértice en `[−2.5, 4.5, 0.5]`, orientado hacia `[−0.2, 0, 0.3]`.
  - Material: `meshBasicMaterial` `#ffcf9a`, `transparent`, `opacity 0.07`, `AdditiveBlending`, `depthWrite false`, `side DoubleSide`, `toneMapped false`.
  - Lleva un `alphaMap` de gradiente vertical que es **0 en su tercio superior**, para que no ilumine la franja de subtítulos (300-480 px), y se desvanece suavemente cerca del suelo.
  - No se mueve ni parpadea. No hay polvo dentro del haz (se descarta el velo opcional).
- **Sombra de contacto**: además de la sombra del `sun`, va un plano en `y = 0.003` bajo el wombat, de `1.6 × 1.0` y girado igual que él. Usa un `CanvasTexture` radial negro, `opacity 0.55`, `depthWrite false`. Bajo la pila va otro de `0.9 × 0.7`, con `opacity 0.6`. Con esto el wombat y las heces se apoyan en el suelo y no flotan.
- **Profundidad**:
  - `<fog attach="fog" args={[BG.mid, 8, 15]} />`: la pared y el montículo se oscurecen hacia el fondo.
  - Primer plano desenfocado en 2D, porque no hay postproceso: una capa SVG por encima del `Stage` con 2 o 3 siluetas de hierba y terrón en las esquinas inferiores (x < 260 y x > 820, y 1380-1540). Color `#120b07` al 85 %, `filter: blur(14px)` y parallax `translate: ${mix(0, -60, p)}px 0`, más rápido que la cámara para que parezca cercano. **El centro inferior queda libre** para `Source`.

#### Dato programático (sin cambios de lógica, solo de posición)

- En «cúbicas» (`w(0, /cúbicas/)`), el `WireBox` MINT (`s = 0.37`, `r = 0.008`) se superpone a `POOS[0]` (con su misma `p` y `r`) y se desvanece a los 1,3 s. Muestra que la forma se parece a un cubo pero no es exacta.
- En «molde» (`w(1, /molde/)`), aparece un molde de alambre blanco al 40 % (`WireBox s = 0.5`, `r = 0.012`) en el aire, por encima y a la izquierda de la cabeza: `position [−0.35, 1.4, 0.3]`, `rotation [0.25, 0.5, 0]`. Queda por debajo de y ≈ 548 px y por encima de las orejas.
- Lo cruza una X ROSE (dos barras de `0.04 × (0.8·cross) × 0.04`, desplazadas `z +0.28`).
- `Tag` «Sin molde» en ROSE, en `x 540`, `y 1360`, centrado y por debajo de la pila.

#### Fuente

- `Source` «Ilustración, no a escala» (`at 0.3`). Hace falta porque las heces están muy exageradas respecto al wombat.

#### Transición y paleta

- **Transición**: el molde tachado se disuelve y la cámara termina encuadrando el costado del wombat, que es por donde entra la escena 2. La luz del haz se mantiene igual hasta el corte.
- **Paleta**: OCHRE y marrones de arcilla y tierra (`#24170f`, `#3b2619`, `#4a301f`, FUR, POO) sobre `BG`, con oliva apagado solo en la hierba. ROSE solo en la X y en la etiqueta. MINT solo en el contorno del cubo ideal.

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
