# Storyboard 2026-10-24 · El parte que se escribe a las 22:00

Estilo: ilustración vectorial de marca (noche, pizarra, oro, lino, luz) con un mundo completo en cada plano. El rojo y el naranja solo se usan como aviso puntual, y en este episodio no hace falta ninguno. El tono es de oficio y de cansancio, nunca de burla. Nada infantil, ni robots, ni cerebros, ni neón.
Personajes (todos ficticios):
- **Ella, fontanera.** Variante de `Worker` con coleta que sale por detrás de la gorra, chaqueta pizarra con franja oro y caja de herramientas propia. Va tranquila y con la postura recta.
- **Él, técnico.** Es el `Worker` base. Se le dibuja cansado: hombros algo caídos y cabeza baja con `lean` y `head` suaves. Nunca torpe ni ridículo. Sobre él no van golpes, temblores, partículas ni efectos cómicos en ningún plano.

Rótulos fijos (`Label`, arriba a la izquierda):
- «RECREACIÓN · personajes ficticios» en todos los planos de las frases 0-9, desde el fotograma 0.
- «DEMO · DATOS FICTICIOS» debajo del anterior (top ≈ 290) en todos los planos de las frases 6-9. En la frase 10 va solo, como único rótulo.
- `Label` tiene `top: 230` fijo. Para apilar dos rótulos hay que envolver el segundo en un div con `translate: 0 62px` o añadir una prop `y`.
- En el gancho (frase 0) la pantalla del móvil de ella solo brilla, sin interfaz legible, así que no lleva rótulo DEMO.

Subtítulos palabra a palabra (`PQCaptions`) en la banda 1340-1480, con las keys de episode.json en oro.

Pantalla del móvil (vale para todas las frases): ilustración genérica. Lleva una tarjeta clara con la cabecera «Parte» y la fecha «hoy», tres o cuatro barras grises de marcador sin etiquetas y, al cerrarse, un círculo con check oro. Prohibido: botón o icono de cámara, lista de materiales, recuadro de firma, «Enviado», «Factura», nombres, direcciones, teléfonos y logos. Las furgonetas solo llevan rótulos genéricos («FONTANERÍA», «INSTALACIONES»). No aparece ninguna marca.

Seguridad: en las frases 6-9 ella está de pie en la acera o sentada en su casa, nunca dentro de la furgoneta con el móvil. El vehículo está parado (faros apagados, sin humo ni movimiento de calle). En ningún plano se ve el móvil mientras alguien conduce.

| # | Frases | Plano y acción | Cámara | Texto en pantalla | Transición | Sonido |
|---|---|---|---|---|---|---|
| 1 | 0 (gancho, 0-2 s) | **Pantalla partida desde el fotograma 0**, con una línea oro horizontal en y≈960. **Arriba**: atardecer, puerta del cliente iluminada por el aplique del porche (escenario nuevo, ver abajo) y ella de pie en el umbral con el móvil en la mano (`POSE.phone`, `phoneInHand`, la pantalla se enciende con `screen` 0→1 y solo brilla, sin interfaz). **Abajo**: `Kitchen` de casa de noche, con un reloj de pared que marca 22:00, él de pie tras la encimera inclinado sobre una libreta y el plato tapado a un lado. En «cena» los dos paneles se oscurecen un poco y la pregunta queda en el centro | Arriba, empuje lento hacia ella. Abajo, cámara fija un poco alta, sin movimiento brusco | «En la puerta» (oro, panel de arriba) · «22:00 · en la cocina» (lino, panel de abajo) · «¿Quién cena antes?» (`Headline`, «*cena*» en serif oro, entra en «cena») | — | tic de reloj suave · pop en «cena» |
| 2 | 1 | `Room` (salón en obra, `lamp=1`: la obra está hecha). Él termina, cierra la caja con `Toolbox open` 1→0 justo en «recoge», la levanta y sale caminando (`walkA`/`walkB`). Corte interno a `Street` (label «INSTALACIONES»): la furgoneta arranca y sale del plano en «se va» (`vanX` 300→1300). Por dentro no se ve a nadie con el móvil | Plano medio que le sigue en lateral. En la calle, plano general fijo | «Última obra» (`Chip` pequeño lino) | barrido | clac de caja en «recoge» · motor que se aleja |
| 3 | 2 | Interior de la furgoneta en marcha visto desde fuera, por la ventanilla lateral (escenario nuevo). La libreta va en el asiento del copiloto, cerrada. Él mira la carretera con las dos manos en el volante. En «luego» la libreta se desliza un poco al fondo del asiento, sin dramatismo | Seguimiento lateral con paralaje (`Par`): farolas de fondo con depth 0.4 | «El parte → luego» (`Chip` lino; «luego» entra en la palabra) | barrido | tic |
| 4 | 3 | `Kitchen` de noche (`tripped=0`, la ventana con capa azul noche por encima del atardecer y una `Lamp on=1` sobre la encimera). Él entra y deja las llaves. El plato de cena sin vapor (fría) se coloca en «cena fría». En «libreta» la abre sobre la encimera y coge el bolígrafo. El reloj de pared marca 22:00. Es un gesto cansado: suspira y se frota los ojos con la mano libre | Empuje muy lento hacia él, con luz cálida de lámpara sobre la libreta | «22:00» (mono oro, en el reloj del mundo, no en `Chip`) | fundido corto | ambiente de cocina, nevera, reloj |
| 5 | 4 | Mismo plano. Encima de él flotan tres siluetas de puertas o portales (casas del día, sin números ni nombres) que se desdibujan una tras otra (blur y opacidad) en «acuerda». La mano se le queda quieta sobre la libreta | Acercamiento suave a la libreta y a su cara de perfil | «¿Qué casa era…?» (`Bubble` gris de pensamiento, una sola) | — | tono grave suave, sin golpe |
| 6 | 5 | Plano general de la cocina: él se queda solo en el cono de luz y la casa a oscuras. Nada se mueve más que la cámara. En «otra forma» la luz de la lámpara se templa un poco. Es el plano de respeto: ni cómico, ni triste en exceso | Retroceso lento (pull-back) que le deja pequeño en el encuadre | «No es él.» · «Nadie le ha dado *otra forma*.» (`Headline`, «otra forma» en serif oro) | — | silencio musical breve en «mal», la música vuelve en «forma» |
| 7 | 6 | Volvemos al atardecer, a la puerta del cliente. Ella sale con la caja de herramientas, la deja en el escalón (`Toolbox`) y se queda de pie en la acera con el móvil (`POSE.phone`, `phoneInHand`). La furgoneta «FONTANERÍA» está aparcada detrás, con los faros apagados. En «móvil» se enciende la pantalla y aparece la tarjeta genérica del parte | Plano medio frontal y algo bajo, quieto | Tarjeta del parte (genérica, sale con `Card` desde abajo) | barrido | pop suave al encenderse la pantalla |
| 8 | 7 | Contraplano por encima de su hombro: en primer término el móvil con la tarjeta del parte, cuyas barras grises se van rellenando de oro una a una. Al fondo, por la puerta abierta, se ve el trabajo terminado: un lavabo nuevo con su grifo y un brillo limpio. En «delante» la cámara hace foco en el lavabo, que se ilumina con un `Glow` suave | Sobre el hombro, con un ligero rack focus del móvil al lavabo en «delante» | Tarjeta del parte (barras rellenándose, sin etiquetas) | — | tecleo suave ×3 |
| 9 | 8 | Plano general de acera: ella de pie, la furgoneta parada detrás (`Street` con `t` congelado para que las marcas de la calzada no se muevan). En «cierra» el check oro se sella en la tarjeta (`Impact` pequeño oro **sobre el móvil, no sobre ella**). En «a pie» la cámara baja un instante a sus botas, apoyadas en la acera. Después guarda el móvil en el bolsillo, coge la caja y abre la puerta de la furgoneta. El plano termina antes de que arranque | Plano general, tilt a las botas en «pie» y vuelta al plano | «A pie · furgoneta parada» (`Chip` lino, entra en «pie»). Nada de «de camino» | — | ding en «cierra» · puerta de furgoneta |
| 10 | 9 | Su casa, de noche: `Kitchen` (variante de casa) con plato humeante y luz cálida. Ella se sienta a cenar y deja el móvil en la mesa, a un lado, con la tarjeta del parte cerrada (check oro) y la pantalla atenuándose. En «cerrado» la luz de la lámpara se enciende del todo (`Lamp on` 0.6→1) y el móvil se apaga | Plano medio con empuje lento | «Día cerrado» (`Chip` oro sólido, entra en «cerrado») | fundido | ding suave |
| 11 | 10 | Sin personajes. El móvil en primer plano sobre fondo noche con la tarjeta genérica del parte cerrada (check oro). Detrás, la silueta de la furgoneta parada desenfocada. Solo «DEMO · DATOS FICTICIOS» | Rotación lenta del móvil (r 6→0) y acercamiento | «Lo estamos montando *para instaladores.*» (`Headline`) | barrido | pop |
| 12 | 11 | `EndCard`: monograma P✦Q, PÉREZ & QUINTANO y perezandquintano.es. Debajo, `CommentBox` con la palabra «PARTE» escribiéndose | Escala lenta del `EndCard` | «Comenta *PARTE*» · «Te lo enseñamos en una *videollamada*.» · pie «Recreación ficticia · voz generada con IA». Nada de «al momento» | fundido | pop al publicar el comentario |

## Componentes del kit

- `../pq`: `PQReel`, `World`, `Cam`, `Par`, `Glow`, `Impact` (solo frase 8, pequeño y en oro, sobre el móvil), `Label`, `Chip`, `Headline`, `Bubble` (pensamiento de la frase 4), `Card` (tarjeta genérica del parte), `EndCard`, `CommentBox` (keyword «PARTE»), `PQCaptions`, `Vignette`, `Grain`.
- `../pqworld`: `Worker` (él, y ella con la variante de coleta), `POSE` (`stand`, `phone`, `walkA`/`walkB`, `idle`), `poseAt`/`blendPose`, `Room` (`lamp=1`), `Kitchen` (`tripped=0`), `Street` (labels «INSTALACIONES» y «FONTANERÍA»), `Toolbox` (`open` 1→0 en «recoge»), `Lamp`.
- Se descartan para este episodio: `shake`, `SpeedLines`, `Burst`, `Flash`, `RingWaves`, `CallCard`, `AgendaCard`, `ResultList`, `Toast`, `PhoneProp` con `ring` y `Ladder`.

## Escenarios, poses y props que MOTION tiene que dibujar en la escena

1. **Puerta del cliente al atardecer** (frases 0, 6, 7, 8). Fachada de casa adosada con puerta de madera abierta, aplique de porche cálido con `Glow`, un escalón y la acera. Al fondo, el cielo de `Street` y la furgoneta aparcada. Por la puerta abierta se ve el interior: un baño con un lavabo nuevo y su grifo (frase 7). Sin número de portal ni nombre.
2. **Furgoneta por dentro, vista desde la ventanilla lateral** (frase 2). Asiento del conductor con él y las manos en el volante, asiento del copiloto con la libreta cerrada, y farolas pasando por fuera con paralaje. Sin móvil a la vista y sin salpicadero con pantalla.
3. **Cocina de casa de noche** (frases 0, 3, 4, 5, 9). Sobre `Kitchen` (`tripped=0`), poner una capa azul noche en la ventana o añadir una prop `night`. Además: reloj de pared a 22:00, `Lamp` encendida sobre la encimera, plato y llaves. En la frase 9 la misma cocina cambia a mesa con silla y plato humeante (es su casa: otro color de pared, lino cálido).
4. **Pose nueva `write`** (él escribiendo de pie tras la encimera). Tronco inclinado (`lean` ≈ 14), cabeza baja (`head` ≈ 20), mano delantera a la altura de la encimera con bolígrafo y mano trasera apoyada. Y una variante `tired` para la frase 5: hombros caídos, mano quieta. Para ella sentada en la frase 9, una pose `sit`.
5. **Variante de `Worker` para ella**. Coleta (una elipse de pelo detrás de la gorra) y franja oro un poco más estrecha. Mantener el mismo esqueleto y las mismas poses.
6. **Libreta**. Cuaderno de tapa pizarra que se abre en «libreta», con líneas lino y garabatos ilegibles (no se lee nada).
7. **Tarjeta genérica del parte en el móvil**: cabecera «Parte», «hoy», barras de marcador y check oro al cerrar. Nada más.

## Riesgos revisados

- Ninguna cifra de tiempo ni de ahorro. El 22:00 es solo atrezo de la recreación.
- No se dibujan foto, materiales, firma, envío ni factura.
- El parte se cierra a pie con la furgoneta parada, y el texto nunca dice «de camino».
- El técnico de la cocina aparece cansado y tratado con respeto, sin efectos encima.
- No hay marcas, logos ni datos personales.
- El CTA está comprobado por VERITAS (videollamada en perezandquintano.es). SENTINEL tiene pendiente rellenar `publication.cta` (resource_url y resource_checked).
- En la caption: «Voz generada con IA.» y la marca de contenido IA en TikTok.
