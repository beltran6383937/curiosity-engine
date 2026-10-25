# Prueba de movimiento · 5 s · hoja de tiempos

Objetivo (MASTER PROMPT §18): Ratopín trabaja → oye el móvil → pone los ojos en blanco → gira la cabeza → lleva la mano al móvil → lo agarra → lo mira incrédulo. **Un solo plano continuo, sin saltos entre poses.**

- Entrega: MP4 H.264 1080×1920, contenedor a 24 fps. **Ratopín cambia de dibujo cada 2 fotogramas (12 dibujos/s)**; la cámara se mueve en cada fotograma.
- 5 s = **60 dibujos (D0–D59), todos distintos.** Capa siempre activa: respiración (torso ±1,5 % en Y, ciclo de 30 dibujos), cola (onda, desfase 4 dibujos), bigotes, temblor de línea (semilla nueva en cada dibujo).
- Piezas: H1–H5 = cabezas del ASSET 3 · M1–M12 = bocas del ASSET 4 · Mc/Ml = manos de los brazos cercano/lejano (ASSET 5/6). Las pupilas, párpados, cejas y pantalla se dibujan por código.

| Dibujos | Tiempo | Acción | Detalle de animación |
|---|---|---|---|
| D0–D11 | 0,00–0,92 s | **Trabaja** | Dos tirones de llave (cada uno: 4 dibujos de tirón con ease-in + 2 de vuelta). El torso acompaña ±2°. H1 con las pupilas arriba a la derecha (la abrazadera), cejas concentradas, M10 suave. Sonido «clinc» en D0 y D6 |
| D8 | 0,67 s | **Vibra el móvil** | El móvil tiembla ±3 px en cada fotograma, con rayas de vibración a lápiz. «Bzzz» a partir de D8 |
| D12–D17 | 1,00–1,42 s | **Se congela** | La llave se para a mitad de tirón y se asienta 1 dibujo. Las pupilas se van hacia el sonido sin mover la cabeza (los ojos guían). Una ceja baja |
| D18–D27 | 1,50–2,25 s | **Ojos en blanco + suspiro** | Las pupilas recorren un arco hacia arriba con los párpados a media altura. Las cejas suben y caen. Cabeza −4° hacia atrás. Torso: inspira en D18–D23 (sube) y espira en D24–D27 (baja), M3 al espirar |
| D28–D37 | 2,33–3,08 s | **Gira la cabeza** | Anticipación: D28–D29 H1 baja 3° en sentido contrario. Sustitución H2 (D30–31) → H3 (D32–33) → H4 (D34–35) → H5 (D36–37), con exceso de +4° y asentamiento. Las orejas y los bigotes se retrasan 2 dibujos. Las pupilas llegan antes que la cabeza, abajo a la izquierda (la funda) |
| D30–D44 | 2,50–3,67 s | **La mano va al móvil** | Anticipación D30–D32: la mano se levanta un poco hacia atrás. Alcance en arco D33–D40 con ease (Mc-d abierta) → D41–D42 Mc-e media cerrada → D43–D44 agarra (Mc-f, la funda queda vacía). El torso se inclina −4° hacia el móvil |
| D45–D52 | 3,75–4,42 s | **Sube el móvil a la cara** | Arco de la cadera a la cara con frenada larga. Mc-g con la pantalla hacia el espectador: «El del aire acondicionado (3)». La cabeza sigue al móvil y las pupilas lo siguen en cada dibujo |
| D53–D59 | 4,42–5,00 s | **Incredulidad** | Las pupilas encogen y los párpados de arriba suben. Las cejas se disparan (pasan de largo en D53–D55 y se asientan). M11. Cabeza aplastada 0,97 en D53, estirada 1,03 en D55 y asentada. El móvil sigue vibrando. Mirada muerta: no hay parpadeo |

**Cámara:** respiración de cámara en mano (±6 px, Perlin lento) durante todo el plano. Empuje 1,00 → 1,12 hacia la cara en D44–D59 con ease-out. Fondo y primer término con un paralaje mínimo.

**Sonido:** clinc de la llave, bzzz continuo, suspiro (voz de Ratopín sin palabras) y nada de música: el silencio sostiene el remate.

**Criterios de aceptación (comprobados, no a ojo):**
1. 60 dibujos y ningún par consecutivo idéntico (diferencia de píxeles > umbral).
2. Solo se usan piezas aprobadas (hash de cada PNG contra `approved-references/` y la biblioteca del rig).
3. Las articulaciones no se separan: la distancia hombro-codo-muñeca es constante en todos los dibujos.
4. La herramienta y el móvil siguen pegados a la mano y los pies no se mueven.
5. Tira de contacto con los 60 dibujos para revisar los arcos y el espaciado.
6. Beltrán la ve y la aprueba. Si no la aprueba, no se avanza al episodio.
