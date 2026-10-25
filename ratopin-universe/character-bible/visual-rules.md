# Ratopín · Reglas visuales

## Nunca cambia (sin aprobación de Beltrán)
- Estructura de la cara, forma de los ojos (grandes, ovalados, pupila negra con brillo), distancia entre orejas (grandes y redondas).
- Hocico largo con nariz negra, **dos dientes delanteros siempre visibles**, mechón de pelo de punta, bigotes.
- Proporción cabeza/cuerpo (ver [proportions.md](proportions.md)).
- Ropa: camiseta blanca de manga corta, mono vaquero gris con bolsillo de peto y dos hebillas metálicas, bajos remangados, cinturón de cuero con hebilla rectangular y bolsillos, botas de trabajo con cordones.
- Cola larga con anillos, gruesa en la base y fina en la punta; sale por detrás del mono.
- Estilo: **lápiz de grafito a mano, blanco y negro**, contorno oscuro de grosor constante, sombreado de trama suave.

## Puede cambiar si el guion lo pide
Expresión, postura, acción, accesorios (herramientas, móvil, cable), plano y ángulo de cámara.
Una expresión, una vista lateral o un cambio de plano **no** pueden alterar su anatomía ni su ropa.

## Cómo se consigue
- Ratopín nunca se genera desde cero en un episodio. Solo se usan **piezas aprobadas** del rig (cabezas, bocas, manos, brazos, cuerpo) y se animan; las pupilas, párpados, cejas y pantallas se dibujan por código con el mismo trazo.
- Una pieza nueva entra a la biblioteca solo tras aprobarla y con versión (`v1`, `v2`…). Una versión nueva nunca sobrescribe la anterior.

## Animación
- 12 dibujos por segundo; **ningún dibujo idéntico al anterior** (respiración, cola, orejas, bigotes y temblor de línea siempre activos).
- Poses clave → intermedios → entre-dibujos, arcos, anticipación, inercia, squash & stretch controlado.
- Los ojos guían los giros; orejas y cola llegan tarde (follow-through).
- Las herramientas no se sueltan de la mano; los pies no resbalan.

## Rechazo automático
Aspecto 3D · color o degradados en Ratopín · morphing entre imágenes · transiciones de diapositiva · zooms para fingir movimiento · partículas sin motivo · manos con dedos distintos a la referencia · objetos que aparecen y desaparecen · fondos que cambian solos · personaje quieto.

## Marca
Ratopín es la cara de las redes de P&Q. El logo P✦Q y la web no cambian. La tarjeta final usa la paleta de marca (marfil #FAF9F6, grafito #303B43, champán #C5A574) sobre el dibujo a lápiz. (Paleta de la tarjeta: PROPUESTA.)
